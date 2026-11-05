/*
 * Mosaic game engine: pure logic, no DOM, no imports.
 * Runs in the browser, in node scripts and in node tests.
 *
 * The picture has two layers:
 *   - the bottom layer is the finished picture (target[i] = color the spot needs)
 *   - the top layer covers every spot with a dot (top[i]); the dots are the same
 *     colors as the picture, shuffled around
 *
 * A move is two taps: pick up a touching group of same-color dots (or all tray
 * dots of one color), then pick where they go: the tray, or an open spot of
 * their color. Lifting dots uncovers the spots under them. As many dots move
 * as there is room for, closest to the dot you picked up first, into the open
 * spots closest to the one you tapped. Diagonal spots count as touching.
 */

import {
	hashStr,
	makeRng,
	parseArt,
	shuffle,
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
}

export interface Gem {
	id: number;
	c: number;
}

export interface State {
	w: number;
	h: number;
	/** Color index each spot needs; -1 is an empty pixel, not part of the picture. */
	target: number[];
	colors: Color[];
	/** The dot covering each spot, or null once uncovered. */
	top: (Gem | null)[];
	/** Whether each spot has its matching dot. */
	filled: boolean[];
	tray: Gem[];
	trayCap: number;
	moves: number;
	/** The most tray the solver's path needed. */
	minTray?: number;
	/** Which shuffle was kept; -1 when the tray had to grow. */
	attempt?: number;
}

/**
 * What the player is holding.
 *   { from: 'board', cell }          the touching group around `cell`
 *   { from: 'board', cell, cells }   exactly these dots ("in hand"), even if they no longer touch
 *   { from: 'tray', color }          every tray dot of that color
 */
export type Sel =
	{ from: 'board'; cell: number; cells?: number[] } | { from: 'tray'; color: number };

export type Dst = { to: 'tray' } | { to: 'spot'; cell: number };

export interface Action {
	sel: Sel;
	dst: Dst;
	kind: 'place' | 'park';
	gain?: number;
	score?: number;
}

export interface Flight {
	id: number;
	c: number;
	/** Board spot the dot lands on. */
	cell?: number;
	/** Board spot the dot left. */
	from?: number;
}

export type MoveResult =
	| { ok: false; reason: 'empty' | 'same' | 'filled' | 'covered' | 'color' }
	| { ok: false; reason: 'tray-full'; size: number; free: number }
	| {
			ok: true;
			color: number;
			toBoard: Required<Flight>[];
			toTray: (Flight & { from: number })[];
			fromTray: (Flight & { cell: number })[];
			/** How many dots didn't fit and stayed where they were. */
			left: number;
			/** The leftover board dot closest to the one picked up, or -1. */
			leftCell: number;
			leftCells?: number[];
			won: boolean;
	  };

export interface Group {
	color: number;
	cells: number[];
	gems: Gem[];
}

export interface Solution {
	path: Action[];
	peak: number;
}

/** mulberry32: small, fast, seeded. */

/** The 8 spots around `i`, corners included: diagonal spots count as touching. */
export function neighbors(w: number, h: number, i: number): number[] {
	const x = i % w;
	const y = Math.floor(i / w);
	const out: number[] = [];
	for (let dy = -1; dy <= 1; dy++) {
		for (let dx = -1; dx <= 1; dx++) {
			if (!dx && !dy) continue;
			const nx = x + dx;
			const ny = y + dy;
			if (nx >= 0 && nx < w && ny >= 0 && ny < h) out.push(ny * w + nx);
		}
	}
	return out;
}

/**
 * Build the top layer as random blobs of color:
 *   1. grow blobs of `blobMin`..`blobMax` dots from random seed spots. Each blob is a
 *      color that still has dots left, and stays inside the area of same-colored
 *      spots it started in, so lifting it opens one clean patch of a single color
 *   2. swap dots so as few as possible sit on a spot of their own color
 * Every color ends up with exactly as many dots as the picture has spots for it.
 * Returns the dot color for each spot (-1 for empty pixels).
 */
