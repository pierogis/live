/*
 * Forage game engine: pure logic, no DOM. Imports use `.ts` so node scripts can
 * load this file directly.
 *
 * A pixel picture is made of colored blocks. Below it are columns of ant
 * colonies, each with a color and a count of ants. Tap the front colony of a
 * column and it goes to work in one of 5 slots, sending its ants one at a time
 * to eat blocks of its color, but only blocks that are exposed: a side touches
 * empty space that reaches the outside of the picture. Holes sealed inside the
 * picture don't count until something opens a way to them. Ants eat from the
 * outside in, so eating a block can expose the one behind it.
 *
 * A colony holds its slot until it has sent its last ant, and sends again by
 * itself whenever blocks of its color become exposed. No colony can be sent out
 * while every slot is full. Clear every block to win.
 *
 * Later levels add:
 *   - linked colonies: a group of 2 to 4 colonies that go out together and stay
 *     linked in their slots: none leaves until all are done. They go once every
 *     member is at the front of its column, or right behind another member there:
 *     members in one column sit back to back and leave as one stack
 *   - locks: a lock sits in a column in front of the colony it blocks; once it
 *     reaches the front, the column waits until its key block is exposed
 *   - mystery colonies: their color is hidden until they reach the front
 *   - food dispensers: a tile in the picture, in place of a food, holding more
 *     food. Whenever an ant eats food of the dispenser's color anywhere, the
 *     dispenser puts a new one in its place at once, so eating it uncovers
 *     nothing. It changes color after set amounts (the next color isn't shown),
 *     and once it's empty its tile is empty space.
 *
 * Each color's colony counts add up exactly to its food: its blocks, plus what
 * the dispensers hand out.
 */

import {
	hashStr,
	makeRng,
	parseArt,
	pickOne,
	pickWeighted,
	type Color,
	type Rng
} from '../shared/engine.ts';
import type { Picture } from '../shared/level.ts';

/** A level as stored: its picture, plus how its deal is tuned. */
export interface Level extends Picture {
	/** Override the tuning that the level's place in play order sets. */
	tuning?: Partial<Tuning>;
	/** Which deal of colonies to use; `pnpm -F museum forage:tune` picks it to hit a difficulty. */
	seed?: number;
	/**
	 * Deal as if this many steps further along in play order (each a fifth of the
	 * way from first to last; negative is easier). `forage:tune` sets it when no
	 * seed lands near the level's target with the usual tuning.
	 */
	push?: number;
	/**
	 * Share of games a good player wins with this deal: the best of the players
	 * in report.ts, measured by `forage:tune`. The level's difficulty index comes
	 * from it, capped by its cruxes (see difficulty.ts).
	 */
	wins?: number;
	/**
	 * Which column each colony of the play is dealt into, one digit each in play
	 * order. `forage:tune` searches for one that makes the level's cruxes (see
	 * cruxes.ts); without it, or if it no longer fits the play, the seed deals at random.
	 */
	deal?: string;
	/** Rule breaks and real cruxes `forage:tune` measured (see cruxes.ts); they cap the difficulty index. */
	breaks?: number;
	cruxes?: number;
	/** Thirds of the game the real cruxes are spread over, 0 to 3. */
	spread?: number;
}

/** A level's fields beyond its picture: what saving and rebuilding pictures must keep. */
export const TUNED = [
	'tuning',
	'seed',
	'push',
	'deal',
	'wins',
	'breaks',
	'cruxes',
	'spread'
] as const satisfies readonly Exclude<keyof Level, keyof Picture>[];

export interface Colony {
	id: number;
	c: number;
	/** Ants left. */
	n: number;
	/**
	 * Linked group: an id shared by every colony in the group (the id of its first
	 * colony in the play). They go out together, and none leaves its slot until all
	 * are done.
	 */
	link?: number;
	/** Color hidden until it reaches the front of its column. */
	mystery?: boolean;
	/** While working: ticks until it can send its next ant. */
	cool?: number;
}

/** A colony sends one ant every this many ticks. */
export const DISPATCH_EVERY = 2;

/** An ant on its way to a food, with ticks left until it gets there. */
export interface Ant {
	cell: number;
	eta: number;
	c: number;
	/** The colony that sent it. */
	id: number;
}

export interface State {
	w: number;
	h: number;
	colors: Color[];
	/** Color of each pixel; -1 is empty, not part of the picture; DISPENSER is a dispenser's tile. */
	target: number[];
	/** Whether each pixel's block is still there. */
	alive: boolean[];
	/** Colonies waiting in each column; the front is index 0. */
	columns: Colony[][];
	/** Per column: the key block that has to be exposed to remove its lock, or -1. */
	locks: number[];
	/**
	 * Per column: how many colonies sit in front of its lock. Those can still go out;
	 * once the lock reaches the front (0), the column waits for its key.
	 */
	lockAt: number[];
	slots: (Colony | null)[];
	/** Ants out walking. They carry on after their colony has left its slot. */
	walking: Ant[];
	moves: number;
	/** The column picks the level was built from: one way to win. */
	intended?: number[];
	/** Food dispensers, in eating order (bottom row first, left to right). Replaced, never changed. */
	dispensers?: Dispenser[];
}

/** A dispenser's tile in State.target. */
export const DISPENSER = -2;

/**
 * A food dispenser: it hands out amounts[0] of colors[0], then amounts[1] of
 * colors[1], and so on. Its tile stays (alive) until it has handed out the lot.
 */
export interface Dispenser {
	cell: number;
	colors: number[];
	amounts: number[];
	/** How many it has handed out. */
	used: number;
}

/** The color a dispenser hands out now and how many more of it, or null once it's empty. */
export function dispensing(d: Dispenser): { c: number; left: number } | null {
	let at = d.used;
	for (let k = 0; k < d.colors.length; k++) {
		if (at < d.amounts[k]) return { c: d.colors[k], left: d.amounts[k] - at };
		at -= d.amounts[k];
	}
	return null;
}

/** One colony eating: which blocks, and on which tick after the send (`wave`). */
export interface Meal {
	id: number;
	c: number;
	eaten: { cell: number; wave: number }[];
}

export type PickResult =
	| Refusal
	| {
			ok: true;
			/** The colonies sent out: one, or a linked group. */
			sent: number[];
			meals: Meal[];
			/** Slots the sent colonies went to with ants left. */
			parked: number[];
			/** Columns that opened because their key got exposed. */
			unlocked: number[];
			won: boolean;
	  };

/** A copy of s to play on. It keeps s's cached outside() and blocksKey(). */
export function clone(s: State): State {
	const alive = s.alive.slice();
	const out = outCache.get(s.alive);
	if (out) outCache.set(alive, out);
	const key = blocksCache.get(s.alive);
	if (key !== undefined) blocksCache.set(alive, key);
	return {
		...s,
		alive,
		columns: s.columns.map((col) => col.slice()),
		locks: s.locks.slice(),
		lockAt: s.lockAt.slice(),
		slots: s.slots.map((e) => e && { ...e }),
		walking: s.walking.slice()
	};
}

/** blocksKey() of each alive array. grewOutside() drops it when blocks are eaten in place. */
const blocksCache = new WeakMap<boolean[], string>();

/** The blocks left, as text: how many, and two hashes of which. */
export function blocksKey(s: State): string {
	const hit = blocksCache.get(s.alive);
	if (hit !== undefined) return withDispensers(s, hit);
	let a = 2166136261;
	let b = 0;
	let left = 0;
	for (let i = 0; i < s.alive.length; i++) {
		if (!s.alive[i]) continue;
		left++;
		a = Math.imul(a ^ i, 16777619);
		b = (b + Math.imul(i + 1, 2654435761)) | 0;
	}
	const key = `${left}:${a >>> 0}:${b >>> 0}`;
	blocksCache.set(s.alive, key);
	return withDispensers(s, key);
}

/** A blocks key with how far each dispenser has got, which changes without eating a block. */
function withDispensers(s: State, key: string): string {
	return s.dispensers?.length ? `${key}:${s.dispensers.map((d) => d.used).join('.')}` : key;
}

/** Whether every block is eaten. */
export function isWon(s: State): boolean {
	return !s.alive.some(Boolean);
}

/** Whether any food of color c is left: in the picture, or still to come from a dispenser. */
export function foodLeft(s: State, c: number): boolean {
	for (let i = 0; i < s.target.length; i++) if (s.alive[i] && s.target[i] === c) return true;
	for (const d of s.dispensers ?? []) {
		if (!s.alive[d.cell]) continue;
		// Each color's run of the dispenser ends here; a run of c not handed out yet is food left.
		let end = 0;
		for (let k = 0; k < d.colors.length; k++) {
			end += d.amounts[k];
			if (d.colors[k] === c && d.used < end) return true;
		}
	}
	return false;
}

/** Food still to eat: in the picture, and still in the dispensers. */
export function blocksLeft(s: State): number {
	let n = s.alive.filter(Boolean).length;
	for (const d of s.dispensers ?? []) {
		const total = d.amounts.reduce((a, b) => a + b, 0);
		if (s.alive[d.cell]) n += total - d.used - 1;
	}
	return n;
}

