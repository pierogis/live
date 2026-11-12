// Rules: a sent colony takes a slot and sends ants one at a time to exposed blocks of its color
// (a side touching empty space that reaches the outside). It holds the slot until its last ant
// leaves, waiting while none of its food is exposed. Linked colonies go and free their slots
// together; a lock holds its column until its key block is exposed. Clear every block to win.
// Imports use `.ts` so node scripts can load this file directly.
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

export interface Level extends Picture {
	tuning?: Partial<Tuning>;
	seed?: number;
	push?: number;
	wins?: number;
	tries?: number[];
	focus?: number;
	deal?: string;
	breaks?: number;
	cruxes?: number;
	spread?: number;
}

export const TUNED = [
	'tuning',
	'seed',
	'push',
	'deal',
	'wins',
	'tries',
	'focus',
	'breaks',
	'cruxes',
	'spread'
] as const satisfies readonly Exclude<keyof Level, keyof Picture>[];

export interface Colony {
	id: number;
	c: number;
	n: number;
	link?: number;
	mystery?: boolean;
	cool?: number;
}

export const DISPATCH_EVERY = 2;

export interface Ant {
	cell: number;
	eta: number;
	c: number;
	id: number;
}

export interface State {
	w: number;
	h: number;
	colors: Color[];
	// Color per pixel; -1 is empty, DISPENSER a dispenser's tile.
	target: number[];
	alive: boolean[];
	columns: Colony[][];
	locks: number[];
	lockAt: number[];
	slots: (Colony | null)[];
	walking: Ant[];
	moves: number;
	intended?: number[];
	dispensers?: Dispenser[];
}

export const DISPENSER = -2;

export interface Dispenser {
	cell: number;
	colors: number[];
	amounts: number[];
	used: number;
}

export function dispensing(d: Dispenser): { c: number; left: number } | null {
	let at = d.used;
	for (let k = 0; k < d.colors.length; k++) {
		if (at < d.amounts[k]) return { c: d.colors[k], left: d.amounts[k] - at };
		at -= d.amounts[k];
	}
	return null;
}

export interface Meal {
	id: number;
	c: number;
	eaten: { cell: number; wave: number }[];
}

export type PickResult =
	| Refusal
	| {
			ok: true;
			sent: number[];
			meals: Meal[];
			parked: number[];
			unlocked: number[];
			won: boolean;
	  };

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

const blocksCache = new WeakMap<boolean[], string>();

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

function withDispensers(s: State, key: string): string {
	return s.dispensers?.length ? `${key}:${s.dispensers.map((d) => d.used).join('.')}` : key;
}

export function isWon(s: State): boolean {
	return !s.alive.some(Boolean);
}

export function foodLeft(s: State, c: number): boolean {
	for (let i = 0; i < s.target.length; i++) if (s.alive[i] && s.target[i] === c) return true;
	for (const d of s.dispensers ?? []) {
		if (!s.alive[d.cell]) continue;
		let end = 0;
		for (let k = 0; k < d.colors.length; k++) {
			end += d.amounts[k];
			if (d.colors[k] === c && d.used < end) return true;
		}
	}
	return false;
}

export function blocksLeft(s: State): number {
	let n = s.alive.filter(Boolean).length;
	for (const d of s.dispensers ?? []) {
		const total = d.amounts.reduce((a, b) => a + b, 0);
		if (s.alive[d.cell]) n += total - d.used - 1;
	}
	return n;
}

export function groupOf(s: State, link: number): Colony[] {
	const out: Colony[] = [];
	for (const col of s.columns) for (const e of col) if (e.link === link) out.push(e);
	return out;
}

// Only step() and reachOf() eat blocks in place, and both refresh this via grewOutside().
// Anything else that changes blocks must make a new alive array.
const outCache = new WeakMap<boolean[], Uint8Array>();

// Shared and cached: don't mutate the result.
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

// While a send settles, nothing else sees its board, so its caches grow in place (see onOwnGround()).
let mine: {
	out: Uint8Array;
	ok: Uint8Array | null;
	food: number[][] | null;
	lists: Set<number[]>;
	dists: (Int32Array | undefined)[];
} | null = null;