export function scramble(art: Art, blobMin: number, blobMax: number, rng: Rng): number[] {
	const { w, h, target } = art;
	const cells: number[] = [];
	target.forEach((c, i) => {
		if (c >= 0) cells.push(i);
	});
	const left = art.colors.map(() => 0);
	cells.forEach((i) => left[target[i]]++);
	const colorsAt: (number | null)[] = target.map((c) => (c < 0 ? -1 : null));
	const order = shuffle(cells.slice(), rng);
	let next = 0;
	const blobOf = new Int32Array(target.length);
	let blobId = 0;
	/** Does spot i touch (corners count) a dot of color c from a blob other than `self`? */
	const touchesColor = (i: number, c: number, self: number) =>
		neighbors(w, h, i).some((j) => colorsAt[j] === c && blobOf[j] !== self);

	const pickColor = (avoid: number) => {
		let total = 0;
		left.forEach((n, c) => {
			if (c !== avoid) total += n;
		});
		if (!total) return avoid;
		let r = rng() * total;
		for (let c = 0; c < left.length; c++) {
			if (c === avoid) continue;
			r -= left[c];
			if (r < 0) return c;
		}
		return avoid;
	};
	const square4 = (i: number) =>
		neighbors(w, h, i).filter((j) => j % w === i % w || Math.floor(j / w) === Math.floor(i / w));

	for (;;) {
		while (next < order.length && colorsAt[order[next]] !== null) next++;
		if (next >= order.length) break;
		const seed = order[next];
		blobId += 1;
		// Pick a color for the new blob: not the color its spots need, and not a color
		// already touching it, so blobs don't merge across areas. Weighted by dots left.
		const safe: number[] = [];
		left.forEach((n, k) => {
			if (n > 0 && k !== target[seed] && !touchesColor(seed, k, -1)) safe.push(k);
		});
		let c: number;
		if (safe.length) {
			let r = rng() * safe.reduce((sum, k) => sum + left[k], 0);
			c = safe[safe.length - 1];
			for (const k of safe) {
				r -= left[k];
				if (r < 0) {
					c = k;
					break;
				}
			}
		} else {
			c = pickColor(target[seed]);
		}
		const size = Math.min(left[c], blobMin + Math.floor(rng() * (blobMax - blobMin + 1)));
		colorsAt[seed] = c;
		blobOf[seed] = blobId;
		left[c]--;
		let grown = 1;
		const frontier: number[] = [];
		const inFrontier = new Set<number>();
		const home = target[seed];
		const addAround = (i: number) => {
			for (const j of square4(i)) {
				// Only grow over spots that need the same color as the seed spot.
				if (colorsAt[j] === null && target[j] === home && !inFrontier.has(j)) {
					inFrontier.add(j);
					frontier.push(j);
				}
			}
		};
		addAround(seed);
		while (grown < size && frontier.length) {
			const k = Math.floor(rng() * frontier.length);
			const j = frontier[k];
			frontier[k] = frontier[frontier.length - 1];
			frontier.pop();
			if (colorsAt[j] !== null) continue;
			// Don't grow into a spot touching another blob of the same color.
			if (touchesColor(j, c, blobId)) continue;
			colorsAt[j] = c;
			blobOf[j] = blobId;
			left[c]--;
			grown++;
			addAround(j);
		}
	}

	const out = colorsAt as number[];
	// Fix dots that sit on their own color, when a swap fixes it without breaking another.
	// Swap with a nearby dot first so the blobs keep their shape.
	for (let pass = 0; pass < 3; pass++) {
		for (const a of shuffle(cells.slice(), rng)) {
			if (out[a] !== target[a]) continue;
			let best = -1;
			let bestD = Infinity;
			for (const b of cells) {
				if (out[b] === target[a] || out[a] === target[b]) continue;
				const d = Math.abs((a % w) - (b % w)) + Math.abs(Math.floor(a / w) - Math.floor(b / w));
				if (d < bestD) {
					bestD = d;
					best = b;
				}
			}
			if (best >= 0) {
				const t = out[a];
				out[a] = out[best];
				out[best] = t;
			}
		}
	}
	return out;
}

export function clone(s: State): State {
	return { ...s, top: s.top.slice(), filled: s.filled.slice(), tray: s.tray.slice() };
}

export function isWon(s: State): boolean {
	for (let i = 0; i < s.target.length; i++) {
		if (s.target[i] >= 0 && !s.filled[i]) return false;
	}
	return true;
}

/** The touching same-color dots that include spot `cell`. */
export function groupAt(s: State, cell: number): Group | null {
	const start = s.top[cell];
	if (!start) return null;
	const color = start.c;
	const seen = new Set([cell]);
	const todo = [cell];
	const cells: number[] = [];
	while (todo.length) {
		const i = todo.pop()!;
		cells.push(i);
		for (const j of neighbors(s.w, s.h, i)) {
			const q = s.top[j];
			if (seen.has(j) || !q || q.c !== color) continue;
			seen.add(j);
			todo.push(j);
		}
	}
	return { color, cells, gems: cells.map((i) => s.top[i]!) };
}

