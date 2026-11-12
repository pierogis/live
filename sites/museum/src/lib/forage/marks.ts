// Markers are only rings and thin rails, never fills, so none can pass for food.
// Lock and link colors come from separate sets, so a group never matches a lock.
import type { State } from './engine';

export const LOCK_MARKS = ['#e0a400', '#2b9be0', '#d4479c'];

const LINK_MARKS = [
	'#8466cc',
	'#4f9d5a',
	'#e0694a',
	'#23a08c',
	'#a0703f',
	'#8a9a2a',
	'#5c6b7a',
	'#b8566e'
];

export function linkColors(deal: State): Map<number, string> {
	const span = new Map<number, { lo: number; hi: number }>();
	deal.columns.forEach((col) =>
		col.forEach((e, depth) => {
			const g = e.link;
			if (g === undefined) return;
			const s = span.get(g) ?? { lo: depth, hi: depth };
			span.set(g, { lo: Math.min(s.lo, depth), hi: Math.max(s.hi, depth) });
		})
	);
	for (const e of deal.slots) {
		const g = e?.link;
		if (g !== undefined) span.set(g, { lo: -1, hi: -1 });
	}
	const order = [...span].sort(([ga, a], [gb, b]) => a.hi - b.hi || a.lo - b.lo || ga - gb);
	return new Map(order.map(([g], k) => [g, LINK_MARKS[k % LINK_MARKS.length]]));
}

export function lockColors(s: State): Record<number, string> {
	const out: Record<number, string> = {};
	let n = 0;
	s.locks.forEach((cell, k) => {
		if (cell >= 0) out[k] = LOCK_MARKS[n++ % LOCK_MARKS.length];
	});
	return out;
}

export const GAP = 12;

// Lengths stay sums of CSS sizes (all even), so rails land on whole pixels at every page size.
export interface Len {
	lanes: number;
	slots: number;
	pads: number;
	px: number;
}

export interface Seg {
	x: Len;
	y: Len;
	w: Len;
	h: Len;
}

export interface Spot {
	col: number;
	depth: number;
}

const L = (lanes = 0, slots = 0, pads = 0, px = 0): Len => ({ lanes, slots, pads, px });
const add = (a: Len, b: Len): Len =>
	L(a.lanes + b.lanes, a.slots + b.slots, a.pads + b.pads, a.px + b.px);
const sub = (a: Len, b: Len): Len =>
	L(a.lanes - b.lanes, a.slots - b.slots, a.pads - b.pads, a.px - b.px);
const px = (n: number) => L(0, 0, 0, n);
// In px at the desktop sizes; only for comparing lengths and weighing paths.
const size = (v: Len) => v.lanes * (52 + GAP) + v.slots * 52 + v.pads * 8 + v.px;

function css(v: Len): string {
	return `calc(${v.lanes} * var(--lane-pitch) + ${v.slots} * var(--slot-size) + ${v.pads} * var(--pad) + ${v.px}px)`;
}

export function segStyle(s: Seg): string {
	return `left:${css(s.x)};top:${css(s.y)};width:${css(s.w)};height:${css(s.h)}`;
}

// Even, so a rail centered on a whole pixel has whole edges.
const RAIL = 4;
const TRACK = 6;

export interface RailGrid {
	cols: number;
	rows: number;
	taken: (col: number, depth: number) => boolean;
	channels?: boolean;
}

export interface Group {
	g: number;
	members: Spot[];
}

// Router grid: even x is the gap left of lane i/2, odd x a lane's middle; y alternates bands and rows.
const xAt = (i: number) => (i % 2 ? L((i - 1) / 2, 0.5) : L(i / 2 - 1, 1, 0, GAP / 2));
function yAt(j: number, grid: RailGrid) {
	if (j % 2) return L(0, (j - 1) / 2 + 0.5);
	if (j === 0) return px(grid.channels ? -GAP / 2 : -2);
	return L(0, j / 2);
}

