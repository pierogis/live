/*
 * One tap sends a touching group (diagonals count) to its color's nearest open spot, or to
 * the tray when none is open. A move fills what fits, nearest the tap first, and with room
 * to spare pulls in more board dots of that color, never the tray's.
 */

import {
	hashStr,
	makeRng,
	parseArt,
	pickOne,
	pickWeighted,
	shuffle,
	type Art,
	type Color,
	type Rng
} from '../shared/engine.ts';
import type { Picture } from '../shared/level.ts';

export type Level = Picture;

export interface Gem {
	id: number;
	c: number;
}

export interface State {
	w: number;
	h: number;
	target: number[];
	colors: Color[];
	top: (Gem | null)[];
	filled: boolean[];
	tray: Gem[];
	trayCap: number;
	trayBase?: number;
	moves: number;
	minTray?: number;
	attempt?: number;
}

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
	cell?: number;
	from?: number;
	order?: number;
}

export type MoveResult =
	| { ok: false; reason: 'empty' | 'same' | 'filled' | 'covered' | 'color' | 'tray-full' }
	| {
			ok: true;
			toBoard: Required<Flight>[];
			toTray: (Flight & { from: number })[];
			fromTray: (Flight & { cell: number })[];
			left: number;
			leftCell: number;
			leftCells?: number[];
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

function neighbors(w: number, h: number, i: number): number[] {
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

function scramble(art: Art, blobMin: number, blobMax: number, join: number, rng: Rng): number[] {
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
	const touchesColor = (i: number, c: number, self: number) =>
		neighbors(w, h, i).some((j) => colorsAt[j] === c && blobOf[j] !== self);

	const pickColor = (avoid: number) => {
		const others = left.map((_, c) => c).filter((c) => c !== avoid && left[c] > 0);
		return others.length ? pickWeighted(others, (c) => left[c], rng) : avoid;
	};
	const square4 = (i: number) =>
		neighbors(w, h, i).filter((j) => j % w === i % w || Math.floor(j / w) === Math.floor(i / w));

	for (;;) {
		while (next < order.length && colorsAt[order[next]] !== null) next++;
		if (next >= order.length) break;
		const seed = order[next];
		blobId += 1;
		const home = target[seed];
		const beside: number[] = [];
		const apart: number[] = [];
		left.forEach((n, k) => {
			if (n > 0 && k !== home) (touchesColor(seed, k, -1) ? beside : apart).push(k);
		});
		const joins = beside.length > 0 && rng() < join;
		const pool = joins ? beside : apart;
		const c = pool.length ? pickWeighted(pool, (k) => left[k], rng) : pickColor(home);
		const size = Math.min(left[c], blobMin + Math.floor(rng() * (blobMax - blobMin + 1)));
		colorsAt[seed] = c;
		blobOf[seed] = blobId;
		left[c]--;
		let grown = 1;
		const frontier: number[] = [];
		const inFrontier = new Set<number>();
		const addAround = (i: number) => {
			for (const j of square4(i)) {
				if (colorsAt[j] !== null || inFrontier.has(j) || target[j] !== home) continue;
				inFrontier.add(j);
				frontier.push(j);
			}
		};
		addAround(seed);
		while (grown < size && frontier.length) {
			const k = Math.floor(rng() * frontier.length);
			const j = frontier[k];
			frontier[k] = frontier[frontier.length - 1];
			frontier.pop();
			if (colorsAt[j] !== null) continue;
			if (!joins && touchesColor(j, c, blobId)) continue;
			colorsAt[j] = c;
			blobOf[j] = blobId;
			left[c]--;
			grown++;
			addAround(j);
		}
	}

	const out = colorsAt as number[];
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
	cell: number;
	gem: Gem;
}

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

export function colorDone(s: State, color: number): boolean {
	for (let i = 0; i < s.target.length; i++) {
		if (s.target[i] === color && !s.filled[i]) return false;
	}
	return true;
}

export function openCount(s: State, color: number): number {
	let n = 0;
	for (let i = 0; i < s.target.length; i++) {
		if (s.target[i] === color && !s.top[i] && !s.filled[i]) n++;
	}
	return n;
}

export function nearestOpen(s: State, color: number, cell: number): number {
	const x = cell % s.w;
	const y = Math.floor(cell / s.w);
	let best = -1;
	let bestD = Infinity;
	s.target.forEach((c, i) => {
		if (c !== color || s.top[i] || s.filled[i]) return;
		const d = Math.hypot((i % s.w) - x, Math.floor(i / s.w) - y);
		if (d < bestD) [best, bestD] = [i, d];
	});
	return best;
}

export function tapMove(s: State, cell: number): { sel: Sel; dst: Dst } {
	const spot = nearestOpen(s, s.top[cell]!.c, cell);
	return {
		sel: { from: 'board', cell, cells: groupAt(s, cell)!.cells },
		dst: spot >= 0 ? { to: 'spot', cell: spot } : { to: 'tray' }
	};
}

export function dropSpots(s: State, cell: number): number[] {
	const out = openRegion(s, cell);
	if (!out.length) return out;
	const color = s.target[cell];
	const seen = new Set(out);
	const d2 = (i: number) =>
		Math.pow((i % s.w) - (cell % s.w), 2) +
		Math.pow(Math.floor(i / s.w) - Math.floor(cell / s.w), 2);
	const rest: number[] = [];
	for (let i = 0; i < s.target.length; i++) {
		if (s.target[i] === color && !s.top[i] && !s.filled[i] && !seen.has(i)) rest.push(i);
	}
	rest.sort((a, b) => d2(a) - d2(b));
	for (const i of rest) {
		if (seen.has(i)) continue;
		for (const j of openRegion(s, i)) {
			seen.add(j);
			out.push(j);
		}
	}
	return out;
}

function gather(s: State, color: number, held: Held[], want: number, near: number): Held[] {
	const out: Held[] = [];
	const taken = new Set(held.map((d) => d.gem.id));
	const d2 = (i: number) =>
		Math.pow((i % s.w) - (near % s.w), 2) +
		Math.pow(Math.floor(i / s.w) - Math.floor(near / s.w), 2);
	const cells: number[] = [];
	for (let i = 0; i < s.top.length; i++) {
		const q = s.top[i];
		if (q && q.c === color && !taken.has(q.id)) cells.push(i);
	}
	cells.sort((a, b) => d2(a) - d2(b));
	for (const i of cells) {
		if (taken.has(s.top[i]!.id)) continue;
		for (const j of outward(s, groupAt(s, i)!.cells, i)) {
			if (out.length >= want) return out;
			taken.add(s.top[j]!.id);
			out.push({ cell: j, gem: s.top[j]! });
		}
	}
	return out;
}

export function parkCount(s: State, sel: Sel | null): number {
	const dots = selectionDots(s, sel);
	if (!dots || sel?.from !== 'board') return 0;
	const free = Math.max(0, s.trayCap - s.tray.length);
	if (free <= dots.length) return free;
	let all = 0;
	for (const q of s.top) if (q?.c === dots[0].gem.c) all++;
	return Math.min(free, all);
}

export function dropCount(s: State, sel: Sel, cell: number): number {
	const dots = selectionDots(s, sel);
	if (!dots) return 0;
	const spots = dropSpots(s, cell).length;
	if (spots <= dots.length) return spots;
	const color = dots[0].gem.c;
	const taken = new Set(dots.map((d) => d.gem.id));
	let all = dots.length;
	for (const q of s.top) if (q?.c === color && !taken.has(q.id)) all++;
	return Math.min(spots, all);
}

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
	const far = cells.filter((i) => !seen.has(i));
	const d2 = (i: number) =>
		Math.pow((i % s.w) - (center % s.w), 2) +
		Math.pow(Math.floor(i / s.w) - Math.floor(center / s.w), 2);
	far.sort((a, b) => d2(a) - d2(b));
	return queue.concat(far);
}

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

export function move(s: State, sel: Sel, dst: Dst): MoveResult {
	let dots = selectionDots(s, sel);
	if (!dots) return { ok: false, reason: 'empty' };
	const color = dots[0].gem.c;
	const size = dots.length;
	const toBoard: Required<Flight>[] = [];
	const toTray: (Flight & { from: number })[] = [];
	const fromTray: (Flight & { cell: number })[] = [];

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
		if (free <= 0) return { ok: false, reason: 'tray-full' };
		if (free > size) dots = dots.concat(gather(s, color, dots, free - size, sel.cell));
		n = Math.min(free, dots.length);
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
		const spots = dropSpots(s, cell);
		if (spots.length > size) {
			const near = sel.from === 'board' ? sel.cell : cell;
			dots = dots.concat(gather(s, color, dots, spots.length - size, near));
		}
		n = Math.min(spots.length, dots.length);
		for (let k = 0; k < n; k++) {
			const d = dots[k];
			s.filled[spots[k]] = true;
			if (d.cell >= 0) {
				s.top[d.cell] = null;
				toBoard.push({ id: d.gem.id, c: d.gem.c, cell: spots[k], from: d.cell, order: k });
			} else {
				s.tray.splice(s.tray.indexOf(d.gem), 1);
				fromTray.push({ id: d.gem.id, c: d.gem.c, cell: spots[k], order: k });
			}
		}
	}
	const left = Math.max(0, size - n);
	let leftCell = -1;
	let leftCells: number[] | undefined;
	if (left && sel.from === 'board') {
		leftCell = dots[n].cell;
		leftCells = dots.slice(n).map((d) => d.cell);
	}
	s.moves++;
	return { ok: true, toBoard, toTray, fromTray, left, leftCell, leftCells };
}

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