let joined = new Int32Array(0);
let joinStamp = 0;

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
	// Otherwise always a new array, even if nothing joined: food cached by it changed.
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

function keyOpen(s: State, cell: number, out?: Uint8Array): boolean {
	return cell < 0 || !s.alive[cell] || exposedAt(s, out ?? outside(s), cell);
}

export function hasLock(s: State, col: number, out?: Uint8Array): boolean {
	return !keyOpen(s, s.locks[col], out);
}

export function isLocked(s: State, col: number): boolean {
	return s.lockAt[col] === 0 && hasLock(s, col);
}

export function exposedOf(s: State, c: number): number[] {
	return exposedIn(s, outside(s), c).slice();
}

export type SendResult = Refusal | Sent;
type Sent = { ok: true; sent: number[]; dispatched: Dispatch[] };

type Refusal = { ok: false; reason: 'empty' | 'locked' | 'partner' | 'no-slot' };

interface Walks {
	dist: Int32Array;
	prev: Int32Array;
}

export interface Dispatch {
	slot: number;
	cell: number;
	c: number;
	eta: number;
	walks: Walks;
}

interface Ground {
	out: Uint8Array;
	taken: Claims;
	ok?: Uint8Array;
	quick?: boolean;
}

type Allowed = { ok: true; cols: number[]; free: number[] };

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
			let stack = 0;
			while (stack < column.length && column[stack].link === g) stack++;
			if (stack < members || isLocked(s, k)) return { ok: false, reason: 'partner' };
			if (s.lockAt[k] < stack && hasLock(s, k)) return { ok: false, reason: 'partner' };
			for (let n = 0; n < stack; n++) cols.push(k);
		}
	}
	const free = s.slots.flatMap((e, k) => (e ? [] : [k]));
	if (free.length < cols.length) return { ok: false, reason: 'no-slot' };
	return { ok: true, cols, free };
}

export function send(s: State, col: number): SendResult {
	const can = canSend(s, col);
	return can.ok ? sendOut(s, false, can) : can;
}

function sendOut(s: State, quick: boolean, { cols, free }: Allowed): Sent {
	const columns = s.columns.slice();
	const slots = s.slots.slice();
	const sent: number[] = [];
	const lockAt = s.lockAt.slice();
	cols.forEach((k, j) => {
		const colony = { ...columns[k][0] };
		columns[k] = columns[k].slice(1);
		if (lockAt[k] > 0 && hasLock(s, k)) lockAt[k]--;
		slots[free[j]] = colony;
		sent.push(colony.id);
	});
	s.columns = columns;
	s.slots = slots;
	s.lockAt = lockAt;
	s.moves++;
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
	eaten: { cell: number; c: number; id: number }[];
	unlocked: number[];
	dispatched: Dispatch[];
	won: boolean;
}

const ANT_SPEED = 3;

// A grid one cell bigger than the picture on every side: picture (x, y) is (x + 1, y + 1).
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

const walkCache = new WeakMap<Uint8Array, Uint8Array>();

function walkCell(s: State, i: number): number {
	return (Math.floor(i / s.w) + 1) * (s.w + 2) + (i % s.w) + 1;
}

function grewWalkable(s: State, ok: Uint8Array, added: number[]): Uint8Array {
	const grown = ok.slice();
	for (const i of added) grown[walkCell(s, i)] = 1;
	return grown;
}

function door(s: State, slot: number): number {
	const W = s.w + 2;
	const x =
		1 + Math.min(s.w - 1, Math.max(0, Math.round(((slot + 0.5) / s.slots.length) * s.w - 0.5)));
	return (s.h + 1) * W + x;
}