const BEND = 40;
const SHARE_ROOMY = 30;
const SHARE = 400;
const CROSS = 60;
const NARROW = 8;
const OUTSIDE = 30;
const UPRIGHT_END = 12;

type Node = [number, number];
type Used = Map<string, Set<number>>;
const edgeKey = (a: Node, b: Node) =>
	a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? `${a}|${b}` : `${b}|${a}`;
const DIRS: Node[] = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1]
];

const nodeOf = (m: Spot): Node => [2 * m.col + 1, 2 * m.depth + 1];

function inChannels(i: number, j: number, nj: number, stub: boolean): boolean {
	if (j === nj) return j === 0 || stub;
	if (i % 2 === 0) return true;
	return stub && Math.min(j, nj) === 0;
}

function route(a: Node, b: Node, g: number, grid: RailGrid, used: Used): Node[] | null {
	const W = 2 * grid.cols + 1;
	const H = 2 * grid.rows;
	const free = (i: number, j: number) =>
		i >= 0 && j >= 0 && i < W && j < H && !(i % 2 && j % 2 && grid.taken((i - 1) / 2, (j - 1) / 2));
	const id = (i: number, j: number, d: number) => (j * W + i) * 4 + d;
	const cost = new Map<number, number>();
	const prev = new Map<number, number>();
	const open: [number, number, number, number][] = [];
	const others = (key: string) => [...(used.get(key) ?? [])].some((h) => h !== g);
	for (let d = 0; d < 4; d++) {
		open.push([0, a[0], a[1], d]);
		cost.set(id(a[0], a[1], d), 0);
	}
	let best = -1;
	while (open.length) {
		let k = 0;
		for (let n = 1; n < open.length; n++) if (open[n][0] < open[k][0]) k = n;
		const [c, i, j, d] = open.splice(k, 1)[0];
		if (c > (cost.get(id(i, j, d)) ?? Infinity)) continue;
		if (i === b[0] && j === b[1]) {
			best = id(i, j, d);
			break;
		}
		for (let nd = 0; nd < 4; nd++) {
			const [di, dj] = DIRS[nd];
			const ni = i + di;
			const nj = j + dj;
			const end = ni === b[0] && nj === b[1];
			if (!end && !free(ni, nj)) continue;
			const start = i === a[0] && j === a[1];
			if (grid.channels && !inChannels(i, j, nj, start || end)) continue;
			let step =
				Math.abs(size(sub(xAt(ni), xAt(i)))) + Math.abs(size(sub(yAt(nj, grid), yAt(j, grid))));
			if (!start && nd !== d) step += BEND;
			if (dj !== 0 && ((start && a[1] % 2) || (end && b[1] % 2))) step += UPRIGHT_END;
			if (ni === 0 || ni === W - 1) step += OUTSIDE;
			if (!dj && j % 2 === 0 && j > 0) step += NARROW;
			if (others(edgeKey([i, j], [ni, nj]))) {
				const roomy = dj ? i % 2 === 0 : j === 0 && !!grid.channels;
				step += roomy ? SHARE_ROOMY : SHARE;
			} else if (!end && others(`${ni},${nj}`)) step += CROSS;
			const n = id(ni, nj, nd);
			if (c + step < (cost.get(n) ?? Infinity)) {
				cost.set(n, c + step);
				prev.set(n, id(i, j, d));
				open.push([c + step, ni, nj, nd]);
			}
		}
	}
	if (best < 0) return null;
	const path: Node[] = [];
	for (let n: number | undefined = best; n !== undefined; n = prev.get(n)) {
		const cell = Math.floor(n / 4);
		path.push([cell % W, Math.floor(cell / W)]);
	}
	return path.reverse();
}

interface Run {
	g: number;
	h: boolean;
	at: number;
	lo: number;
	hi: number;
	off: number;
	before?: Run;
	after?: Run;
	from: Node;
	to: Node;
}