/** The colonies still in the columns that are linked in group `link`. */
export function groupOf(s: State, link: number): Colony[] {
	const out: Colony[] = [];
	for (const col of s.columns) for (const e of col) if (e.link === link) out.push(e);
	return out;
}

/**
 * outside() of each `alive` array. Only step() and reachOf() change an alive
 * array in place (they eat blocks), and both save the grown outside() for it
 * right away with grewOutside(), which also drops its blocksKey(). So neither is
 * ever stale. Anything else that changes blocks must make a new array.
 */
const outCache = new WeakMap<boolean[], Uint8Array>();

/**
 * Empty pixels that reach the outside of the picture through other empty pixels
 * (sides only). Shared and cached: don't change the array it returns.
 */
export function outside(s: State): Uint8Array {
	const hit = outCache.get(s.alive);
	if (hit) return hit;
	const { w, h } = s;
	const edge: number[] = [];
	for (let x = 0; x < w; x++) edge.push(x, (h - 1) * w + x);
	for (let y = 0; y < h; y++) edge.push(y * w, y * w + w - 1);
	const out = new Uint8Array(w * h);
	flood(s, out, edge);
	outCache.set(s.alive, out);
	return out;
}

/**
 * Mark empty pixels reachable from `from` (each already outside, or on the edge)
 * in out. Mutates out; returns the pixels it marked.
 */
function flood(s: State, out: Uint8Array, from: number[]): number[] {
	const { w, h } = s;
	const queue: number[] = [];
	const add = (i: number) => {
		if (!out[i] && !s.alive[i]) {
			out[i] = 1;
			queue.push(i);
		}
	};
	for (const i of from) add(i);
	for (let k = 0; k < queue.length; k++) {
		const i = queue[k];
		const x = i % w;
		if (x > 0) add(i - 1);
		if (x < w - 1) add(i + 1);
		if (i >= w) add(i - w);
		if (i < w * (h - 1)) add(i + w);
	}
	return queue;
}

/**
 * While a send settles (see onOwnGround()): its board's own copies of outside(),
 * walkable() and the food lists. Nothing else sees the board until it's
 * settled, so these grow in place each tick instead of being copied.
 */
let mine: {
	out: Uint8Array;
	ok: Uint8Array | null;
	food: number[][] | null;
	/** Food lists (one per color) made during the settle. */
	lists: Set<number[]>;
	/**
	 * Per slot, once one of its ants walks on `ok`: steps from its door to every
	 * cell, kept up to date as `ok` grows (see doorDist()).
	 */
	dists: (Int32Array | undefined)[];
} | null = null;

/** Scratch for grewFood: a stamp on the pixels that just joined the outside. */
let joined = new Int32Array(0);
let joinStamp = 0;

/**
 * After blocks `cells` were eaten from s.alive in place: outside() as it was
 * before, grown from them, saved for s.alive. Blocks are only ever eaten, so
 * empty space only grows, and only from the newly eaten blocks. What's walkable
 * and what's exposed grow from what they were before too, when those were made.
 */
function grewOutside(s: State, before: Uint8Array, cells: number[]): Uint8Array {
	blocksCache.delete(s.alive);
	if (!cells.length) {
		outCache.set(s.alive, before);
		return before;
	}
	const { w, h } = s;
	const from = cells.filter((i) => {
		const x = i % w;
		return (
			x === 0 ||
			x === w - 1 ||
			i < w ||
			i >= w * (h - 1) ||
			!!before[i - 1] ||
			!!before[i + 1] ||
			!!before[i - w] ||
			!!before[i + w]
		);
	});
	// A settling board's own arrays grow in place (see onOwnGround()). Otherwise always a
	// new array, even if nothing joined the outside: food cached by it changed.
	const own = mine?.out === before ? mine : null;
	const out = own ? before : before.slice();
	const ok = walkCache.get(before);
	const food = foodCache.get(before);
	const added = flood(s, out, from);
	outCache.set(s.alive, out);
	if (ok) {
		if (own?.ok === ok) {
			const grid = added.map((i) => walkCell(s, i));
			for (const j of grid) ok[j] = 1;
			for (const dist of own.dists) if (dist) shorten(s, ok, dist, grid);
		} else walkCache.set(out, added.length ? grewWalkable(s, ok, added) : ok);
	}
	if (food) {
		if (own?.food === food) grewFood(s, out, food, cells, added, own.lists);
		else foodCache.set(out, grewFood(s, out, food.slice(), cells, added, new Set()));
	}
	return out;
}

/** Whether block i has a side on the picture's edge or on empty space that reaches outside. */
function exposedAt(s: State, out: Uint8Array, i: number): boolean {
	const { w, h } = s;
	const x = i % w;
	const y = Math.floor(i / w);
	return (
		x === 0 ||
		y === 0 ||
		x === w - 1 ||
		y === h - 1 ||
		!!out[i - 1] ||
		!!out[i + 1] ||
		!!out[i - w] ||
		!!out[i + w]
	);
}

/** Whether a key block is exposed (or already eaten). `out` is outside(s), when the caller has it. */
function keyOpen(s: State, cell: number, out?: Uint8Array): boolean {
	return cell < 0 || !s.alive[cell] || exposedAt(s, out ?? outside(s), cell);
}

/**
 * Whether column `col` still has a lock in it (its key isn't exposed yet).
 * `out` is outside(s), when the caller has it.
 */
export function hasLock(s: State, col: number, out?: Uint8Array): boolean {
	return !keyOpen(s, s.locks[col], out);
}

/** Whether column `col`'s lock is at the front, so nothing in it can go out. */
export function isLocked(s: State, col: number): boolean {
	return s.lockAt[col] === 0 && hasLock(s, col);
}

/**
 * Exposed blocks of color c in eating order: bottom rows first (the colonies
 * come from below), then left to right.
 */
export function exposedOf(s: State, c: number): number[] {
	return exposedIn(s, outside(s), c).slice();
}

export type SendResult = Refusal | Sent;
type Sent = { ok: true; sent: number[]; dispatched: Dispatch[] };

/** Why a column's front colony can't go out. */
type Refusal = { ok: false; reason: 'empty' | 'locked' | 'partner' | 'no-slot' };

/** Shortest walks from one slot's door: steps to each cell of the walking grid, and the cell before it. */
interface Walks {
	dist: Int32Array;
	prev: Int32Array;
}

/** An ant leaving its colony's slot for a food, arriving in `eta` ticks. */
export interface Dispatch {
	slot: number;
	cell: number;
	c: number;
	eta: number;
	/** The walks from its slot that timed it; antPath() follows them. */
	walks: Walks;
}

/**
 * What sending ants reads. Food only goes when an ant gets there, so this holds
 * for every ant that leaves in one send or tick.
 */
interface Ground {
	out: Uint8Array;
	/** Food some ant is already heading for; grows as ants leave. */
	taken: Claims;
	/** Where ants can walk, made when the first ant leaves. */
	ok?: Uint8Array;
	/** Only time the ants (for a patient pick): skip the walks the board draws them along. */
	quick?: boolean;
}

/**
 * A send canSend() allows: the column of each colony going out, in order (a
 * column shows up once per colony its stack sends), and the free slots.
 */
type Allowed = { ok: true; cols: number[]; free: number[] };

/**
 * Whether column `col`'s front colony can go out now. If so: the columns it
 * leaves from (its own, then its linked group's) and the free slots. Every
 * colony in a group has to be at the front of an open column, or right behind
 * another member there with no lock between.
 */
function canSend(s: State, col: number): Refusal | Allowed {
	const front = s.columns[col]?.[0];
	if (!front) return { ok: false, reason: 'empty' };
	if (isLocked(s, col)) return { ok: false, reason: 'locked' };
	let cols = [col];
	const g = front.link;
	if (g !== undefined) {
		cols = [];
		const order = [col, ...s.columns.keys()].filter((k, j) => j === 0 || k !== col);
		for (const k of order) {
			const column = s.columns[k];
			const members = column.filter((e) => e.link === g).length;
			if (!members) continue;
			// The members here have to be the column's front, back to back.
			let stack = 0;
			while (stack < column.length && column[stack].link === g) stack++;
			if (stack < members || isLocked(s, k)) return { ok: false, reason: 'partner' };
			// A lock part way down the stack holds back the members behind it.
			if (s.lockAt[k] < stack && hasLock(s, k)) return { ok: false, reason: 'partner' };
			for (let n = 0; n < stack; n++) cols.push(k);
		}
	}
	const free = s.slots.flatMap((e, k) => (e ? [] : [k]));
	if (free.length < cols.length) return { ok: false, reason: 'no-slot' };
	return { ok: true, cols, free };
}

/**
 * Send out the front colony of column `col` (and its linked group) into free
 * working slots. Each sends its first ant right away. Every colony out working
 * holds a slot until it has sent out all its ants, so with all slots busy
 * nothing more can go. Mutates s only when allowed.
 */
export function send(s: State, col: number): SendResult {
	const can = canSend(s, col);
	return can.ok ? sendOut(s, false, can) : can;
}