/** Uncovered spots of the same color touching `cell`, nearest first. */
export function openRegion(s: State, cell: number): number[] {
	const color = s.target[cell];
	const isOpen = (i: number) => s.target[i] === color && !s.top[i] && !s.filled[i];
	if (color < 0 || !isOpen(cell)) return [];
	const seen = new Set([cell]);
	const queue = [cell];
	for (let k = 0; k < queue.length; k++) {
		for (const j of neighbors(s.w, s.h, queue[k])) {
			if (seen.has(j) || !isOpen(j)) continue;
			seen.add(j);
			queue.push(j);
		}
	}
	return queue;
}

export interface Held {
	/** Board spot, or -1 for a tray dot. */
	cell: number;
	gem: Gem;
}

/** The dots a selection refers to, or null when it no longer points at any. */
export function selectionDots(s: State, sel: Sel | null): Held[] | null {
	if (!sel) return null;
	if (sel.from === 'board') {
		if (sel.cells) {
			const color = s.top[sel.cell]?.c ?? -1;
			const dots = sel.cells
				.filter((i) => s.top[i]?.c === color)
				.map((cell) => ({ cell, gem: s.top[cell]! }));
			return dots.length ? dots : null;
		}
		const g = groupAt(s, sel.cell);
		return g ? g.cells.map((cell) => ({ cell, gem: s.top[cell]! })) : null;
	}
	const dots = s.tray.filter((q) => q.c === sel.color).map((gem) => ({ cell: -1, gem }));
	return dots.length ? dots : null;
}

export function openCount(s: State, color: number): number {
	let n = 0;
	for (let i = 0; i < s.target.length; i++) {
		if (s.target[i] === color && !s.top[i] && !s.filled[i]) n++;
	}
	return n;
}

/** Cells of a group ordered by how close they are (along the group) to `center`. */
function outward(s: State, cells: number[], center: number): number[] {
	const inGroup = new Set(cells);
	const seen = new Set([center]);
	const queue = [center];
	for (let k = 0; k < queue.length; k++) {
		for (const j of neighbors(s.w, s.h, queue[k])) {
			if (inGroup.has(j) && !seen.has(j)) {
				seen.add(j);
				queue.push(j);
			}
		}
	}
	// Pieces that no longer touch the center (after a split) come last, nearest first.
	const far = cells.filter((i) => !seen.has(i));
	const d2 = (i: number) =>
		Math.pow((i % s.w) - (center % s.w), 2) +
		Math.pow(Math.floor(i / s.w) - Math.floor(center / s.w), 2);
	far.sort((a, b) => d2(a) - d2(b));
	return queue.concat(far);
}

/** Put a dot in the tray next to the others of its color, so the tray stays grouped. */
function trayInsert(s: State, gem: Gem) {
	let at = -1;
	for (let k = s.tray.length - 1; k >= 0; k--) {
		if (s.tray[k].c === gem.c) {
			at = k;
			break;
		}
	}
	if (at < 0) s.tray.push(gem);
	else s.tray.splice(at + 1, 0, gem);
}

/**
 * Move selected dots to a destination. Mutates s on success.
 * Fills as much as it can, centered on what you tapped:
 *   - the dots that move are the ones closest to the dot you picked up
 *   - the spots they fill are the ones closest to the spot you tapped,
 *     within its touching group of open spots of that color
 * Dots that don't fit stay where they were.
 */