function corners(path: Node[]): Node[] {
	return path.filter((_, k) => {
		if (k === 0 || k === path.length - 1) return true;
		const [a, b] = [path[k - 1], path[k + 1]];
		return a[0] !== b[0] && a[1] !== b[1];
	});
}

function spread(runs: Run[], yOf: (j: number) => number) {
	const lines = new Map<string, Run[]>();
	for (const r of runs) {
		const key = `${r.h}${r.at}`;
		lines.set(key, [...(lines.get(key) ?? []), r]);
	}
	const sorted = [...lines.values()].sort((a, b) => Number(b[0].h) - Number(a[0].h));
	for (const line of sorted) {
		const h = line[0].h;
		const byGroup = new Map<number, { lo: number; hi: number; key: number }>();
		for (const r of line) {
			const s = byGroup.get(r.g);
			const key = h ? r.hi - r.lo : turnKey(r, yOf);
			byGroup.set(
				r.g,
				s
					? { lo: Math.min(s.lo, r.lo), hi: Math.max(s.hi, r.hi), key: s.key }
					: { lo: r.lo, hi: r.hi, key }
			);
		}
		const stretches = [...byGroup].sort(([, a], [, b]) => a.lo - b.lo || a.hi - b.hi);
		let k = 0;
		while (k < stretches.length) {
			const cluster = [stretches[k]];
			let hi = stretches[k][1].hi;
			while (++k < stretches.length && stretches[k][1].lo <= hi) {
				cluster.push(stretches[k]);
				hi = Math.max(hi, stretches[k][1].hi);
			}
			if (cluster.length < 2) continue;
			cluster.sort(([, a], [, b]) => a.key - b.key);
			const track = new Map<number, number>();
			if (h) {
				const tracks: { lo: number; hi: number }[][] = [];
				for (const [g, s] of cluster) {
					let t = tracks.findIndex((on) => on.every((o) => o.hi < s.lo || s.hi < o.lo));
					if (t < 0) t = tracks.push([]) - 1;
					tracks[t].push(s);
					track.set(g, t);
				}
				for (const r of line) {
					const t = track.get(r.g);
					if (t === undefined) continue;
					r.off = Math.round((t - (tracks.length - 1) / 2) * TRACK);
				}
			} else {
				cluster.forEach(([g], t) => track.set(g, t));
				for (const r of line) {
					const t = track.get(r.g);
					if (t !== undefined) r.off = Math.round((t - (cluster.length - 1) / 2) * TRACK);
				}
			}
		}
	}
}

function turnKey(r: Run, yOf: (j: number) => number): number {
	const down = r.to[1] > r.from[1];
	const bottom = down ? r.after : r.before;
	const top = down ? r.before : r.after;
	const side = (h: Run | undefined, corner: Node) => {
		if (!h) return 0;
		const other = h.from[0] === corner[0] && h.from[1] === corner[1] ? h.to : h.from;
		return Math.sign(other[0] - corner[0]);
	};
	const BIG = 1e4;
	if (bottom) {
		const dir = side(bottom, down ? r.to : r.from);
		return dir * BIG - dir * (yOf(bottom.at) + bottom.off);
	}
	if (top) {
		const dir = side(top, down ? r.from : r.to);
		return dir * BIG + dir * (yOf(top.at) + top.off);
	}
	return 0;
}