function walkFrom(s: State, ok: Uint8Array, slot: number, cell: number): Walks {
	const W = s.w + 2;
	const H = s.h + 2;
	const dist = new Int32Array(W * H).fill(-1);
	const prev = new Int32Array(W * H).fill(-1);
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

function walkSteps(s: State, cell: number, field: Walks): number {
	const at = approach(s, field, cell);
	return at < 0 ? s.w + s.h : field.dist[at] + 1;
}

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

const NO_WALKS: Walks = { dist: new Int32Array(0), prev: new Int32Array(0) };

let seen = new Int32Array(0);
let queue = new Int32Array(0);
let stamp = 0;

function stepsTo(s: State, ok: Uint8Array, slot: number, cell: number): number {
	const W = s.w + 2;
	const at = walkCell(s, cell);
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

let walkQueue = new Int32Array(0);
let queued = new Int32Array(0);
let queueMark = 0;

function walkScratch(size: number) {
	if (walkQueue.length >= size) return;
	walkQueue = new Int32Array(size);
	queued = new Int32Array(size);
	queueMark = 0;
}

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

// Walks only get shorter as the picture opens; a cell is never queued twice, so the ring holds.
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

export function isDone(e: Colony): boolean {
	return e.n === 0;
}

interface Claims {
	at: Int32Array;
	mark: number;
}

let claimAt = new Int32Array(0);
let claimMark = 0;

// Shared scratch: valid only until the next call.
function claims(s: State): Claims {
	if (claimAt.length < s.alive.length) {
		claimAt = new Int32Array(s.alive.length);
		claimMark = 0;
	}
	const mark = ++claimMark;
	for (const a of s.walking) claimAt[a.cell] = mark;
	return { at: claimAt, mark };
}

function freeSlots(s: State) {
	const slots = s.slots.slice();
	for (let k = 0; k < slots.length; k++) {
		const e = slots[k];
		if (!e || !isDone(e)) continue;
		if (e.link !== undefined && s.slots.some((o) => !!o && o.link === e.link && !isDone(o)))
			continue;
		slots[k] = null;
	}
	s.slots = slots;
}

export function tick(s: State): TickResult {
	return step(s, false);
}

function step(s: State, quick: boolean): TickResult {
	const before = outside(s);
	const wasLocked = s.locks.map((key, k) => key >= 0 && s.alive[key] && hasLock(s, k, before));
	const eaten: TickResult['eaten'] = [];
	const gone: number[] = [];
	// A quick step's board belongs to pick() or hurry() (see own()), so it mutates in place.
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
		e.cool = (e.cool ?? 0) - 1;
		if (e.cool > 0) return;
		const ant = dispatch(s, e, ground, k);
		if (ant) dispatched.push(ant);
		else e.cool = 0;
	});
	freeSlots(s);
	const unlocked = wasLocked.flatMap((was, k) => (was && !hasLock(s, k, ground.out) ? [k] : []));
	return { eaten, unlocked, dispatched, won: isWon(s) };
}

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

function exposedIn(s: State, out: Uint8Array, c: number): number[] {
	return foodOf(s, out)[c] ?? NONE;
}

const NONE: number[] = [];

// Smallest first: bottom rows first, then left to right.
function eatingOrder(w: number, i: number): number {
	return 2 * (i % w) - i;
}

const foodCache = new WeakMap<Uint8Array, number[][]>();

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
			const jx = j % w;
			if (jx === 0 || jx === w - 1 || j < w || j >= w * (h - 1)) continue;
			if (wasOut(j - 1) || wasOut(j + 1) || wasOut(j - w) || wasOut(j + w)) continue;
			(come ??= new Set()).add(j);
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

export function isQuiet(s: State): boolean {
	if (s.walking.length) return false;
	const out = outside(s);
	return s.slots.every((e) => !e || e.n === 0 || exposedIn(s, out, e.c).length === 0);
}

export function isWaiting(s: State, e: Colony, out?: Uint8Array): boolean {
	if (e.n <= 0) return false;
	const { at, mark } = claims(s);
	return exposedIn(s, out ?? outside(s), e.c).every((i) => at[i] === mark);
}