/** send() of a send canSend() allowed; `quick` skips making the walks the board draws ants along. */
function sendOut(s: State, quick: boolean, { cols, free }: Allowed): Sent {
	const columns = s.columns.slice();
	const slots = s.slots.slice();
	const sent: number[] = [];
	const lockAt = s.lockAt.slice();
	cols.forEach((k, j) => {
		const colony = { ...columns[k][0] };
		columns[k] = columns[k].slice(1);
		// The colony ahead of a lock leaves, so the lock moves one closer to the front.
		if (lockAt[k] > 0 && hasLock(s, k)) lockAt[k]--;
		slots[free[j]] = colony;
		sent.push(colony.id);
	});
	s.columns = columns;
	s.slots = slots;
	s.lockAt = lockAt;
	s.moves++;
	// The first ant leaves right away.
	const ground: Ground = { out: outside(s), taken: claims(s), quick };
	const dispatched: Dispatch[] = [];
	s.walking = s.walking.slice();
	for (const k of free.slice(0, cols.length)) {
		const ant = dispatch(s, slots[k]!, ground, k);
		if (ant) dispatched.push(ant);
	}
	freeSlots(s);
	return { ok: true, sent, dispatched };
}

export interface TickResult {
	/** Food picked up this tick. */
	eaten: { cell: number; c: number; id: number }[];
	/** Columns whose lock went away because their key got exposed. */
	unlocked: number[];
	/** Ants that left their colony this tick. */
	dispatched: Dispatch[];
	won: boolean;
}

/** How many cells an ant walks per tick. */
const ANT_SPEED = 3;

/**
 * Where ants can walk, on a grid one cell bigger than the picture on every side:
 * the ring around the outside of the picture, plus empty space inside it that
 * reaches the outside. Picture cell (x, y) is (x + 1, y + 1) here.
 */
function walkable(s: State, out: Uint8Array): Uint8Array {
	const hit = walkCache.get(out);
	if (hit) return hit;
	const W = s.w + 2;
	const H = s.h + 2;
	const ok = new Uint8Array(W * H);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1;
			ok[y * W + x] = edge || out[(y - 1) * s.w + (x - 1)] ? 1 : 0;
		}
	}
	walkCache.set(out, ok);
	if (mine?.out === out) {
		mine.ok = ok;
		mine.dists = [];
	}
	return ok;
}

/** walkable() for each outside() array. */
const walkCache = new WeakMap<Uint8Array, Uint8Array>();

/** Picture pixel i's cell in the walking grid (see walkable()). */
function walkCell(s: State, i: number): number {
	return (Math.floor(i / s.w) + 1) * (s.w + 2) + (i % s.w) + 1;
}

/** walkable() after the picture pixels `added` joined the outside, from what it was. */
function grewWalkable(s: State, ok: Uint8Array, added: number[]): Uint8Array {
	const grown = ok.slice();
	for (const i of added) grown[walkCell(s, i)] = 1;
	return grown;
}

/** Where a slot's ants come out: a point on the bottom edge, spread out like the slots. */
function door(s: State, slot: number): number {
	const W = s.w + 2;
	const x =
		1 + Math.min(s.w - 1, Math.max(0, Math.round(((slot + 0.5) / s.slots.length) * s.w - 0.5)));
	return (s.h + 1) * W + x;
}

/**
 * Shortest walking distance (in cells) from a slot's door to walkable cells; -1
 * if none. It stops once every cell as close as the nearest one beside food
 * `cell` is found, which is all approach() and antPath() need.
 */
function walkFrom(s: State, ok: Uint8Array, slot: number, cell: number): Walks {
	const W = s.w + 2;
	const H = s.h + 2;
	const dist = new Int32Array(W * H).fill(-1);
	const prev = new Int32Array(W * H).fill(-1);
	// The food's neighbors in the bigger grid.
	const at = walkCell(s, cell);
	const beside = [at - 1, at + 1, at - W, at + W];
	let stop = Infinity;
	const start = door(s, slot);
	dist[start] = 0;
	if (beside.includes(start)) stop = 0;
	const queue = [start];
	for (let k = 0; k < queue.length; k++) {
		const i = queue[k];
		if (dist[i] >= stop) break;
		const x = i % W;
		for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
			if (j < 0 || j >= W * H || !ok[j] || dist[j] >= 0) continue;
			dist[j] = dist[i] + 1;
			prev[j] = i;
			queue.push(j);
			if (stop === Infinity && beside.includes(j)) stop = dist[j];
		}
	}
	return { dist, prev };
}

/** The walkable cell beside food `cell` that's closest to the door, in the bigger grid; -1 if none. */
function approach(s: State, field: Walks, cell: number): number {
	const W = s.w + 2;
	const x = (cell % s.w) + 1;
	const y = Math.floor(cell / s.w) + 1;
	let best = -1;
	for (const j of [y * W + x - 1, y * W + x + 1, (y - 1) * W + x, (y + 1) * W + x]) {
		if (field.dist[j] >= 0 && (best < 0 || field.dist[j] < field.dist[best])) best = j;
	}
	return best;
}

/**
 * Steps an ant walks to reach food `cell` along `field`, the walks from its slot:
 * out of its door, around the edge of the picture and in through cleared space.
 */
function walkSteps(s: State, cell: number, field: Walks): number {
	const at = approach(s, field, cell);
	return at < 0 ? s.w + s.h : field.dist[at] + 1;
}

/**
 * The path a dispatched ant walks from its slot to its food, as points in picture
 * cells (x, y can be -1 or w / h on the ring outside the picture). Ends on the food.
 */
export function antPath(s: State, d: Dispatch): { x: number; y: number }[] {
	const W = s.w + 2;
	const { cell, walks: field } = d;
	const at = approach(s, field, cell);
	const pts: { x: number; y: number }[] = [];
	for (let i = at; i >= 0; i = field.prev[i])
		pts.push({ x: (i % W) - 1, y: Math.floor(i / W) - 1 });
	pts.reverse();
	pts.push({ x: cell % s.w, y: Math.floor(cell / s.w) });
	return pts;
}

/**
 * Send one ant from colony e in `slot` to its first exposed, unclaimed food, if
 * there is one. Mutates e, ground.taken and s.walking.
 */
function dispatch(s: State, e: Colony, ground: Ground, slot: number): Dispatch | null {
	if (e.n <= 0) return null;
	const { at, mark } = ground.taken;
	const cell = exposedIn(s, ground.out, e.c).find((i) => at[i] !== mark);
	if (cell === undefined) return null;
	at[cell] = mark;
	const ok = (ground.ok ??= walkable(s, ground.out));
	const walks = ground.quick ? NO_WALKS : walkFrom(s, ok, slot, cell);
	const steps = ground.quick ? stepsTo(s, ok, slot, cell) : walkSteps(s, cell, walks);
	const ant = { cell, c: e.c, id: e.id, eta: 1 + Math.ceil(steps / ANT_SPEED) };
	s.walking.push(ant);
	e.n--;
	e.cool = DISPATCH_EVERY;
	return { slot, ...ant, walks };
}

/** A quick send's walks: nothing draws its ants. */
const NO_WALKS: Walks = { dist: new Int32Array(0), prev: new Int32Array(0) };

/** Scratch for stepsTo: a visit stamp per cell of the walking grid, and a queue. */
let seen = new Int32Array(0);
let queue = new Int32Array(0);
let stamp = 0;

/**
 * How far an ant walks from a slot's door to food `cell`: what walkSteps() finds along
 * walkFrom's walks, without keeping them.
 */
function stepsTo(s: State, ok: Uint8Array, slot: number, cell: number): number {
	const W = s.w + 2;
	const at = walkCell(s, cell);
	// A settling board's own grid: from its door's distances, kept as the grid grows.
	if (mine?.ok === ok) {
		const dist = (mine.dists[slot] ??= doorDist(s, ok, slot));
		let best = -1;
		for (const j of [at - 1, at + 1, at - W, at + W]) {
			if (dist[j] >= 0 && (best < 0 || dist[j] < best)) best = dist[j];
		}
		return best < 0 ? s.w + s.h : best + 1;
	}
	const size = W * (s.h + 2);
	if (seen.length < size) {
		seen = new Int32Array(size);
		queue = new Int32Array(size);
		stamp = 0;
	}
	stamp++;
	const isBeside = (j: number) => j === at - 1 || j === at + 1 || j === at - W || j === at + W;
	const start = door(s, slot);
	// Breadth first, a level at a time; queue holds cells, dist is their level.
	if (isBeside(start)) return 1;
	seen[start] = stamp;
	queue[0] = start;
	let head = 0;
	let tail = 1;
	for (let dist = 1; head < tail; dist++) {
		const end = tail;
		for (; head < end; head++) {
			const i = queue[head];
			const x = i % W;
			for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
				if (j < 0 || j >= size || !ok[j] || seen[j] === stamp) continue;
				if (isBeside(j)) return dist + 1;
				seen[j] = stamp;
				queue[tail++] = j;
			}
		}
	}
	return s.w + s.h;
}