export function rails(groups: Group[], grid: RailGrid): { g: number; segs: Seg[] }[] {
	type Join = { g: number; a: Spot; b: Spot };
	const joins: Join[] = [];
	for (const { g, members } of groups) {
		const spots = members
			.filter((m) => m.depth < grid.rows)
			.sort((a, b) => a.col - b.col || a.depth - b.depth);
		for (let k = 0; k + 1 < spots.length; k++) {
			const [a, b] = [spots[k], spots[k + 1]];
			if (a.col !== b.col || b.depth === a.depth + 1) joins.push({ g, a, b });
		}
	}
	const far = (j: Join) => {
		const [a, b] = [nodeOf(j.a), nodeOf(j.b)];
		return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
	};
	joins.sort((x, y) => far(x) - far(y));

	const used: Used = new Map();
	const mark = (key: string, g: number) => used.set(key, (used.get(key) ?? new Set()).add(g));
	const laid: { g: number; pts: Node[] }[] = [];
	for (const j of joins) {
		const [a, b] = [nodeOf(j.a), nodeOf(j.b)];
		const path = j.a.col === j.b.col ? [a, b] : route(a, b, j.g, grid, used);
		if (!path) continue;
		path.forEach((p, k) => {
			mark(`${p}`, j.g);
			if (k) mark(edgeKey(path[k - 1], p), j.g);
		});
		laid.push({ g: j.g, pts: corners(path) });
	}

	const runsOf = laid.map(({ g, pts }) => {
		const runs = pts.slice(1).map((p, k): Run => {
			const q = pts[k];
			const h = p[1] === q[1];
			const [lo, hi] = h ? [q[0], p[0]].sort((x, y) => x - y) : [q[1], p[1]].sort((x, y) => x - y);
			return { g, h, at: h ? p[1] : p[0], lo, hi, off: 0, from: q, to: p };
		});
		runs.forEach((r, k) => {
			r.before = runs[k - 1];
			r.after = runs[k + 1];
		});
		return runs;
	});
	spread(runsOf.flat(), (j) => size(yAt(j, grid)));

	const out = new Map<number, Seg[]>();
	laid.forEach(({ g, pts }, n) => {
		const runs = runsOf[n];
		const at = pts.map((p, k): { x: Len; y: Len } => {
			let x = xAt(p[0]);
			let y = yAt(p[1], grid);
			for (const r of [runs[k - 1], runs[k]]) {
				if (!r) continue;
				if (r.h) y = add(y, px(r.off));
				else x = add(x, px(r.off));
			}
			return { x, y };
		});
		trimEnd(at, pts, 0);
		trimEnd(at, pts, pts.length - 1);
		out.set(g, [...(out.get(g) ?? []), ...bars(at)]);
	});
	return [...out].map(([g, segs]) => ({ g, segs }));
}

function trimEnd(at: { x: Len; y: Len }[], pts: Node[], k: number) {
	const next = pts[k === 0 ? 1 : k - 1];
	const p = pts[k];
	const h = next[1] === p[1];
	const toward = h ? Math.sign(next[0] - p[0]) : Math.sign(next[1] - p[1]);
	const reach = L(0, 0.5, -0.5, -2);
	const v = toward > 0 ? reach : sub(L(), reach);
	if (h) at[k].x = add(at[k].x, v);
	else at[k].y = add(at[k].y, v);
}

function bars(pts: { x: Len; y: Len }[]): Seg[] {
	const half = px(RAIL / 2);
	const last = pts.length - 1;
	const out: Seg[] = [];
	for (let k = 0; k < last; k++) {
		const flat = size(pts[k].y) === size(pts[k + 1].y);
		const axis = flat ? 'x' : 'y';
		let [lo, hi] = [
			{ v: pts[k][axis], corner: k > 0 },
			{ v: pts[k + 1][axis], corner: k + 1 < last }
		];
		if (size(lo.v) > size(hi.v)) [lo, hi] = [hi, lo];
		const from = lo.corner ? sub(lo.v, half) : lo.v;
		const to = hi.corner ? add(hi.v, half) : hi.v;
		if (size(to) <= size(from)) continue;
		const across = sub(pts[k][flat ? 'y' : 'x'], half);
		const thick = px(RAIL);
		out.push(
			flat
				? { x: from, y: across, w: sub(to, from), h: thick }
				: { x: across, y: from, w: thick, h: sub(to, from) }
		);
	}
	return out;
}
