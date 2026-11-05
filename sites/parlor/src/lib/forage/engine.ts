/*
 * Forage game engine: pure logic, no DOM, no imports.
 *
 * A pixel picture is made of colored blocks. Below it are columns of ant
 * colonies, each with a color and a count. Tap the front colony of a column and
 * its ants eat up to `count` blocks of their color, but only blocks that are
 * exposed: a side touches empty space that reaches the outside of the picture.
 * Holes sealed inside the picture don't count until something opens a way to
 * them. Ants eat from the outside in, so eating a block can expose the one
 * behind it.
 *
 * A colony that still has ants left keeps working in one of 5 slots, and eats
 * again by itself whenever blocks of its color become exposed. A colony can't be
 * sent out if it would need a slot and every slot is full. Clear every block to win.
 *
 * Later levels add:
 *   - linked colonies: two side-by-side colonies that go out together and stay
 *     linked in their slots: neither leaves until both are done
 *   - locks: a lock sits in a column in front of the colony it blocks; once it
 *     reaches the front, the column waits until its key block is exposed
 *   - mystery colonies: their color is hidden until they reach the front
 *
 * Each color's colony counts add up exactly to its blocks.
 */

import {
	hashStr,
	makeRng,
	parseArt,
	pickWeighted,
	type Art,
	type Color,
	type Rng
} from '../shared/engine.ts';

export { hashStr, makeRng, parseArt, type Art, type Color, type Rng };

/** A level as stored: rows of color letters, '.' for an empty pixel. */
export interface Level {
	id: string;
	name: string;
	palette: Record<string, string>;
	art: string[];
	/** Override the tuning that the level's place in play order sets. */
	tuning?: Partial<Tuning>;
	/** Which deal of colonies to use; `pnpm -F parlor forage:tune` picks it to hit a difficulty. */
	seed?: number;
	/** Share of careless games won with this deal, measured by `forage:tune`. */
	wins?: number;
}

export interface Colony {
	id: number;
	c: number;
	/** Ants left. */
	n: number;
	/** The colony this one goes out with. */
	link?: number;
	/** Color hidden until it reaches the front of its column. */
	mystery?: boolean;
	/** While working: ticks until it can send its next ant. */
	cool?: number;
	/** While working: how much food it set out to collect. */
	total?: number;
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
	/** Color of each pixel; -1 is empty, not part of the picture. */
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
}

/** One colony eating: which blocks, and in which wave (0 = already exposed). */
export interface Meal {
	id: number;
	c: number;
	from: 'column' | 'slot';
	eaten: { cell: number; wave: number }[];
}

export type PickResult =
	| { ok: false; reason: 'empty' | 'locked' | 'partner' | 'no-slot' }
	| {
			ok: true;
			/** The colonies sent out: one, or a linked pair. */
			sent: number[];
			meals: Meal[];
			/** Slots the sent colonies went to with ants left. */
			parked: number[];
			/** Columns that opened because their key got exposed. */
			unlocked: number[];
			won: boolean;
	  };

export function clone(s: State): State {
	return {
		...s,
		alive: s.alive.slice(),
		columns: s.columns.map((col) => col.slice()),
		locks: s.locks.slice(),
		lockAt: s.lockAt.slice(),
		slots: s.slots.map((e) => e && { ...e }),
		walking: s.walking.slice()
	};
}

export function isWon(s: State): boolean {
	return !s.alive.some(Boolean);
}

export function blocksLeft(s: State): number {
	return s.alive.filter(Boolean).length;
}