/** Scratch for doorDist and shorten: a queue, and a stamp per cell for what's on it. */
let walkQueue = new Int32Array(0);
let queued = new Int32Array(0);
let queueMark = 0;

/** Make that scratch at least `size` cells. */
function walkScratch(size: number) {
	if (walkQueue.length >= size) return;
	walkQueue = new Int32Array(size);
	queued = new Int32Array(size);
	queueMark = 0;
}

/** Steps from a slot's door to every cell of the walking grid `ok` (-1 where it can't walk). */
function doorDist(s: State, ok: Uint8Array, slot: number): Int32Array {
	const W = s.w + 2;
	const size = ok.length;
	walkScratch(size);
	const dist = new Int32Array(size).fill(-1);
	const start = door(s, slot);
	dist[start] = 0;
	walkQueue[0] = start;
	let tail = 1;
	for (let head = 0; head < tail; head++) {
		const i = walkQueue[head];
		const d = dist[i] + 1;
		const x = i % W;
		if (x > 0 && ok[i - 1] && dist[i - 1] < 0) {
			dist[i - 1] = d;
			walkQueue[tail++] = i - 1;
		}
		if (x < W - 1 && ok[i + 1] && dist[i + 1] < 0) {
			dist[i + 1] = d;
			walkQueue[tail++] = i + 1;
		}
		if (i >= W && ok[i - W] && dist[i - W] < 0) {
			dist[i - W] = d;
			walkQueue[tail++] = i - W;
		}
		if (i + W < size && ok[i + W] && dist[i + W] < 0) {
			dist[i + W] = d;
			walkQueue[tail++] = i + W;
		}
	}
	return dist;
}

/**
 * A door's distances after the cells `added` became walkable in `ok`: lowered in
 * place where the new cells make a walk shorter. Walks only get shorter as the
 * picture opens up, so it spreads out from the new cells, a cell going back on
 * the queue whenever it gets closer (never twice at once, so the ring holds).
 */
function shorten(s: State, ok: Uint8Array, dist: Int32Array, added: number[]) {
	const W = s.w + 2;
	const size = ok.length;
	walkScratch(size);
	const mark = ++queueMark;
	let head = 0;
	let tail = 0;
	let count = 0;
	const lower = (j: number, d: number) => {
		if (!ok[j] || (dist[j] >= 0 && dist[j] <= d)) return;
		dist[j] = d;
		if (queued[j] === mark) return;
		queued[j] = mark;
		walkQueue[tail] = j;
		tail = tail + 1 === size ? 0 : tail + 1;
		count++;
	};
	for (const j of added) {
		const x = j % W;
		let best = -1;
		for (const k of [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, j - W, j + W]) {
			if (k >= 0 && k < size && dist[k] >= 0 && (best < 0 || dist[k] < best)) best = dist[k];
		}
		if (best >= 0) lower(j, best + 1);
	}
	while (count > 0) {
		const i = walkQueue[head];
		head = head + 1 === size ? 0 : head + 1;
		count--;
		queued[i] = 0;
		const d = dist[i] + 1;
		const x = i % W;
		if (x > 0) lower(i - 1, d);
		if (x < W - 1) lower(i + 1, d);
		if (i >= W) lower(i - W, d);
		if (i + W < size) lower(i + W, d);
	}
}

/** Whether a working colony has sent all its ants out. */
export function isDone(e: Colony): boolean {
	return e.n === 0;
}

/** Food some ant is already heading for: the pixels of `at` holding `mark`. Good until the next call. */
interface Claims {
	at: Int32Array;
	mark: number;
}

let claimAt = new Int32Array(0);
let claimMark = 0;

/** Claims for the ants walking now. */
function claims(s: State): Claims {
	if (claimAt.length < s.alive.length) {
		claimAt = new Int32Array(s.alive.length);
		claimMark = 0;
	}
	const mark = ++claimMark;
	for (const a of s.walking) claimAt[a.cell] = mark;
	return { at: claimAt, mark };
}

/**
 * Colonies that have sent their last ant leave their slots right away (their ants
 * finish the walk on their own); linked ones only once every one in the group
 * has. Mutates s.
 */
function freeSlots(s: State) {
	const slots = s.slots.slice();
	for (let k = 0; k < slots.length; k++) {
		const e = slots[k];
		if (!e || !isDone(e)) continue;
		// A linked one waits while another in its group still has ants to send.
		if (e.link !== undefined && s.slots.some((o) => !!o && o.link === e.link && !isDone(o)))
			continue;
		slots[k] = null;
	}
	s.slots = slots;
}

/**
 * One step of time:
 *   1. ants that reach their food pick it up (the food is gone, unless a
 *      dispenser refills it)
 *   2. every working colony with ants left sends one more, to the first exposed
 *      food of its color that no ant is heading for yet: bottom row first, left
 *      to right. Food uncovered by an ant that just arrived counts right away.
 * A colony sends an ant every DISPATCH_EVERY ticks and frees its slot as soon
 * as it has sent its last one; linked colonies free theirs together, once all
 * of them have.
 */
export function tick(s: State): TickResult {
	return step(s, false);
}

/** tick(); `quick` skips making the walks the board draws ants along. */
function step(s: State, quick: boolean): TickResult {
	// Which columns are locked before anyone eats, from one look at the picture.
	const before = outside(s);
	const wasLocked = s.locks.map((key, k) => key >= 0 && s.alive[key] && hasLock(s, k, before));
	const eaten: TickResult['eaten'] = [];
	/** Blocks that went: eaten and not refilled, and dispensers that ran out. */
	const gone: number[] = [];
	// Ants that get to their food pick it up. A quick step's board is pick()'s or
	// hurry()'s own (see own()), so it moves its ants and colonies in place.
	const still: Ant[] = [];
	for (const a of s.walking) {
		if (a.eta > 1) {
			if (quick) {
				a.eta--;
				still.push(a);
			} else still.push({ ...a, eta: a.eta - 1 });
		} else {
			eaten.push({ cell: a.cell, c: a.c, id: a.id });
			if (!refill(s, a.c, gone)) gone.push(a.cell);
		}
	}
	s.walking = still;
	for (const i of gone) s.alive[i] = false;
	const slots = quick ? s.slots : s.slots.map((e) => e && { ...e });
	s.slots = slots;
	const out = gone.length ? grewOutside(s, before, gone) : before;
	const ground: Ground = { out, taken: claims(s), quick };
	const dispatched: Dispatch[] = [];
	slots.forEach((e, k) => {
		if (!e || e.n <= 0) return;
		// One ant every few ticks; a colony that found nothing tries again on the next tick.
		e.cool = (e.cool ?? 0) - 1;
		if (e.cool > 0) return;
		const ant = dispatch(s, e, ground, k);
		if (ant) dispatched.push(ant);
		else e.cool = 0;
	});
	freeSlots(s);
	// Sending ants eats nothing, so the picture is as it was after the ants arrived.
	const unlocked = wasLocked.flatMap((was, k) => (was && !hasLock(s, k, ground.out) ? [k] : []));
	return { eaten, unlocked, dispatched, won: isWon(s) };
}

/**
 * Food of color c was just eaten: the first dispenser handing out c (in eating
 * order) puts a new one in its place at once. Returns whether one did. A
 * dispenser that hands out its last one goes too: its cell joins `gone`, the
 * blocks step() takes away. Changes s.dispensers (a new list).
 */
function refill(s: State, c: number, gone: number[]): boolean {
	const list = s.dispensers;
	const k = list?.findIndex((d) => dispensing(d)?.c === c) ?? -1;
	if (!list || k < 0) return false;
	const d = { ...list[k], used: list[k].used + 1 };
	s.dispensers = list.slice();
	s.dispensers[k] = d;
	if (!dispensing(d)) gone.push(d.cell);
	return true;
}

/**
 * Exposed food of color c in eating order: bottom rows first, then left to right.
 * `out` is outside(s). Shared and cached: don't change the array it returns.
 */
function exposedIn(s: State, out: Uint8Array, c: number): number[] {
	return foodOf(s, out)[c] ?? NONE;
}

const NONE: number[] = [];

/** Pixel i's place in eating order, smallest first: bottom rows first, then left to right. */
function eatingOrder(w: number, i: number): number {
	return 2 * (i % w) - i;
}

/** foodOf() for each outside() array: what's exposed follows from what's outside. */
const foodCache = new WeakMap<Uint8Array, number[][]>();

/** Exposed food of every color, each in eating order, from one look at the picture. */
function foodOf(s: State, out: Uint8Array): number[][] {
	const hit = foodCache.get(out);
	if (hit) return hit;
	const food: number[][] = s.colors.map(() => []);
	for (let y = s.h - 1; y >= 0; y--) {
		for (let x = 0; x < s.w; x++) {
			const i = y * s.w + x;
			if (s.alive[i] && s.target[i] >= 0 && exposedAt(s, out, i)) food[s.target[i]].push(i);
		}
	}
	foodCache.set(out, food);
	if (mine?.out === out) {
		mine.food = food;
		for (const list of food) mine.lists.add(list);
	}
	return food;
}