function floodAll(
	w: number,
	h: number,
	n: number,
	inSet: (i: number) => boolean,
	same: (i: number, j: number) => boolean
): number[][] {
	const seen = new Uint8Array(n);
	const out: number[][] = [];
	const stack: number[] = [];
	for (let i = 0; i < n; i++) {
		if (seen[i] || !inSet(i)) continue;
		seen[i] = 1;
		const cells = [i];
		stack.push(i);
		while (stack.length) {
			const k = stack.pop()!;
			const x = k % w;
			const y = (k - x) / w;
			for (let dy = -1; dy <= 1; dy++) {
				const ny = y + dy;
				if (ny < 0 || ny >= h) continue;
				for (let dx = -1; dx <= 1; dx++) {
					const nx = x + dx;
					if ((!dx && !dy) || nx < 0 || nx >= w) continue;
					const j = ny * w + nx;
					if (seen[j] || !inSet(j) || !same(i, j)) continue;
					seen[j] = 1;
					cells.push(j);
					stack.push(j);
				}
			}
		}
		out.push(cells);
	}
	return out;
}

export function boardGroups(s: State): Group[] {
	const top = s.top;
	return floodAll(
		s.w,
		s.h,
		top.length,
		(i) => !!top[i],
		(i, j) => top[i]!.c === top[j]!.c
	).map((cells) => ({ color: top[cells[0]]!.c, cells, gems: cells.map((i) => top[i]!) }));
}