/** Empty pixels that reach the outside of the picture through other empty pixels (sides only). */
export function outside(s: State): Uint8Array {
	const { w, h } = s;
	const out = new Uint8Array(w * h);
	const queue: number[] = [];
	const add = (i: number) => {
		if (!out[i] && !s.alive[i]) {
			out[i] = 1;
			queue.push(i);
		}
	};
	for (let x = 0; x < w; x++) {
		add(x);
		add((h - 1) * w + x);
	}
	for (let y = 0; y < h; y++) {
		add(y * w);
		add(y * w + w - 1);
	}
	for (let k = 0; k < queue.length; k++) {
		const i = queue[k];
		const x = i % w;
		if (x > 0) add(i - 1);
		if (x < w - 1) add(i + 1);
		if (i >= w) add(i - w);
		if (i < w * (h - 1)) add(i + w);
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

/** Every exposed block. */
export function exposed(s: State): Set<number> {
	const out = outside(s);
	const set = new Set<number>();
	for (let i = 0; i < s.alive.length; i++) if (s.alive[i] && exposedAt(s, out, i)) set.add(i);
	return set;
}

/** Whether a key block is exposed (or already eaten). */
export function keyOpen(s: State, cell: number): boolean {
	return cell < 0 || !s.alive[cell] || exposedAt(s, outside(s), cell);
}

/** Whether column `col` still has a lock in it (its key isn't exposed yet). */
export function hasLock(s: State, col: number): boolean {
	return !keyOpen(s, s.locks[col]);
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
	return exposedIn(s, outside(s), c);
}

/** The column whose front colony is `id`, or -1. */
function frontColumn(s: State, id: number): number {
	return s.columns.findIndex((col) => col[0]?.id === id);
}

export type SendResult =
	| { ok: false; reason: 'empty' | 'locked' | 'partner' | 'no-slot' }
	| { ok: true; sent: number[]; slots: number[]; dispatched: Dispatch[] };

/** An ant leaving its colony's slot for a food, arriving in `eta` ticks. */
export interface Dispatch {
	slot: number;
	cell: number;
	c: number;
	eta: number;
}

/**
 * Send out the front colony of column `col` (and its linked partner) into free
 * working slots. They start eating on the next tick. Every colony out working
 * holds a slot until it has eaten all its ants' worth, so with all slots busy
 * nothing more can go. Mutates s only when allowed.
 */
export function send(s: State, col: number): SendResult {
	const front = s.columns[col]?.[0];
	if (!front) return { ok: false, reason: 'empty' };
	if (isLocked(s, col)) return { ok: false, reason: 'locked' };
	const cols = [col];
	if (front.link !== undefined) {
		const other = frontColumn(s, front.link);
		if (other < 0 || isLocked(s, other)) return { ok: false, reason: 'partner' };
		cols.push(other);
	}
	const free = s.slots.flatMap((e, k) => (e ? [] : [k]));
	if (free.length < cols.length) return { ok: false, reason: 'no-slot' };
	const columns = s.columns.slice();
	const slots = s.slots.slice();
	const sent: number[] = [];
	const lockAt = s.lockAt.slice();
	cols.forEach((k, j) => {
		const colony = { ...columns[k][0], total: columns[k][0].n };
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
	const out = outside(s);
	const taken = claimed(s);
	const dispatched: Dispatch[] = [];
	for (const k of free.slice(0, cols.length)) {
		const ant = dispatch(s, slots[k]!, out, taken, k);
		if (ant) dispatched.push({ slot: k, ...ant });
	}
	freeSlots(s, []);
	return { ok: true, sent, slots: free.slice(0, cols.length), dispatched };
}

export interface TickResult {
	/** Food picked up this tick. */
	eaten: { cell: number; c: number; id: number }[];
	/** Colonies that sent their last ant and left their slot. */
	finished: number[];
	/** Columns whose lock went away because their key got exposed. */
	unlocked: number[];
	/** Ants that left their colony this tick. */
	dispatched: Dispatch[];
	won: boolean;
}

/** How many cells an ant walks per tick. */
export const ANT_SPEED = 3;

/**
 * Where ants can walk, on a grid one cell bigger than the picture on every side:
 * the ring around the outside of the picture, plus empty space inside it that
 * reaches the outside. Picture cell (x, y) is (x + 1, y + 1) here.
 */
function walkable(s: State, out: Uint8Array): Uint8Array {
	const W = s.w + 2;
	const H = s.h + 2;
	const ok = new Uint8Array(W * H);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1;
			ok[y * W + x] = edge || out[(y - 1) * s.w + (x - 1)] ? 1 : 0;
		}
	}
	return ok;
}

/** Where a slot's ants come out: a point on the bottom edge, spread out like the slots. */
function door(s: State, slot: number): number {
	const W = s.w + 2;
	const x =
		1 + Math.min(s.w - 1, Math.max(0, Math.round(((slot + 0.5) / s.slots.length) * s.w - 0.5)));
	return (s.h + 1) * W + x;
}

/** Shortest walking distance (in cells) from a slot's door to every walkable cell; -1 if none. */
function walkFrom(s: State, ok: Uint8Array, slot: number): { dist: Int32Array; prev: Int32Array } {
	const W = s.w + 2;
	const H = s.h + 2;
	const dist = new Int32Array(W * H).fill(-1);
	const prev = new Int32Array(W * H).fill(-1);
	const start = door(s, slot);
	dist[start] = 0;
	const queue = [start];
	for (let k = 0; k < queue.length; k++) {
		const i = queue[k];
		const x = i % W;
		for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
			if (j < 0 || j >= W * H || !ok[j] || dist[j] >= 0) continue;
			dist[j] = dist[i] + 1;
			prev[j] = i;
			queue.push(j);
		}
	}
	return { dist, prev };
}

/** The walkable cell beside food `cell` that's closest to the door, in the bigger grid; -1 if none. */
function approach(s: State, field: { dist: Int32Array }, cell: number): number {
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
 * Ticks an ant from `slot` takes to reach food `cell`: it walks out of its door,
 * around the edge of the picture and in through cleared space.
 */
export function travel(
	s: State,
	cell: number,
	slot = 0,
	field = walkFrom(s, walkable(s, outside(s)), slot)
): number {
	const at = approach(s, field, cell);
	const steps = at < 0 ? s.w + s.h : field.dist[at] + 1;
	return 1 + Math.ceil(steps / ANT_SPEED);
}

/**
 * The path an ant from `slot` walks to food `cell`, as points in picture cells
 * (x, y can be -1 or w / h on the ring outside the picture). Ends on the food.
 */
export function antPath(s: State, slot: number, cell: number): { x: number; y: number }[] {
	const W = s.w + 2;
	const field = walkFrom(s, walkable(s, outside(s)), slot);
	const at = approach(s, field, cell);
	const pts: { x: number; y: number }[] = [];
	for (let i = at; i >= 0; i = field.prev[i])
		pts.push({ x: (i % W) - 1, y: Math.floor(i / W) - 1 });
	pts.reverse();
	pts.push({ x: cell % s.w, y: Math.floor(cell / s.w) });
	return pts;
}

/** Send one ant from colony e to its first exposed, unclaimed food, if there is one. Mutates e. */
function dispatch(
	s: State,
	e: Colony,
	out: Uint8Array,
	taken: Set<number>,
	slot: number
): Ant | null {
	if (e.n <= 0) return null;
	const cell = exposedIn(s, out, e.c).find((i) => !taken.has(i));
	if (cell === undefined) return null;
	taken.add(cell);
	const ant = {
		cell,
		c: e.c,
		id: e.id,
		eta: travel(s, cell, slot, walkFrom(s, walkable(s, out), slot))
	};
	s.walking = [...s.walking, ant];
	e.n--;
	e.cool = DISPATCH_EVERY;
	return ant;
}

/** Whether a working colony has sent all its ants out. */
export function isDone(e: Colony): boolean {
	return e.n === 0;
}

/** Food some ant is already heading for. */
function claimed(s: State): Set<number> {
	return new Set(s.walking.map((a) => a.cell));
}

/**
 * Colonies that have sent their last ant leave their slots right away (their ants
 * finish the walk on their own); linked ones only once both have. Mutates s.
 */
function freeSlots(s: State, finished: number[]) {
	const slots = s.slots.slice();
	const done = new Set(slots.flatMap((e) => (e && isDone(e) ? [e.id] : [])));
	for (let k = 0; k < slots.length; k++) {
		const e = slots[k];
		if (!e || !done.has(e.id)) continue;
		const partnerOut = e.link !== undefined && slots.some((p) => p?.id === e.link);
		if (partnerOut && !done.has(e.link!)) continue;
		slots[k] = null;
		finished.push(e.id);
	}
	s.slots = slots;
}

/**
 * One step of time:
 *   1. ants that reach their food pick it up (the food is gone)
 *   2. every working colony with ants left sends one more, to the first exposed
 *      food of its color that no ant is heading for yet: bottom row first, left
 *      to right. Food uncovered by an ant that just arrived counts right away.
 * A colony sends an ant every DISPATCH_EVERY ticks and frees its slot as soon
 * as it has sent its last one; linked colonies free theirs together, once both
 * have.
 */
export function tick(s: State): TickResult {
	const wasLocked = s.locks.map((key, k) => key >= 0 && hasLock(s, k));
	const eaten: TickResult['eaten'] = [];
	const finished: number[] = [];
	// Ants that get to their food pick it up.
	const still: Ant[] = [];
	for (const a of s.walking) {
		if (a.eta > 1) still.push({ ...a, eta: a.eta - 1 });
		else {
			s.alive[a.cell] = false;
			eaten.push({ cell: a.cell, c: a.c, id: a.id });
		}
	}
	s.walking = still;
	const slots = s.slots.map((e) => e && { ...e });
	s.slots = slots;
	const out = outside(s);
	const taken = claimed(s);
	const dispatched: Dispatch[] = [];
	slots.forEach((e, k) => {
		if (!e || e.n <= 0) return;
		// One ant every few ticks; a colony that found nothing tries again on the next tick.
		e.cool = (e.cool ?? 0) - 1;
		if (e.cool > 0) return;
		const ant = dispatch(s, e, out, taken, k);
		if (ant) dispatched.push({ slot: k, ...ant });
		else e.cool = 0;
	});
	freeSlots(s, finished);
	const unlocked = wasLocked.flatMap((was, k) => (was && !hasLock(s, k) ? [k] : []));
	return { eaten, finished, unlocked, dispatched, won: isWon(s) };
}

/** Exposed food of color c in eating order: bottom rows first, then left to right. */
function exposedIn(s: State, out: Uint8Array, c: number): number[] {
	const cells: number[] = [];
	for (let y = s.h - 1; y >= 0; y--) {
		for (let x = 0; x < s.w; x++) {
			const i = y * s.w + x;
			if (s.alive[i] && s.target[i] === c && exposedAt(s, out, i)) cells.push(i);
		}
	}
	return cells;
}

/** Whether no ant is on its way and no working colony has food it can send one to. */
export function isQuiet(s: State): boolean {
	if (s.walking.length) return false;
	const out = outside(s);
	return s.slots.every((e) => !e || e.n === 0 || exposedIn(s, out, e.c).length === 0);
}

/** Whether a working colony has nothing to send ants to: no unclaimed food of its color in reach. */
export function isWaiting(s: State, e: Colony): boolean {
	return e.n > 0 && exposedOf(s, e.c).every((i) => claimed(s).has(i));
}

/**
 * How much food of color c a colony with unlimited ants could eat from here,
 * with nothing else eating. Fast: eats whole waves at a time.
 */
function reachOf(s0: State, c: number): number {
	const s = clone(s0);
	let n = 0;
	for (;;) {
		const cells = exposedIn(s, outside(s), c);
		if (!cells.length) return n;
		for (const i of cells) s.alive[i] = false;
		n += cells.length;
	}
}

/** Let time run until no working colony can eat. Returns what each colony ate, by tick. */
export function settle(s: State): { meals: Meal[]; unlocked: number[] } {
	const byId = new Map<number, Meal>();
	const unlocked: number[] = [];
	for (let t = 0; !isQuiet(s); t++) {
		const r = tick(s);
		for (const e of r.eaten) {
			let meal = byId.get(e.id);
			if (!meal) byId.set(e.id, (meal = { id: e.id, c: e.c, from: 'slot', eaten: [] }));
			meal.eaten.push({ cell: e.cell, wave: t });
		}
		unlocked.push(...r.unlocked);
	}
	return { meals: [...byId.values()], unlocked };
}

/**
 * A patient move: send a colony, then wait until nothing more can be eaten.
 * This is what the solver, the level builder and the tests play.
 */
export function pick(s: State, col: number): PickResult {
	const t = clone(s);
	const r = send(t, col);
	if (!r.ok) return r;
	const { meals, unlocked } = settle(t);
	for (const m of meals) if (r.sent.includes(m.id)) m.from = 'column';
	Object.assign(s, t);
	const parked = s.slots.flatMap((e, k) => (e && r.sent.includes(e.id) ? [k] : []));
	return { ok: true, sent: r.sent, meals, parked, unlocked, won: isWon(s) };
}

/** Columns whose front colony can be sent out right now. */
export function legalPicks(s: State): number[] {
	const out: number[] = [];
	for (let k = 0; k < s.columns.length; k++) if (send(clone(s), k).ok) out.push(k);
	return out;
}

/** True when the picture isn't finished, nothing can eat, and no colony can be sent out. */
export function isStuck(s: State): boolean {
	return !isWon(s) && isQuiet(s) && legalPicks(s).length === 0;
}

/** Whether a patient pick would leave a colony waiting in a slot; null if not allowed. */
export function wouldWait(s: State, col: number): boolean | null {
	const r = pick(clone(s), col);
	return r.ok ? r.parked.length > 0 : null;
}

/**
 * Search for a way to win from here: depth-first, trying picks that eat the most
 * without needing a slot first, then again with some shuffling when that runs
 * out of tries. Gives up after `maxMs`. Returns the column picks, or null.
 */
export function solve(s0: State, budget = 3000, restarts = 40, maxMs = 1500): number[] | null {
	const until = performance.now() + maxMs;
	const key = (s: State) =>
		s.columns.map((c) => c.length).join(',') +
		'|' +
		s.slots.map((e) => (e ? `${e.id}:${e.n}` : '-')).join(',') +
		'|' +
		blocksLeft(s);
	for (let round = 0; round < restarts; round++) {
		const rng = makeRng(round * 7919 + 1);
		const noise = round === 0 ? 0 : 10 + round * 6;
		const seen = new Set<string>();
		let tries = 0;
		const walk = (s: State, path: number[]): number[] | null => {
			if (isWon(s)) return path;
			if (tries++ > budget || performance.now() > until) return null;
			const k = key(s);
			if (seen.has(k)) return null;
			seen.add(k);
			const options: { col: number; t: State; score: number }[] = [];
			for (let col = 0; col < s.columns.length; col++) {
				if (!s.columns[col].length) continue;
				const t = clone(s);
				const r = pick(t, col);
				if (!r.ok) continue;
				const eaten = r.meals.reduce((sum, m) => sum + m.eaten.length, 0);
				const free = t.slots.filter((e) => !e).length;
				const score =
					eaten - r.parked.length * 40 + free * 3 + r.unlocked.length * 30 + rng() * noise;
				options.push({ col, t, score });
			}
			options.sort((a, b) => b.score - a.score);
			for (const o of options) {
				const found = walk(o.t, [...path, o.col]);
				if (found) return found;
			}
			return null;
		};
		const found = walk(clone(s0), []);
		if (found) return found;
		if (performance.now() > until) break;
	}
	return null;
}

export interface Tuning {
	columns: number;
	slots: number;
	/** Chance each step sends a colony bigger than what it can eat yet, so it has to wait. */
	waitChance: number;
	/** Colony sizes to choose from. */
	chunks: number[];
	/** Linked pairs. */
	links: number;
	/** Locked columns. */
	locks: number;
	/** Share of colonies whose color is hidden until they reach the front. */
	mystery: number;
}

const CHUNKS = [10, 12, 15, 20, 20, 25, 30];

/** How a level's place in play order sets its difficulty. */
export function tuning(level: Level, index: number): Tuning {
	return {
		columns: index < 2 ? 3 : index < 40 ? 4 : 5,
		slots: 5,
		waitChance: Math.min(0.55, 0.2 + index * 0.025),
		chunks: CHUNKS,
		links: index < 4 ? 0 : Math.min(4, 1 + Math.floor((index - 4) / 12)),
		locks: index < 2 ? 0 : index < 8 ? 1 : index < 40 ? 2 : 3,
		mystery: index < 5 ? 0 : Math.min(0.35, 0.1 + (index - 5) * 0.004),
		...level.tuning
	};
}

/**
 * Same level id and index always give the same puzzle. The colonies come from
 * playing the picture out: each step sends a colony of a color it can eat, or
 * now and then one too big to finish, which has to wait, without ever
 * overfilling the slots. That play is dealt into the columns in order, keeping
 * linked pairs side by side and locked columns empty until their key would be
 * exposed, so it's always a way to win.
 */
export function buildPuzzle(
	level: Level,
	index: number,
	override: Partial<Tuning> = {},
	seed = level.seed ?? 0
): State {
	const art = parseArt(level);
	const rng = makeRng(hashStr(level.id) + 7919 + seed * 104729);
	const tune = { ...tuning(level, index), ...override };
	const unassigned = art.colors.map(() => 0);
	art.target.forEach((c) => c >= 0 && unassigned[c]++);
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
	const sim = clone(base);
	const order: Colony[] = [];
	/** The step before which each block is first exposed. */
	const openedAt = new Array(art.target.length).fill(Infinity);
	for (const i of exposed(sim)) openedAt[i] = 0;

	/** How many slots were free before each step of the play. */
	const freeBefore: number[] = [];
	let sim2 = sim;
	while (!isWon(sim2)) {
		const colors = unassigned.map((n, c) => c).filter((c) => unassigned[c] > 0);
		const reachable = new Map(colors.map((c) => [c, reachOf(sim2, c)]));
		const free = sim2.slots.filter((e) => !e).length;
		// A colony bigger than what it can eat now has to wait, holding its slot.
		// Only send one while that still leaves a slot for the next colony.
		const canWait = colors.filter((c) => unassigned[c] > reachable.get(c)!);
		const canEat = colors.filter((c) => reachable.get(c)! > 0);
		if (!canEat.length) throw new Error(`${level.id}: no exposed color to send`);
		let c: number;
		let n: number;
		const size = tune.chunks[Math.floor(rng() * tune.chunks.length)];
		if (free >= 2 && canWait.length && rng() < tune.waitChance) {
			// Colors sealed off entirely make the longest waits.
			c = pickWeighted(canWait, (k) => unassigned[k] * (reachable.get(k) === 0 ? 4 : 1), rng);
			n = Math.min(unassigned[c], Math.max(size, reachable.get(c)! + 1));
		} else {
			c = pickWeighted(canEat, (k) => reachable.get(k)!, rng);
			n = Math.max(1, Math.min(unassigned[c], size, reachable.get(c)!));
		}
		const colony: Colony = { id: order.length, c, n };
		const tryIt = () => {
			const t = clone(sim2);
			t.columns = [[{ ...colony }]];
			const r = pick(t, 0);
			return { t, r, ok: r.ok && (isWon(t) || t.slots.includes(null)) };
		};
		let attempt = tryIt();
		if (!attempt.ok && attempt.r.ok) {
			// Eating one at a time picked different food than the estimate: send only what it ate.
			const ate = attempt.r.meals.find((meal) => meal.id === colony.id)?.eaten.length ?? 0;
			colony.n = Math.max(1, Math.min(colony.n - 1, ate));
			attempt = tryIt();
		}
		if (!attempt.ok) throw new Error(`${level.id}: could not build colonies`);
		freeBefore.push(free);
		sim2 = attempt.t;
		unassigned[c] -= colony.n;
		order.push(colony);
		for (const i of exposed(sim2)) openedAt[i] = Math.min(openedAt[i], order.length);
	}
	const m = order.length;

	// Linked colonies go out together and leave their slots together, which changes
	// how long slots stay busy. Try a few placements for the pairs, keep the first
	// deal whose built-in play still wins, and drop the links if none does.
	for (let attempt = 0; attempt <= 8; attempt++) {
		const built = deal(attempt < 8 ? tune.links : 0);
		if (wins(built)) return built;
	}
	if (seed >= 1e6) throw new Error(`${level.id}: could not build a winnable deal`);
	return buildPuzzle(level, index, override, seed + 1000);

	function deal(links: number): State {
		const colonies = order.map(
			({ link: _, mystery: __, ...rest }) => (void _, void __, { ...rest }) as Colony
		);

		// Linked pairs: two colonies in a row of the play, so they can go out together.
		const linkedAt = new Set<number>();
		for (let tries = 0; linkedAt.size < links * 2 && tries < 50; tries++) {
			const j = 2 + Math.floor(rng() * Math.max(1, m - 4));
			if (
				j + 1 >= m ||
				freeBefore[j] < 2 ||
				linkedAt.has(j) ||
				linkedAt.has(j + 1) ||
				linkedAt.has(j - 1) ||
				linkedAt.has(j + 2)
			)
				continue;
			colonies[j].link = colonies[j + 1].id;
			colonies[j + 1].link = colonies[j].id;
			linkedAt.add(j).add(j + 1);
		}

		// Locks: keys are blocks that get exposed partway through the play.
		const lockedCols = Math.min(tune.locks, tune.columns - 2);
		const locks = new Array(tune.columns).fill(-1);
		const candidates = art.target
			.map((c, i) => i)
			.filter((i) => art.target[i] >= 0 && openedAt[i] >= m * 0.2 && openedAt[i] <= m * 0.55);
		// Each lock sits behind 0 to 2 colonies, which can go out before its key is exposed.
		const lockAt = new Array(tune.columns).fill(0);
		for (let k = 0; k < lockedCols && candidates.length; k++) {
			const at = Math.floor(rng() * candidates.length);
			locks[tune.columns - 1 - k] = candidates.splice(at, 1)[0];
			lockAt[tune.columns - 1 - k] = Math.floor(rng() * 3);
		}
		/** The first step a colony behind column k's lock may be picked. */
		const opensAt = locks.map((key) => (key < 0 ? 0 : openedAt[key]));

		// Deal the play into the columns, keeping them about the same length.
		const columns: Colony[][] = Array.from({ length: tune.columns }, () => []);
		const placed: number[] = [];
		for (let j = 0; j < m; j++) {
			const colony = colonies[j];
			const partnerFirst =
				colony.link !== undefined && linkedAt.has(j - 1) && colonies[j - 1].id === colony.link;
			const pickedAt = partnerFirst ? j - 1 : j;
			let allowed = columns
				.map((_, k) => k)
				.filter((k) => opensAt[k] <= pickedAt || columns[k].length < lockAt[k]);
			if (partnerFirst) allowed = allowed.filter((k) => k !== placed[j - 1]);
			const shortest = Math.min(...allowed.map((k) => columns[k].length));
			const choices = allowed.filter((k) => columns[k].length <= shortest + 1);
			const k = choices[Math.floor(rng() * choices.length)];
			if (rng() < tune.mystery) colony.mystery = true;
			columns[k].push(colony);
			placed.push(k);
		}
		const intended = placed.filter(
			(_, j) => !(linkedAt.has(j) && colonies[j - 1]?.id === colonies[j].link)
		);
		// A lock with no colonies behind it would block nothing.
		columns.forEach((col, k) => {
			if (col.length <= lockAt[k]) locks[k] = -1;
		});
		return { ...clone(base), columns, locks, lockAt, intended, moves: 0 };
	}
}

/** Whether playing `intended` patiently wins. */
export function wins(s0: State): boolean {
	const s = clone(s0);
	for (const col of s0.intended ?? []) if (!pick(s, col).ok) return false;
	return isWon(s);
}