/**
 * foodOf() after blocks `cells` were eaten and pixels `added` joined the outside
 * (so `out` is outside() now): eaten food goes; blocks beside the new outside
 * that weren't exposed before come in, in eating order. Changes `food` in place,
 * copying any color's list that isn't in `lists` (the ones it may change) first.
 */
function grewFood(
	s: State,
	out: Uint8Array,
	food: number[][],
	cells: number[],
	added: number[],
	lists: Set<number[]>
): number[][] {
	const { w, h } = s;
	const edit = (c: number) => {
		if (!lists.has(food[c])) {
			food[c] = food[c].slice();
			lists.add(food[c]);
		}
		return food[c];
	};
	for (const i of cells) {
		if (s.target[i] < 0) continue;
		const list = edit(s.target[i]);
		const at = list.indexOf(i);
		if (at >= 0) list.splice(at, 1);
	}
	if (joined.length < out.length) {
		joined = new Int32Array(out.length);
		joinStamp = 0;
	}
	const mark = ++joinStamp;
	for (const i of added) joined[i] = mark;
	const wasOut = (j: number) => !!out[j] && joined[j] !== mark;
	let come: Set<number> | undefined;
	for (const i of added) {
		const x = i % w;
		for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
			if (j < 0 || j >= s.alive.length || !s.alive[j] || s.target[j] < 0 || come?.has(j)) continue;
			// Exposed before: on the edge, or beside what was already outside.
			const jx = j % w;
			if (jx === 0 || jx === w - 1 || j < w || j >= w * (h - 1)) continue;
			if (wasOut(j - 1) || wasOut(j + 1) || wasOut(j - w) || wasOut(j + w)) continue;
			(come ??= new Set()).add(j);
			// Into its place in eating order.
			const list = edit(s.target[j]);
			const key = eatingOrder(w, j);
			let lo = 0;
			let hi = list.length;
			while (lo < hi) {
				const mid = (lo + hi) >> 1;
				if (eatingOrder(w, list[mid]) < key) lo = mid + 1;
				else hi = mid;
			}
			list.splice(lo, 0, j);
		}
	}
	return food;
}

/** Whether no ant is on its way and no working colony has food it can send one to. */
function isQuiet(s: State): boolean {
	if (s.walking.length) return false;
	const out = outside(s);
	return s.slots.every((e) => !e || e.n === 0 || exposedIn(s, out, e.c).length === 0);
}

/**
 * Whether a working colony has nothing to send ants to: no unclaimed food of its
 * color in reach. `out` is outside(s), when the caller has it.
 */
export function isWaiting(s: State, e: Colony, out?: Uint8Array): boolean {
	if (e.n <= 0) return false;
	const { at, mark } = claims(s);
	return exposedIn(s, out ?? outside(s), e.c).every((i) => at[i] === mark);
}

/**
 * How much food of color c a colony with unlimited ants could eat from here,
 * with nothing else eating. Fast: eats whole waves at a time.
 */
function reachOf(s0: State, c: number): number {
	const s = clone(s0);
	let n = 0;
	// While a dispenser hands out c, eating c in reach brings more of it.
	const more = exposedIn(s0, outside(s0), c).length
		? (s0.dispensers ?? []).reduce((m, d) => {
				const now = dispensing(d);
				return m + (now?.c === c ? now.left : 0);
			}, 0)
		: 0;
	for (let out = outside(s); ;) {
		const cells = exposedIn(s, out, c);
		if (!cells.length) return n + more;
		for (const i of cells) s.alive[i] = false;
		out = grewOutside(s, out, cells);
		n += cells.length;
	}
}

/**
 * Give s its own walking ants (clone() shares them) and working colonies, so
 * quick steps can change them in place. Mutates s.
 */
function own(s: State): State {
	s.walking = s.walking.map((a) => ({ ...a }));
	s.slots = s.slots.map((e) => e && { ...e });
	return s;
}

/**
 * Ticks from now that pass with nothing happening: no ant gets to its food and no
 * colony sends one. A colony sends when it's due and has food no ant is heading
 * for, and that only changes when an ant eats or another colony sends.
 */
function idleTicks(s: State): number {
	let next = Infinity;
	for (const a of s.walking) if (a.eta < next) next = a.eta;
	if (next <= 1) return 0;
	const out = outside(s);
	let taken: Claims | undefined;
	for (const e of s.slots) {
		if (!e || e.n <= 0) continue;
		const due = Math.max(1, e.cool ?? 0);
		if (due >= next) continue;
		const { at, mark } = (taken ??= claims(s));
		if (exposedIn(s, out, e.c).some((i) => at[i] !== mark)) next = due;
		if (next <= 1) return 0;
	}
	return next === Infinity ? 0 : next - 1;
}

/**
 * Let `ticks` idle ticks (see idleTicks()) go by at once, the way step() would
 * one at a time: ants walk on, and colonies count down to their next ant (one
 * that came due and found nothing waits at 0). Mutates s's ants and colonies, so
 * only for a quick step's own board.
 */
function skip(s: State, ticks: number) {
	for (const a of s.walking) a.eta -= ticks;
	for (const e of s.slots) {
		if (!e || e.n <= 0) continue;
		const cool = e.cool ?? 0;
		e.cool = Math.max(1, cool) <= ticks ? 0 : cool - ticks;
	}
}

/**
 * Run `fn` with s's board as its own (see mine): its outside(), walkable() and
 * food lists copied once, to grow in place as its blocks are eaten. s must be
 * its own already (see own()).
 */
function onOwnGround<T>(s: State, fn: () => T): T {
	const before = outside(s);
	const out = before.slice();
	outCache.set(s.alive, out);
	const ok = walkCache.get(before)?.slice() ?? null;
	if (ok) walkCache.set(out, ok);
	const food = foodCache.get(before)?.slice() ?? null;
	if (food) foodCache.set(out, food);
	const was = mine;
	mine = { out, ok, food, lists: new Set(), dists: [] };
	try {
		return fn();
	} finally {
		mine = was;
	}
}

/**
 * Let time run until no working colony can eat, skipping ticks where nothing
 * happens. Returns what each colony ate, by tick. Runs on its own ground (see onOwnGround()).
 */
function settleTicks(s: State): { meals: Meal[]; unlocked: number[] } {
	const byId = new Map<number, Meal>();
	const unlocked: number[] = [];
	for (let t = 0; !isQuiet(s); t++) {
		const idle = idleTicks(s);
		if (idle) {
			skip(s, idle);
			t += idle;
		}
		const r = step(s, true);
		for (const e of r.eaten) {
			let meal = byId.get(e.id);
			if (!meal) byId.set(e.id, (meal = { id: e.id, c: e.c, eaten: [] }));
			meal.eaten.push({ cell: e.cell, wave: t });
		}
		unlocked.push(...r.unlocked);
	}
	return { meals: [...byId.values()], unlocked };
}

/**
 * A patient move: send a colony, then wait until nothing more can be eaten.
 * This is what the solvers, the players in player.ts, the level builder and the tests play.
 */
export function pick(s: State, col: number): PickResult {
	const can = canSend(s, col);
	if (!can.ok) return can;
	const t = own(clone(s));
	const { r, meals, unlocked } = onOwnGround(t, () => {
		const r = sendOut(t, true, can);
		return { r, ...settleTicks(t) };
	});
	Object.assign(s, t);
	const parked = s.slots.flatMap((e, k) => (e && r.sent.includes(e.id) ? [k] : []));
	return { ok: true, sent: r.sent, meals, parked, unlocked, won: isWon(s) };
}

/**
 * Send without waiting, the way a hurried person plays: the colony goes out now
 * and the board runs `ticks` steps of time, so whatever was still eating keeps
 * eating alongside it. Mutates s only when allowed; false when the send can't go.
 */
export function hurry(s: State, col: number, ticks: number): boolean {
	const can = canSend(s, col);
	if (!can.ok) return false;
	sendOut(own(s), true, can);
	for (let t = 0; t < ticks && !isQuiet(s); t++) step(s, true);
	return true;
}

/** Columns whose front colony can be sent out right now. */
export function legalPicks(s: State): number[] {
	const out: number[] = [];
	for (let k = 0; k < s.columns.length; k++) if (canSend(s, k).ok) out.push(k);
	return out;
}

/** True when the picture isn't finished, nothing can eat, and no colony can be sent out. */
export function isStuck(s: State): boolean {
	return !isWon(s) && isQuiet(s) && legalPicks(s).length === 0;
}