function openRegions(s: State): { cell: number; color: number; size: number }[] {
	const { target, top, filled } = s;
	return floodAll(
		s.w,
		s.h,
		target.length,
		(i) => target[i] >= 0 && !top[i] && !filled[i],
		(i, j) => target[i] === target[j]
	).map((cells) => ({ cell: cells[0], color: target[cells[0]], size: cells.length }));
}

export function actions(s: State): Action[] {
	const out: Action[] = [];
	const regions = openRegions(s);
	const inTray = trayCounts(s);
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
	const groupsOf = byColor(s, groups);
	const places: Action[] = [];
	for (const r of regions) {
		for (const g of groupsOf[r.color]) {
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
	const parks = parkings(s, groups, inTray);
	parks.sort((x, y) => y.score! - x.score!);
	out.push(...parks);
	return out;
}

/** Must match `actions(s)[0]`. */
export function bestAction(s: State): Action | null {
	const regions = openRegions(s);
	const inTray = trayCounts(s);
	for (const r of regions) {
		if (inTray[r.color]) {
			return {
				sel: { from: 'tray', color: r.color },
				dst: { to: 'spot', cell: r.cell },
				kind: 'place',
				gain: Math.min(r.size, inTray[r.color])
			};
		}
	}
	const groups = boardGroups(s);
	const groupsOf = byColor(s, groups);
	let best: Action | null = null;
	for (const r of regions) {
		for (const g of groupsOf[r.color]) {
			const gain = Math.min(g.cells.length, r.size);
			if (best && gain <= best.gain!) continue;
			best = {
				sel: { from: 'board', cell: g.cells[0] },
				dst: { to: 'spot', cell: r.cell },
				kind: 'place',
				gain
			};
		}
	}
	if (best) return best;
	for (const a of parkings(s, groups, inTray)) if (!best || a.score! > best.score!) best = a;
	return best;
}

function trayCounts(s: State): number[] {
	const inTray: number[] = new Array(s.colors.length).fill(0);
	s.tray.forEach((q) => inTray[q.c]++);
	return inTray;
}

function byColor(s: State, groups: Group[]): Group[][] {
	const out: Group[][] = s.colors.map(() => []);
	for (const g of groups) out[g.color].push(g);
	return out;
}

function parkings(s: State, groups: Group[], inTray: number[]): Action[] {
	const free = s.trayCap - s.tray.length;
	const open: number[] = new Array(s.colors.length).fill(0);
	s.target.forEach((c, i) => {
		if (c >= 0 && !s.top[i] && !s.filled[i]) open[c]++;
	});
	const sizes: number[][] = s.colors.map(() => []);
	groups.forEach((g) => sizes[g.color].push(g.cells.length));
	sizes.forEach((xs) => xs.sort((x, y) => x - y));
	const parks: Action[] = [];
	const o = open.slice();
	for (const g of groups) {
		if (free <= 0) break;
		const size = Math.min(free, g.cells.length);
		for (let c = 0; c < o.length; c++) o[c] = open[c];
		for (const i of g.cells) o[s.target[i]]++;
		let placeable = 0;
		for (let c = 0; c < o.length; c++) {
			const fromTray = Math.min(o[c], inTray[c] + (c === g.color ? size : 0));
			let room = o[c] - fromTray;
			placeable += fromTray;
			let skipped = false;
			for (const n of sizes[c]) {
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
	return parks;
}

export function solve(s0: State, tries = 1, seed = 1, cap?: number): Solution | null {
	const rng = makeRng(seed || 1);
	const limit = s0.target.length * 6;
	for (let t = 0; t < tries; t++) {
		const s = clone(s0);
		if (cap !== undefined) s.trayCap = cap;
		const path: Action[] = [];
		let peak = s.tray.length;
		while (!isWon(s) && path.length < limit) {
			let a = bestAction(s);
			if (!a) break;
			if (t > 0 && rng() < 0.35) {
				const acts = actions(s);
				const parks = acts.filter((x) => x.kind === 'park');
				const pool =
					acts[0].kind === 'place' || !parks.length ? acts.slice(0, 3) : parks.slice(0, 4);
				a = pickOne(pool, rng);
			}
			if (!move(s, a.sel, a.dst).ok) break;
			path.push(a);
			peak = Math.max(peak, s.tray.length);
		}
		if (isWon(s)) return { path, peak };
	}
	return null;
}

const DOTS_PER_SLOT = 14;
const TRAY_SQUEEZE = 0.15;

const depth = (difficulty = 0) => Math.min(1, Math.max(0, difficulty));

export function trayFor(dots: number, difficulty: number): number {
	return Math.max(8, Math.round((dots / DOTS_PER_SLOT) * (1 - TRAY_SQUEEZE * depth(difficulty))));
}

export function relax(s: State): State {
	s.trayCap = Math.max(s.trayCap, 2 * (s.trayBase ?? s.trayCap));
	return s;
}

export interface BuildOptions {
	relaxed?: boolean;
}

export interface Built {
	state: State;
	solution: Solution;
}

export function blobSizes(difficulty: number): { min: number; max: number } {
	const t = depth(difficulty);
	return { min: Math.round(10 + 6 * t), max: Math.round(28 + 20 * t) };
}

export function joinFor(difficulty: number): number {
	return 1 - depth(difficulty);
}

export function buildPuzzle(level: Level, index: number, opts: BuildOptions = {}): State {
	const { state } = buildSolved(level);
	if (opts.relaxed) relax(state);
	return state;
}

/** The solution replays only with the tray it was found with: drops gather by tray room. */
export function buildSolved(level: Level): Built {
	const art = parseArt(level);
	const base = hashStr(level.id);
	const { min: blobMin, max: blobMax } = blobSizes(level.difficulty ?? 0);
	const tray = trayFor(art.target.filter((c) => c >= 0).length, level.difficulty ?? 0);

	const make = (attempt: number): State => {
		const join = joinFor(level.difficulty ?? 0);
		const colorsAt = scramble(art, blobMin, blobMax, join, makeRng(base + attempt * 7919));
		let id = 0;
		return {
			w: art.w,
			h: art.h,
			target: art.target,
			colors: art.colors,
			top: colorsAt.map((c) => (c < 0 ? null : { id: id++, c })),
			filled: art.target.map(() => false),
			tray: [],
			trayCap: tray,
			trayBase: tray,
			moves: 0
		};
	};

	for (let attempt = 0; attempt < 8; attempt++) {
		const s = make(attempt);
		const sol = solve(s, 2, attempt + 1);
		if (sol) {
			s.minTray = sol.peak;
			s.attempt = attempt;
			return { state: s, solution: sol };
		}
	}
	const s = make(0);
	const sol = solve(s, 1, 1, Infinity)!;
	s.minTray = sol.peak;
	s.trayCap = sol.peak + 2;
	s.attempt = -1;
	return { state: s, solution: sol };
}

export interface TapGrid {
	w: number;
	h: number;
	cell: number;
	step: number;
	reach: number;
}

function nearestTap(
	g: TapGrid,
	x: number,
	y: number,
	ok: (i: number) => boolean
): { cell: number; d: number } | null {
	const col = Math.floor(x / g.step);
	const row = Math.floor(y / g.step);
	const k = Math.ceil(g.reach / g.step) + 1;
	let best = -1;
	let bestD = Infinity;
	for (let cy = Math.max(0, row - k); cy <= Math.min(g.h - 1, row + k); cy++) {
		for (let cx = Math.max(0, col - k); cx <= Math.min(g.w - 1, col + k); cx++) {
			const i = cy * g.w + cx;
			if (!ok(i)) continue;
			const d = Math.hypot(cx * g.step + g.cell / 2 - x, cy * g.step + g.cell / 2 - y);
			if (d <= g.reach && d < bestD) {
				bestD = d;
				best = i;
			}
		}
	}
	return best < 0 ? null : { cell: best, d: bestD };
}

export function tapCell(
	g: TapGrid,
	x: number,
	y: number,
	isDot: (i: number) => boolean,
	isDrop: ((i: number) => boolean) | null,
	size?: (i: number) => number,
	near = 0
): number {
	const col = Math.floor(x / g.step);
	const row = Math.floor(y / g.step);
	const inside = x - col * g.step < g.cell && y - row * g.step < g.cell;
	const hit = inside && col >= 0 && row >= 0 && col < g.w && row < g.h ? row * g.w + col : -1;
	if (hit >= 0 && isDrop?.(hit)) return hit;
	if (hit >= 0 && isDot(hit)) {
		if (!size || near <= 0) return hit;
		let best = hit;
		let bestSize = size(hit);
		let bestD = Math.hypot(col * g.step + g.cell / 2 - x, row * g.step + g.cell / 2 - y);
		const k = Math.ceil(near / g.step) + 1;
		for (let cy = Math.max(0, row - k); cy <= Math.min(g.h - 1, row + k); cy++) {
			for (let cx = Math.max(0, col - k); cx <= Math.min(g.w - 1, col + k); cx++) {
				const i = cy * g.w + cx;
				if (!isDot(i)) continue;
				const d = Math.hypot(cx * g.step + g.cell / 2 - x, cy * g.step + g.cell / 2 - y);
				if (d > near) continue;
				const n = size(i);
				if (n > bestSize || (n === bestSize && d < bestD)) {
					best = i;
					bestSize = n;
					bestD = d;
				}
			}
		}
		return best;
	}
	const dot = nearestTap(g, x, y, isDot);
	const drop = isDrop && nearestTap(g, x, y, isDrop);
	if (drop && (!dot || drop.d * 0.65 <= dot.d)) return drop.cell;
	return dot ? dot.cell : -1;
}