export function move(s: State, sel: Sel, dst: Dst): MoveResult {
	let dots = selectionDots(s, sel);
	if (!dots) return { ok: false, reason: 'empty' };
	const color = dots[0].gem.c;
	const size = dots.length;
	const toBoard: Required<Flight>[] = [];
	const toTray: (Flight & { from: number })[] = [];
	const fromTray: (Flight & { cell: number })[] = [];

	// Board dots leave starting from the one you picked up.
	if (sel.from === 'board') {
		const byCell = new Map(dots.map((d) => [d.cell, d]));
		dots = outward(
			s,
			dots.map((d) => d.cell),
			sel.cell
		).map((cell) => byCell.get(cell)!);
	}

	let n: number;
	if (dst.to === 'tray') {
		if (sel.from === 'tray') return { ok: false, reason: 'same' };
		const free = s.trayCap - s.tray.length;
		if (free <= 0) return { ok: false, reason: 'tray-full', size, free };
		n = Math.min(free, size);
		for (let k = 0; k < n; k++) {
			const d = dots[k];
			s.top[d.cell] = null;
			trayInsert(s, d.gem);
			toTray.push({ id: d.gem.id, c: d.gem.c, from: d.cell });
		}
	} else {
		const cell = dst.cell;
		if (s.target[cell] < 0 || s.filled[cell]) return { ok: false, reason: 'filled' };
		if (s.top[cell]) return { ok: false, reason: 'covered' };
		if (s.target[cell] !== color) return { ok: false, reason: 'color' };
		const spots = openRegion(s, cell);
		n = Math.min(spots.length, size);
		for (let k = 0; k < n; k++) {
			const d = dots[k];
			s.filled[spots[k]] = true;
			if (sel.from === 'board') {
				s.top[d.cell] = null;
				toBoard.push({ id: d.gem.id, c: d.gem.c, cell: spots[k], from: d.cell });
			} else {
				s.tray.splice(s.tray.indexOf(d.gem), 1);
				fromTray.push({ id: d.gem.id, c: d.gem.c, cell: spots[k] });
			}
		}
	}
	const left = size - n;
	let leftCell = -1;
	let leftCells: number[] | undefined;
	if (left && sel.from === 'board') {
		leftCell = dots[n].cell;
		leftCells = dots.slice(n).map((d) => d.cell);
	}
	s.moves++;
	return { ok: true, color, toBoard, toTray, fromTray, left, leftCell, leftCells, won: isWon(s) };
}

/** True when the tray is full and no dot has an open spot of its color. */
export function isStuck(s: State): boolean {
	if (isWon(s)) return false;
	if (s.tray.length < s.trayCap && s.top.some(Boolean)) return false;
	const available = new Set(s.tray.map((q) => q.c));
	s.top.forEach((q) => q && available.add(q.c));
	for (let i = 0; i < s.target.length; i++) {
		if (s.target[i] >= 0 && !s.top[i] && !s.filled[i] && available.has(s.target[i])) return false;
	}
	return true;
}

/** Distinct board groups. */
export function boardGroups(s: State): Group[] {
	const seen = new Set<number>();
	const out: Group[] = [];
	for (let i = 0; i < s.top.length; i++) {
		if (!s.top[i] || seen.has(i)) continue;
		const g = groupAt(s, i)!;
		g.cells.forEach((j) => seen.add(j));
		out.push(g);
	}
	return out;
}

/** Distinct open regions. */
function openRegions(s: State): { cell: number; color: number; size: number }[] {
	const seen = new Set<number>();
	const out: { cell: number; color: number; size: number }[] = [];
	for (let i = 0; i < s.target.length; i++) {
		if (seen.has(i) || s.target[i] < 0 || s.top[i] || s.filled[i]) continue;
		const r = openRegion(s, i);
		r.forEach((j) => seen.add(j));
		out.push({ cell: i, color: s.target[i], size: r.length });
	}
	return out;
}

/**
 * Candidate legal actions in a sensible order:
 * place tray dots, then place board groups, then park a group in the tray.
 */