export interface Tuning {
	columns: number;
	slots: number;
	/**
	 * Chance each step sends a colony bigger than the food its color has in reach,
	 * so it waits in its slot until more opens up. Colors split into islands that
	 * open at different times make the longest waits.
	 */
	waitChance: number;
	/**
	 * Colony sizes to choose from, before they're grown to fit the picture (see `sends`);
	 * a waiting colony wants this much more than it can reach.
	 */
	chunks: number[];
	/**
	 * About how many sends the play should take. A big picture grows its colonies to
	 * keep near it, so a bigger picture means bigger colonies, not more clicks.
	 */
	sends: number;
	/**
	 * Linked groups: each links a colony that eats right away with one that has to
	 * wait, and maybe more of either.
	 */
	links: number;
	/** Most colonies in a linked group: 2 to 4. */
	group: number;
	/**
	 * Chance a linked colony is dealt right behind the one before it in its group,
	 * in the same column, so the two leave as one stack.
	 */
	stack: number;
	/** Chance a colony stacked behind another of its group is a mystery one. */
	stackMystery: number;
	/**
	 * Chance a colony whose eating opens food for a waiting colony is dealt behind
	 * it, in its column. Then the waiting one has to go out first and sit in its
	 * slot: you can't hold it back until its food is open.
	 */
	behind: number;
	/**
	 * Chance a colony is dealt right behind the one before it in the play, so a
	 * column holds runs of the play and the other fronts are further ahead in it.
	 */
	runs: number;
	/** Locked columns. */
	locks: number;
	/** Share of colonies whose color is hidden until they reach the front. */
	mystery: number;
	/** Food dispensers in the picture. */
	dispensers: number;
	/** Most colors a dispenser hands out, one after another. */
	dispenseColors: number;
	/**
	 * 0 or 1: pressure late in the game too. Locks after the first get keys that
	 * open late, and the last of the linked groups wait for the last part of the
	 * play, so the end has cruxes like the start. `forage:tune` sets it per level.
	 */
	late: number;
}

/**
 * The last level's place in play order (from 0). A level's difficulty, and when each kind
 * of pressure starts, go by how far it sits between the teaching levels and this one, so
 * adding murals stretches the game rather than piling on. A test keeps it at the last
 * level: set it again when levels are added or removed, then run forage:tune.
 */
export const LAST_LEVEL = 95;

/** How far through play a level is, after the five teaching levels: 0, rising to 1 at the last. */
export function progress(index: number): number {
	return Math.max(0, index - 4) / (LAST_LEVEL - 4);
}

/**
 * How a level's place in play order sets its difficulty. The first five teach
 * the game: few waits, no linked groups until the fifth. After that every kind
 * of pressure grows until the last level.
 */
export function tuning(level: Level, index: number): Tuning {
	const t = progress(index);
	// 0 for the teaching levels, rising to 1 at the last; `push` moves it along.
	const p = Math.min(1.2, t + 0.2 * (level.push ?? 0));
	const teach = index < 5 && (level.push ?? 0) <= 0;
	return {
		columns: index < 2 ? 3 : index < 20 ? 4 : 5,
		slots: 5,
		waitChance: teach ? 0.1 + 0.05 * index : Math.min(0.95, 0.3 + 0.65 * p),
		// A wide spread, from a handful to a crowd; the big ones join as play goes on.
		chunks: teach
			? [5, 8, 12, 17, 24, 32]
			: [5, 8, 12, 17, 24, 32, 42, 54].slice(0, 6 + Math.min(2, Math.round(2 * p))),
		sends: Math.round(25 + 15 * t),
		links: index < 4 ? 0 : 1 + Math.round(9 * p),
		group: teach || index < 12 ? 2 : Math.min(4, 2 + Math.round(2.6 * p)),
		// Stacks from a quarter of the way through play, and from halfway the one behind is often a mystery.
		stack: t < 0.25 ? 0 : Math.min(0.45, 0.15 + 0.35 * p),
		stackMystery: t < 0.5 ? 0 : Math.min(0.7, 0.3 + 0.4 * p),
		behind: teach ? 0 : Math.min(1, 0.3 + 0.7 * p),
		runs: teach ? 0 : Math.min(0.95, 0.2 + 0.75 * p),
		locks: index < 2 ? 0 : index < 8 ? 1 : t < 0.5 ? 2 : 3,
		mystery: index < 5 ? 0 : Math.min(0.35, 0.1 + 0.3 * t),
		// Dispensers from about 60% of the way through, in a little over half the levels after.
		dispensers: t < 0.6 || hashStr(`${level.id}:dispense`) % 100 >= 55 ? 0 : p > 1 ? 2 : 1,
		dispenseColors: Math.min(3, 1 + Math.round(2 * Math.max(0, p - 0.55) * 2)),
		late: 0,
		...level.tuning
	};
}

/** digDepth() for each outside() array: one per board, and the players look at the same ones often. */
const depthCache = new WeakMap<Uint8Array, Int32Array>();

/**
 * Per cell: how many blocks have to be eaten before it's exposed (0 if it is),
 * going the cheapest way in from the outside. Shared and cached: don't change
 * the array it returns.
 */
export function digDepth(s: State): Int32Array {
	const { w, h, alive } = s;
	const out = outside(s);
	const hit = depthCache.get(out);
	if (hit) return hit;
	const n = w * h;
	const depth = new Int32Array(n).fill(1 << 30);
	// 0-1 breadth first: leaving a block costs 1 (it has to be eaten first), empty space 0.
	const deque = new Int32Array(2 * n + 4);
	let head = n + 2;
	let tail = n + 2;
	for (let i = 0; i < n; i++) {
		const x = i % w;
		const y = (i - x) / w;
		if (out[i] || x === 0 || y === 0 || x === w - 1 || y === h - 1) {
			depth[i] = 0;
			deque[tail++] = i;
		}
	}
	while (head < tail) {
		const i = deque[head++];
		const step = alive[i] ? 1 : 0;
		const d = depth[i] + step;
		const x = i % w;
		const relax = (j: number) => {
			if (depth[j] <= d) return;
			depth[j] = d;
			if (step) deque[tail++] = j;
			else deque[--head] = j;
		};
		if (x > 0) relax(i - 1);
		if (x < w - 1) relax(i + 1);
		if (i >= w) relax(i - w);
		if (i + w < n) relax(i + w);
	}
	depthCache.set(out, depth);
	return depth;
}

/** Per color: how many separate same-color islands its uneaten food is in. */
function islands(s: State): number[] {
	const { w, alive, target } = s;
	const count = s.colors.map(() => 0);
	const seen = new Uint8Array(target.length);
	const stack: number[] = [];
	for (let i0 = 0; i0 < target.length; i0++) {
		if (!alive[i0] || seen[i0] || target[i0] < 0) continue;
		const c = target[i0];
		count[c]++;
		seen[i0] = 1;
		stack.push(i0);
		while (stack.length) {
			const i = stack.pop()!;
			const x = i % w;
			for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
				if (j < 0 || j >= target.length || seen[j] || !alive[j] || target[j] !== c) continue;
				seen[j] = 1;
				stack.push(j);
			}
		}
	}
	return count;
}

/** The built-in play a deal comes from, and what dealing it into columns needs. */
export interface Plan {
	level: Level;
	tune: Tuning;
	/** The board before anything is dealt. */
	base: State;
	/** The colonies in the order the play sent them; ids are their place in it. */
	order: Colony[];
	/** Linked groups: the step of the play each went out on (its first colony), and its size. */
	groups: Map<number, number>;
	/** Per colony in the play: the step its linked group went out on, or -1. */
	groupAt: number[];
	/** Per colony: the waiting colonies that ate because it went out (by place in the play). */
	feeds: number[][];
	/** The step before which each block is first exposed. */
	openedAt: number[];
	/** Locks, and which colonies are mystery ones: the same for every way of dealing the play. */
	layout: Layout;
	/** Deals the play at random. */
	rng: Rng;
}

/** What a deal keeps whichever columns its colonies go to. */
export interface Layout {
	/** Per column: its key block, or -1. */
	locks: number[];
	/** Per column: how many colonies sit in front of its lock. */
	lockAt: number[];
	/** Per column: the first step of the play a colony behind its lock may go out. */
	opensAt: number[];
	/** Per colony in the play: its color is hidden until it reaches the front. */
	mystery: boolean[];
	/** Per colony in the play: hidden too, if it's dealt stacked behind another of its group. */
	stackedMystery: boolean[];
}

/**
 * The deal's food dispensers: each in place of a food a little way in from the
 * outside, handing out 3 to 8 each of one to `dispenseColors` colors (never the
 * same twice running), in eating order. Draws on rng only when the level has some.
 */
function placeDispensers(base: State, tune: Tuning, rng: Rng): Dispenser[] {
	if (tune.dispensers <= 0) return [];
	const depth = digDepth(base);
	const counts = base.colors.map(() => 0);
	base.target.forEach((c) => c >= 0 && counts[c]++);
	const cells = base.target
		.map((_, i) => i)
		.filter((i) => base.target[i] >= 0 && depth[i] >= 1 && depth[i] <= 4);
	const out: Dispenser[] = [];
	for (let n = 0; n < tune.dispensers && cells.length; n++) {
		const cell = cells.splice(Math.floor(rng() * cells.length), 1)[0];
		counts[base.target[cell]]--;
		const colors: number[] = [];
		const amounts: number[] = [];
		const parts = 1 + Math.floor(rng() * tune.dispenseColors);
		for (let k = 0; k < parts; k++) {
			const pool = counts.map((_, c) => c).filter((c) => counts[c] >= 3 && c !== colors[k - 1]);
			if (!pool.length) break;
			colors.push(pickWeighted(pool, (c) => counts[c], rng));
			amounts.push(3 + Math.floor(rng() * 6));
		}
		if (colors.length) out.push({ cell, colors, amounts, used: 0 });
	}
	return out.sort((a, b) => eatingOrder(base.w, a.cell) - eatingOrder(base.w, b.cell));
}