function reachOf(s0: State, c: number): number {
	const s = clone(s0);
	let n = 0;
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

function own(s: State): State {
	s.walking = s.walking.map((a) => ({ ...a }));
	s.slots = s.slots.map((e) => e && { ...e });
	return s;
}

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

function skip(s: State, ticks: number) {
	for (const a of s.walking) a.eta -= ticks;
	for (const e of s.slots) {
		if (!e || e.n <= 0) continue;
		const cool = e.cool ?? 0;
		e.cool = Math.max(1, cool) <= ticks ? 0 : cool - ticks;
	}
}

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

export function hurry(s: State, col: number, ticks: number): boolean {
	const can = canSend(s, col);
	if (!can.ok) return false;
	sendOut(own(s), true, can);
	for (let t = 0; t < ticks && !isQuiet(s); t++) step(s, true);
	return true;
}

export function settle(s: State): void {
	own(s);
	onOwnGround(s, () => settleTicks(s));
}

export function legalPicks(s: State): number[] {
	const out: number[] = [];
	for (let k = 0; k < s.columns.length; k++) if (canSend(s, k).ok) out.push(k);
	return out;
}

export function isStuck(s: State): boolean {
	return !isWon(s) && isQuiet(s) && legalPicks(s).length === 0;
}

export interface Tuning {
	columns: number;
	slots: number;
	waitChance: number;
	chunks: number[];
	sends: number;
	links: number;
	group: number;
	stack: number;
	stackMystery: number;
	behind: number;
	runs: number;
	locks: number;
	mystery: number;
	dispensers: number;
	dispenseColors: number;
	late: number;
}

// Each linked group needs its own mark color (LINK_MARKS in marks.ts).
export const MAX_LINKS = 8;

export const TEACH = 0.05;

export function progress(difficulty = 0): number {
	return Math.min(1, Math.max(0, (difficulty - TEACH) / (1 - TEACH)));
}

export function tuning(level: Level): Tuning {
	const d = level.difficulty ?? 0;
	const t = progress(d);
	const p = Math.min(1.2, t + 0.2 * (level.push ?? 0));
	const teach = d < TEACH && (level.push ?? 0) <= 0;
	return {
		columns: d < 0.02 ? 3 : t < 0.18 ? 4 : 5,
		slots: 5,
		waitChance: teach ? 0.1 + 5 * Math.max(0, d) : Math.min(0.95, 0.3 + 0.65 * p),
		chunks: teach
			? [5, 8, 12, 17, 24, 32]
			: [5, 8, 12, 17, 24, 32, 42, 54].slice(0, 6 + Math.min(2, Math.round(2 * p))),
		sends: Math.round(25 + 15 * t),
		links: d < 0.04 ? 0 : Math.min(MAX_LINKS, 1 + Math.round(9 * p)),
		group: teach || t < 0.09 ? 2 : Math.min(4, 2 + Math.round(2.6 * p)),
		stack: t < 0.25 ? 0 : Math.min(0.45, 0.15 + 0.35 * p),
		stackMystery: t < 0.5 ? 0 : Math.min(0.7, 0.3 + 0.4 * p),
		behind: teach ? 0 : Math.min(1, 0.3 + 0.7 * p),
		runs: teach ? 0 : Math.min(0.95, 0.2 + 0.75 * p),
		locks: d < 0.02 ? 0 : t < 0.04 ? 1 : t < 0.5 ? 2 : 3,
		mystery: d < TEACH ? 0 : Math.min(0.35, 0.1 + 0.3 * t),
		dispensers: t < 0.6 || hashStr(`${level.id}:dispense`) % 100 >= 55 ? 0 : p > 1 ? 2 : 1,
		dispenseColors: Math.min(3, 1 + Math.round(2 * Math.max(0, p - 0.55) * 2)),
		late: 0,
		...level.tuning
	};
}

const depthCache = new WeakMap<Uint8Array, Int32Array>();

export function digDepth(s: State): Int32Array {
	const { w, h, alive } = s;
	const out = outside(s);
	const hit = depthCache.get(out);
	if (hit) return hit;
	const n = w * h;
	const depth = new Int32Array(n).fill(1 << 30);
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

export interface Plan {
	level: Level;
	tune: Tuning;
	base: State;
	order: Colony[];
	groups: Map<number, number>;
	groupAt: number[];
	feeds: number[][];
	openedAt: number[];
	layout: Layout;
	rng: Rng;
}

export interface Layout {
	locks: number[];
	lockAt: number[];
	opensAt: number[];
	mystery: boolean[];
	stackedMystery: boolean[];
}

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

// A dispenser only hands out when its color is eaten, so the play must leave one of that food.
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

export function buildPuzzle(
	level: Level,
	override: Partial<Tuning> = {},
	seed = level.seed ?? 0
): State {
	return buildWithPlan(level, override, seed).s;
}

export function buildWithPlan(
	level: Level,
	override: Partial<Tuning> = {},
	seed = level.seed ?? 0
): { plan: Plan; s: State } {
	const plan = planPlay(level, override, seed);
	if (level.deal) {
		const fixed = dealAs(plan, [...level.deal].map(Number));
		if (fixed && wins(fixed)) return { plan, s: fixed };
	}
	for (let attempt = 0; attempt <= 8; attempt++) {
		const built = dealRandom(plan, attempt < 8);
		if (wins(built)) return { plan, s: built };
	}
	if (seed >= 1e6) throw new Error(`${level.id}: could not build a winnable deal`);
	return buildWithPlan({ ...level, deal: undefined }, override, seed + 1000);
}

// Plays the picture out; dealt in that order, it's always a way to win. Colonies of 1 or 2 ants
// are avoided: one tiny colony that frees a big color makes the level easy.
export function planPlay(
	level: Level,
	override: Partial<Tuning> = {},
	seed = level.seed ?? 0
): Plan {
	const art = parseArt(level);
	const rng = makeRng(hashStr(level.id) + 7919 + seed * 104729);
	const tune = { ...tuning(level), ...override };
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
	const unassigned = art.colors.map(() => 0);
	base.target.forEach((c) => c >= 0 && unassigned[c]++);
	for (const d of dispensers) d.colors.forEach((c, k) => (unassigned[c] += d.amounts[k]));
	let sim = clone(base);
	const order: Colony[] = [];
	const groups = new Map<number, number>();
	const feeds: number[][] = [];
	const openedAt = new Array(art.target.length).fill(Infinity);
	for (const i of foodOf(sim, outside(sim)).flat()) openedAt[i] = 0;
	const food = unassigned.reduce((a, b) => a + b, 0);
	const grow = (mean: number) => Math.max(1, food / (tune.sends * mean));
	const scale = grow(tune.chunks.reduce((a, b) => a + b, 0) / tune.chunks.length);
	tune.chunks = tune.chunks.map((n) => Math.round(n * scale));
	const meanChunk = tune.chunks.reduce((a, b) => a + b, 0) / tune.chunks.length;
	const steps = Math.max(1, unassigned.reduce((a, b) => a + b, 0) / meanChunk);
	let linksLeft = tune.links;

	const tryOut = (colonies: Colony[]) => {
		const t = clone(sim);
		t.columns = colonies.map((e) => [{ ...e }]);
		const r = pick(t, 0);
		return { t, r, ok: r.ok && (isWon(t) || t.slots.includes(null)) };
	};
	const fedBy = (r: PickResult, id: number) =>
		r.ok ? r.meals.map((meal) => meal.id).filter((m) => m < id) : [];
	const roundUp = (c: number, n: number) => (unassigned[c] - n <= 2 ? unassigned[c] : n);
	let fed: number[] = [];

	while (!isWon(sim)) {
		const most = dispenserRoom(sim);
		const colors = unassigned.map((_, c) => c).filter((c) => unassigned[c] > 0 && most[c] >= 1);
		const reachable = new Map(colors.map((c) => [c, reachOf(sim, c)]));
		const reach = (c: number) => reachable.get(c)!;
		const free = sim.slots.filter((e) => !e).length;
		const biggest = Math.max(...tune.chunks);
		const canWait = colors.filter((c) => unassigned[c] > reach(c) && reach(c) < biggest);
		const canEat = colors.filter((c) => reach(c) > 0);
		if (!canEat.length) throw new Error(`${level.id}: no exposed color to send`);
		const roomy = canEat.filter((c) => Math.min(unassigned[c], reach(c)) >= 3);
		const size = () => pickOne(tune.chunks, rng);
		const eater = (id: number, not: number[] = []): Colony => {
			const pool = (roomy.length ? roomy : canEat).filter((c) => !not.includes(c));
			const c = pickWeighted(pool.length ? pool : canEat, reach, rng);
			let n = Math.max(1, Math.min(unassigned[c], size(), reach(c)));
			if (unassigned[c] <= reach(c)) n = roundUp(c, n);
			return { id, c, n: Math.min(n, most[c]) };
		};
		let weights: ((c: number) => number) | undefined;
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
			const more = long ? size() : Math.max(3, Math.round(size() * rng()));
			return { id, c, n: Math.min(most[c], roundUp(c, Math.min(unassigned[c], reach(c) + more))) };
		};

		let sent: Colony[] = [];
		let next: State | undefined;
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
			const wait = free >= 2 && rng() < tune.waitChance ? waiter(order.length) : null;
			const colony = wait ?? eater(order.length);
			let attempt = tryOut([colony]);
			if (!attempt.ok && attempt.r.ok) {
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
			order.push({ id: e.id, c: e.c, n: e.n });
		}
		for (const i of foodOf(sim, outside(sim)).flat()) {
			openedAt[i] = Math.min(openedAt[i], order.length);
		}
	}
	const m = order.length;

	const lockedCols = Math.min(tune.locks, tune.columns - 2);
	const locks = new Array(tune.columns).fill(-1);
	const opensAt: number[] = new Array(tune.columns).fill(0);
	const keysBetween = (from: number, to: number) =>
		base.target
			.map((_, i) => i)
			.filter((i) => base.target[i] >= 0 && openedAt[i] >= m * from && openedAt[i] <= m * to);
	const early = keysBetween(0.2, 0.55);
	const late = tune.late > 0 ? keysBetween(0.5, 0.85) : early;
	const groupsFit = () =>
		[...groups].every(([j, g]) => opensAt.filter((at) => at <= j).length >= g);
	const lockAt = new Array(tune.columns).fill(0);
	for (let k = 0; k < lockedCols; k++) {
		const col = tune.columns - 1 - k;
		const candidates = k > 0 ? late : early;
		if (!candidates.length) break;
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

function dealRandom(plan: Plan, linked: boolean): State {
	const { tune, order, feeds, rng, groupAt, groups } = plan;
	const { lockAt, opensAt } = plan.layout;
	const columns: number[] = new Array(tune.columns).fill(0);
	const placed: number[] = [];
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
		if (together && j > start && open(placed[j - 1], pickedAt) && rng() < tune.stack) {
			columns[placed[j - 1]]++;
			placed.push(placed[j - 1]);
			continue;
		}
		const taken = together ? placed.slice(start, j) : [];
		let allowed = columns.map((_, k) => k).filter((k) => open(k, pickedAt) && !taken.includes(k));
		if (!allowed.length) allowed = columns.map((_, k) => k).filter((k) => open(k, j));
		const shortest = Math.min(...allowed.map((k) => columns[k]));
		let choices = allowed.filter((k) => columns[k] <= shortest + 1);
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
		if (!linkedHere || start === j) intended.push(k);
	}
	const locks = plan.layout.locks.map((key, k) => (columns[k].length <= lockAt[k] ? -1 : key));
	return { ...clone(base), columns, locks, lockAt: lockAt.slice(), intended, moves: 0 };
}

export function placementOf(s: State): number[] {
	const at: number[] = [];
	s.columns.forEach((col, k) => col.forEach((e) => (at[e.id] = k)));
	return at;
}

export function wins(s0: State): boolean {
	const s = clone(s0);
	for (const col of s0.intended ?? []) if (!pick(s, col).ok) return false;
	return isWon(s);
}