export function actions(s: State): Action[] {
	const out: Action[] = [];
	const regions = openRegions(s);
	const inTray: number[] = new Array(s.colors.length).fill(0);
	s.tray.forEach((q) => inTray[q.c]++);
	for (const r of regions) {
		if (inTray[r.color]) {
			out.push({
				sel: { from: 'tray', color: r.color },
				dst: { to: 'spot', cell: r.cell },
				kind: 'place',
				gain: Math.min(r.size, inTray[r.color])
			});
		}
	}
	const groups = boardGroups(s);
	const places: Action[] = [];
	for (const r of regions) {
		for (const g of groups) {
			if (g.color !== r.color) continue;
			places.push({
				sel: { from: 'board', cell: g.cells[0] },
				dst: { to: 'spot', cell: r.cell },
				kind: 'place',
				gain: Math.min(g.cells.length, r.size)
			});
		}
	}
	places.sort((x, y) => y.gain! - x.gain!);
	out.push(...places);

	// Parking: score each group by how many dots could be placed right after it lifts.
	const free = s.trayCap - s.tray.length;
	const open: number[] = new Array(s.colors.length).fill(0);
	s.target.forEach((c, i) => {
		if (c >= 0 && !s.top[i] && !s.filled[i]) open[c]++;
	});
	const byColor: number[][] = s.colors.map(() => []);
	groups.forEach((g) => byColor[g.color].push(g.cells.length));
	byColor.forEach((sizes) => sizes.sort((x, y) => x - y));
	const parks: Action[] = [];
	for (const g of groups) {
		if (free <= 0) break;
		const size = Math.min(free, g.cells.length);
		const o = open.slice();
		g.cells.forEach((i) => o[s.target[i]]++);
		let placeable = 0;
		for (let c = 0; c < o.length; c++) {
			const fromTray = Math.min(o[c], inTray[c] + (c === g.color ? size : 0));
			let room = o[c] - fromTray;
			placeable += fromTray;
			let skipped = false;
			for (const n of byColor[c]) {
				if (c === g.color && n === size && !skipped) {
					skipped = true;
					continue;
				}
				if (n > room) break;
				room -= n;
				placeable += n;
			}
		}
		parks.push({
			sel: { from: 'board', cell: g.cells[0] },
			dst: { to: 'tray' },
			kind: 'park',
			score: placeable - size * 1.2
		});
	}
	parks.sort((x, y) => y.score! - x.score!);
	out.push(...parks);
	return out;
}

/**
 * Greedy play, then randomized greedy. Returns the path and the most tray it
 * used, or null. `cap` overrides the tray size (Infinity measures how much tray
 * a path needs).
 */
export function solve(s0: State, tries = 1, seed = 1, cap?: number): Solution | null {
	const rng = makeRng(seed || 1);
	const limit = s0.target.length * 6;
	for (let t = 0; t < tries; t++) {
		const s = clone(s0);
		if (cap !== undefined) s.trayCap = cap;
		const path: Action[] = [];
		let peak = s.tray.length;
		while (!isWon(s) && path.length < limit) {
			const acts = actions(s);
			if (!acts.length) break;
			let a = acts[0];
			if (t > 0 && rng() < 0.35) {
				const parks = acts.filter((x) => x.kind === 'park');
				const pool =
					acts[0].kind === 'place' || !parks.length ? acts.slice(0, 3) : parks.slice(0, 4);
				a = pool[Math.floor(rng() * pool.length)];
			}
			if (!move(s, a.sel, a.dst).ok) break;
			path.push(a);
			peak = Math.max(peak, s.tray.length);
		}
		if (isWon(s)) return { path, peak };
	}
	return null;
}

export const TRAY = 20;

export interface BuildOptions {
	/** A much bigger tray. */
	relaxed?: boolean;
}

/**
 * Same level id and index always give the same puzzle.
 * Tries a few shuffles and keeps the first one the solver can finish with the
 * standard tray, so every level is solvable.
 */
export function buildPuzzle(level: Level, index: number, opts: BuildOptions = {}): State {
	const art = parseArt(level);
	const base = hashStr(level.id);
	// Blobs grow with the level: early pictures have medium blobs, later ones big ones.
	const blobMin = Math.min(16, 6 + index);
	const blobMax = Math.min(48, 16 + index * 3);

	const make = (attempt: number): State => {
		const colorsAt = scramble(art, blobMin, blobMax, makeRng(base + attempt * 7919));
		let id = 0;
		return {
			w: art.w,
			h: art.h,
			target: art.target,
			colors: art.colors,
			top: colorsAt.map((c) => (c < 0 ? null : { id: id++, c })),
			filled: art.target.map(() => false),
			tray: [],
			trayCap: TRAY,
			moves: 0
		};
	};

	let best: State | null = null;
	for (let attempt = 0; attempt < 8; attempt++) {
		const s = make(attempt);
		const sol = solve(s, 2, attempt + 1, TRAY);
		if (sol) {
			s.minTray = sol.peak;
			s.attempt = attempt;
			best = s;
			break;
		}
	}
	// Fallback (not expected): grow the tray to whatever the first shuffle needs.
	if (!best) {
		best = make(0);
		const sol = solve(best, 1, 1, Infinity)!;
		best.minTray = sol.peak;
		best.trayCap = sol.peak + 2;
		best.attempt = -1;
	}
	if (opts.relaxed) best.trayCap = Math.max(best.trayCap, 40);
	return best;
}