/**
 * Per color: the most ants of it the play can send now and still leave one of
 * its food in the picture while a dispenser has more of it to hand out later. A
 * dispenser only hands out when its color is eaten, so with none left it would
 * never get there. Unlimited for a color no dispenser holds back.
 */
function dispenserRoom(s: State): number[] {
	const onBoard = s.colors.map(() => 0);
	s.target.forEach((c, i) => c >= 0 && s.alive[i] && onBoard[c]++);
	const now = s.colors.map(() => 0);
	const later = s.colors.map(() => 0);
	for (const d of s.dispensers ?? []) {
		let at = d.used;
		let started = false;
		d.colors.forEach((c, k) => {
			if (at >= d.amounts[k]) {
				at -= d.amounts[k];
				return;
			}
			if (!started) now[c] += d.amounts[k] - at;
			else later[c] += d.amounts[k];
			started = true;
			at = 0;
		});
	}
	return onBoard.map((n, c) => (later[c] > 0 ? n - 1 + now[c] : Infinity));
}

/**
 * Same level id and index always give the same puzzle. The colonies come from
 * playing the picture out (see planPlay), dealt into the columns in the order
 * they were played: at random, or as the level's `deal` says.
 */
export function buildPuzzle(
	level: Level,
	index: number,
	override: Partial<Tuning> = {},
	seed = level.seed ?? 0
): State {
	return buildWithPlan(level, index, override, seed).s;
}

/** buildPuzzle(), with the play it dealt from (for dealing it other ways). */
export function buildWithPlan(
	level: Level,
	index: number,
	override: Partial<Tuning> = {},
	seed = level.seed ?? 0
): { plan: Plan; s: State } {
	const plan = planPlay(level, index, override, seed);
	if (level.deal) {
		const fixed = dealAs(plan, [...level.deal].map(Number));
		if (fixed && wins(fixed)) return { plan, s: fixed };
	}
	// The play went out with its groups linked, so a deal of it should win, but a
	// placement can still fail: try a few, then without links, then another seed.
	for (let attempt = 0; attempt <= 8; attempt++) {
		const built = dealRandom(plan, attempt < 8);
		if (wins(built)) return { plan, s: built };
	}
	if (seed >= 1e6) throw new Error(`${level.id}: could not build a winnable deal`);
	return buildWithPlan({ ...level, deal: undefined }, index, override, seed + 1000);
}

/**
 * Play the picture out to get a level's colonies. Each step sends one of:
 *   - a colony of a color it can eat now, no bigger than what it can reach
 *   - now and then, a colony bigger than that, which eats what it can and waits
 *     in its slot for more of its color to open up; buried colors and colors in
 *     many small islands are picked most, since they make the longest waits
 *   - a linked group: a colony that eats now with one that has to wait, and
 *     maybe more, so the group holds its slots until every one is done
 * without ever filling every slot. It avoids colonies of 1 or 2 ants: a lone
 * tiny colony that frees a big color makes one memorable choke point, and then
 * the level is easy. Dealt into columns in the order it was played, keeping
 * a linked group's colonies in different columns (or back to back in one) and
 * nothing behind a lock until its key would be exposed, it's always a way to win.
 */
export function planPlay(
	level: Level,
	index: number,
	override: Partial<Tuning> = {},
	seed = level.seed ?? 0
): Plan {
	const art = parseArt(level);
	const rng = makeRng(hashStr(level.id) + 7919 + seed * 104729);
	const tune = { ...tuning(level, index), ...override };
	const base: State = {
		w: art.w,
		h: art.h,
		colors: art.colors,
		target: art.target,
		alive: art.target.map((c) => c >= 0),
		columns: [[]],
		locks: [-1],
		lockAt: [0],
		slots: new Array(tune.slots).fill(null),
		walking: [],
		moves: 0
	};
	const dispensers = placeDispensers(base, tune, rng);
	if (dispensers.length) {
		base.target = art.target.slice();
		for (const d of dispensers) base.target[d.cell] = DISPENSER;
		base.dispensers = dispensers;
	}
	// Each color's food: in the picture, and handed out by the dispensers.
	const unassigned = art.colors.map(() => 0);
	base.target.forEach((c) => c >= 0 && unassigned[c]++);
	for (const d of dispensers) d.colors.forEach((c, k) => (unassigned[c] += d.amounts[k]));
	let sim = clone(base);
	const order: Colony[] = [];
	const groups = new Map<number, number>();
	const feeds: number[][] = [];
	const openedAt = new Array(art.target.length).fill(Infinity);
	for (const i of foodOf(sim, outside(sim)).flat()) openedAt[i] = 0;
	// Colonies grow with the picture, so the play takes about `tune.sends` sends.
	const food = unassigned.reduce((a, b) => a + b, 0);
	const grow = (mean: number) => Math.max(1, food / (tune.sends * mean));
	const scale = grow(tune.chunks.reduce((a, b) => a + b, 0) / tune.chunks.length);
	tune.chunks = tune.chunks.map((n) => Math.round(n * scale));
	const meanChunk = tune.chunks.reduce((a, b) => a + b, 0) / tune.chunks.length;
	/** About how many steps the play takes, to spread the linked groups over it. */
	const steps = Math.max(1, unassigned.reduce((a, b) => a + b, 0) / meanChunk);
	let linksLeft = tune.links;

	/** Send `colonies` (one, or a linked group) from sim; the board after, if a slot is left. */
	const tryOut = (colonies: Colony[]) => {
		const t = clone(sim);
		t.columns = colonies.map((e) => [{ ...e }]);
		const r = pick(t, 0);
		return { t, r, ok: r.ok && (isWon(t) || t.slots.includes(null)) };
	};
	/** The colonies sent before colony `id` that ate when it went out. */
	const fedBy = (r: PickResult, id: number) =>
		r.ok ? r.meals.map((meal) => meal.id).filter((m) => m < id) : [];
	/** n ants of color c, or all that's left of it when n would leave only 1 or 2. */
	const roundUp = (c: number, n: number) => (unassigned[c] - n <= 2 ? unassigned[c] : n);
	let fed: number[] = [];

	while (!isWon(sim)) {
		const most = dispenserRoom(sim);
		const colors = unassigned.map((_, c) => c).filter((c) => unassigned[c] > 0 && most[c] >= 1);
		const reachable = new Map(colors.map((c) => [c, reachOf(sim, c)]));
		const reach = (c: number) => reachable.get(c)!;
		const free = sim.slots.filter((e) => !e).length;
		const biggest = Math.max(...tune.chunks);
		// Only colors with less in reach than a big colony: one sized past a big open
		// area would just eat it all.
		const canWait = colors.filter((c) => unassigned[c] > reach(c) && reach(c) < biggest);
		const canEat = colors.filter((c) => reach(c) > 0);
		if (!canEat.length) throw new Error(`${level.id}: no exposed color to send`);
		// Colors with room for a colony of 3 or more, when there are any.
		const roomy = canEat.filter((c) => Math.min(unassigned[c], reach(c)) >= 3);
		const size = () => pickOne(tune.chunks, rng);
		/** A colony of a color it can eat, that finishes without waiting. */
		const eater = (id: number, not: number[] = []): Colony => {
			const pool = (roomy.length ? roomy : canEat).filter((c) => !not.includes(c));
			const c = pickWeighted(pool.length ? pool : canEat, reach, rng);
			let n = Math.max(1, Math.min(unassigned[c], size(), reach(c)));
			if (unassigned[c] <= reach(c)) n = roundUp(c, n);
			return { id, c, n: Math.min(n, most[c]) };
		};
		let weights: ((c: number) => number) | undefined;
		/**
		 * A colony that has to wait: more ants than its color has in reach. Food
		 * buried deep, or split into many islands, opens bit by bit, so its wait is long.
		 */
		const waiter = (id: number, not: number[] = [], long = false): Colony | null => {
			const pool = canWait.filter((c) => !not.includes(c));
			if (!pool.length) return null;
			if (!weights) {
				const depth = digDepth(sim);
				const deepest = colors.map(() => 1 << 30);
				sim.target.forEach((c, i) => {
					if (c >= 0 && sim.alive[i]) deepest[c] = Math.min(deepest[c], depth[i]);
				});
				const parts = islands(sim);
				weights = (c) =>
					(unassigned[c] - reach(c)) *
					(reach(c) === 0 ? 2 + Math.min(4, deepest[c]) : 1) *
					(1 + Math.min(12, parts[c]) / 3);
			}
			const c = pickWeighted(pool, weights, rng);
			// Mostly a little more than it can reach, so it waits for the next island or two;
			// a linked one wants a whole chunk more, so its partner sits held for a while.
			const more = long ? size() : Math.max(3, Math.round(size() * rng()));
			return { id, c, n: Math.min(most[c], roundUp(c, Math.min(unassigned[c], reach(c) + more))) };
		};

		let sent: Colony[] = [];
		let next: State | undefined;
		// A linked group needs a slot each and leaves one for the next colony.
		// Late pressure keeps the last few groups for the last part of the play.
		const holdBack =
			tune.late > 0 && linksLeft <= Math.ceil(tune.links * 0.4) && order.length < steps * 0.6;
		const linkNow =
			linksLeft > 0 &&
			free >= 3 &&
			order.length >= 2 &&
			!holdBack &&
			rng() < Math.min(1, (3 * linksLeft) / Math.max(1, steps - order.length));
		if (linkNow) {
			const g = Math.min(free - 1, 2 + Math.floor(rng() * (tune.group - 1)));
			const id = order.length;
			const a = eater(id);
			const b = waiter(id + 1, [a.c], true);
			const group = b ? [a, b] : [];
			// More: as often another that waits as one that eats, all different colors.
			while (b && group.length < g) {
				const not = group.map((e) => e.c);
				const more =
					(rng() < 0.5 ? waiter(id + group.length, not) : null) ?? eater(id + group.length, not);
				if (not.includes(more.c)) break;
				group.push(more);
			}
			if (b) {
				for (const e of group) e.link = id;
				const attempt = tryOut(group);
				if (attempt.ok) {
					sent = group;
					next = attempt.t;
					fed = fedBy(attempt.r, a.id);
					groups.set(id, group.length);
					linksLeft--;
				}
			}
		}
		if (!next) {
			// A colony that waits holds its slot, so only send one while that leaves a slot for the next.
			const wait = free >= 2 && rng() < tune.waitChance ? waiter(order.length) : null;
			const colony = wait ?? eater(order.length);
			let attempt = tryOut([colony]);
			if (!attempt.ok && attempt.r.ok) {
				// Eating one at a time picked different food than the estimate: send only what it ate.
				const ate = attempt.r.meals.find((meal) => meal.id === colony.id)?.eaten.length ?? 0;
				colony.n = Math.max(1, Math.min(colony.n - 1, ate));
				attempt = tryOut([colony]);
			}
			if (!attempt.ok) throw new Error(`${level.id}: could not build colonies`);
			sent = [colony];
			next = attempt.t;
			fed = fedBy(attempt.r, colony.id);
		}
		sim = next;
		for (const e of sent) {
			feeds.push(fed);
			unassigned[e.c] -= e.n;
			// The play keeps plain colonies; deals link their own copies.
			order.push({ id: e.id, c: e.c, n: e.n });
		}
		for (const i of foodOf(sim, outside(sim)).flat()) {
			openedAt[i] = Math.min(openedAt[i], order.length);
		}
	}
	const m = order.length;

	// Locks: keys are blocks that get exposed partway through the play.
	const lockedCols = Math.min(tune.locks, tune.columns - 2);
	const locks = new Array(tune.columns).fill(-1);
	const opensAt: number[] = new Array(tune.columns).fill(0);
	const keysBetween = (from: number, to: number) =>
		base.target
			.map((_, i) => i)
			.filter((i) => base.target[i] >= 0 && openedAt[i] >= m * from && openedAt[i] <= m * to);
	const early = keysBetween(0.2, 0.55);
	/** Keys for locks after the first, with late pressure: they open in the last part of the play. */
	const late = tune.late > 0 ? keysBetween(0.5, 0.85) : early;
	/** Whether every linked group could still go out from columns of its own, with these locks. */
	const groupsFit = () =>
		[...groups].every(([j, g]) => opensAt.filter((at) => at <= j).length >= g);
	// Each lock sits behind 0 to 2 colonies, which can go out before its key is exposed.
	const lockAt = new Array(tune.columns).fill(0);
	for (let k = 0; k < lockedCols; k++) {
		const col = tune.columns - 1 - k;
		const candidates = k > 0 ? late : early;
		if (!candidates.length) break;
		// A key that leaves room for the linked groups, if a few tries find one.
		for (let tries = 0; tries < 6; tries++) {
			const at = Math.floor(rng() * candidates.length);
			locks[col] = candidates[at];
			opensAt[col] = openedAt[locks[col]];
			if (groupsFit() || tries === 5) {
				candidates.splice(at, 1);
				break;
			}
		}
		lockAt[col] = Math.floor(rng() * 3);
	}
	const mystery = order.map(() => rng() < tune.mystery);
	const stackedMystery = order.map(() => rng() < tune.stackMystery);
	const groupAt = order.map(() => -1);
	for (const [j, g] of groups) for (let i = j; i < j + g; i++) groupAt[i] = j;
	return {
		level,
		tune,
		base,
		order,
		groups,
		groupAt,
		feeds,
		openedAt,
		layout: { locks, lockAt, opensAt, mystery, stackedMystery },
		rng
	};
}

/** Deal the play into columns at random, keeping the columns about the same length. */
function dealRandom(plan: Plan, linked: boolean): State {
	const { tune, order, feeds, rng, groupAt, groups } = plan;
	const { lockAt, opensAt } = plan.layout;
	const columns: number[] = new Array(tune.columns).fill(0);
	const placed: number[] = [];
	/** Groups dealt unlinked, because there weren't enough open columns for them. */
	const apart = new Set<number>();
	const open = (k: number, at: number) => opensAt[k] <= at || columns[k] < lockAt[k];
	for (let j = 0; j < order.length; j++) {
		const start = groupAt[j];
		let together = linked && start >= 0 && !apart.has(start);
		if (together && start === j) {
			const room = columns.filter((_, k) => open(k, j)).length;
			if (room < groups.get(j)!) {
				apart.add(j);
				together = false;
			}
		}
		const pickedAt = together ? start : j;
		// Right behind the one before it in its group, so the two leave as one stack.
		if (together && j > start && open(placed[j - 1], pickedAt) && rng() < tune.stack) {
			columns[placed[j - 1]]++;
			placed.push(placed[j - 1]);
			continue;
		}
		/** Columns other colonies of its group already went to. */
		const taken = together ? placed.slice(start, j) : [];
		let allowed = columns.map((_, k) => k).filter((k) => open(k, pickedAt) && !taken.includes(k));
		if (!allowed.length) allowed = columns.map((_, k) => k).filter((k) => open(k, j));
		const shortest = Math.min(...allowed.map((k) => columns[k]));
		let choices = allowed.filter((k) => columns[k] <= shortest + 1);
		// Behind a colony it opens food for, so that one has to go out first and wait.
		const opens = feeds[j]
			.map((w) => placed[w])
			.filter((k) => allowed.includes(k) && columns[k] <= shortest + 3);
		if (opens.length && rng() < tune.behind) choices = opens;
		else if (
			j > 0 &&
			!together &&
			allowed.includes(placed[j - 1]) &&
			columns[placed[j - 1]] <= shortest + 4 &&
			rng() < tune.runs
		)
			choices = [placed[j - 1]];
		const k = pickOne(choices, rng);
		columns[k]++;
		placed.push(k);
	}
	return dealAs(plan, placed, linked) ?? dealAs(plan, placed, false)!;
}

/**
 * Deal the play with colony j in column placement[j]; null if that can't be
 * done: a colony behind a lock that the play sends before its key is exposed.
 * A linked group's colonies go out one after another in the play, so any that
 * share a column sit back to back there and leave as one stack. Without
 * `linked`, they go out one at a time.
 */
export function dealAs(plan: Plan, placement: number[], linked = true): State | null {
	const { tune, order, base, groupAt } = plan;
	const { lockAt, opensAt, mystery, stackedMystery } = plan.layout;
	if (placement.length !== order.length) return null;
	const columns: Colony[][] = Array.from({ length: tune.columns }, () => []);
	const intended: number[] = [];
	for (let j = 0; j < order.length; j++) {
		const k = placement[j];
		if (!(k >= 0 && k < tune.columns)) return null;
		const start = groupAt[j];
		const linkedHere = linked && start >= 0;
		const pickedAt = linkedHere ? start : j;
		if (!(opensAt[k] <= pickedAt || columns[k].length < lockAt[k])) return null;
		const colony: Colony = { ...order[j] };
		if (linkedHere) colony.link = order[start].id;
		const stacked = linkedHere && j > start && placement[j - 1] === k;
		if (mystery[j] || (stacked && stackedMystery[j])) colony.mystery = true;
		columns[k].push(colony);
		// The group goes out when its first colony is picked.
		if (!linkedHere || start === j) intended.push(k);
	}
	// A lock with no colonies behind it would block nothing.
	const locks = plan.layout.locks.map((key, k) => (columns[k].length <= lockAt[k] ? -1 : key));
	return { ...clone(base), columns, locks, lockAt: lockAt.slice(), intended, moves: 0 };
}

/** Where each colony of the play sits in a deal of it: its column, in play order. */
export function placementOf(s: State): number[] {
	const at: number[] = [];
	s.columns.forEach((col, k) => col.forEach((e) => (at[e.id] = k)));
	return at;
}

/** Whether playing `intended` patiently wins. */
export function wins(s0: State): boolean {
	const s = clone(s0);
	for (const col of s0.intended ?? []) if (!pick(s, col).ok) return false;
	return isWon(s);
}
