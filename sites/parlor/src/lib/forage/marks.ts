/*
 * Markers: what ties pieces together on the board, as opposed to food.
 *
 *   - A linked group's members each wear a ring (a halo just outside the
 *     colony) in the group's color, and a rail of that color joins them.
 *   - A lock and its key food in the picture share a color.
 *
 * Markers are only ever rings and thin rails, never fills, so a marker can't be
 * mistaken for food whatever its color. Locks and groups take their colors from
 * separate sets, so a group never matches a lock.
 *
 * Rails are laid out on the lanes' grid (the slots row uses the same grid as
 * one row). Lengths are kept as sums of CSS sizes, so they stay whole pixels
 * at every size the page picks.
 *
 * In the lanes, rails keep to their own room: the gaps between lanes and the
 * strip above them. A rail only crosses a lane's outline where it steps out of
 * a colony. Members back to back in one lane (a stack, which goes out as one)
 * are joined by a short bar straight between them. A member out of sight gets
 * no rail; a ring in its group's color sits by its lane's count instead.
 */
import type { State } from './engine';

/** Colors for locks and their keys, in order of the columns that have one. */
export const LOCK_MARKS = ['#e0a400', '#2b9be0', '#d4479c'];

/**
 * Colors for linked groups: soft, mid-tone, and away from the lock colors
 * (no yellow, sky blue or magenta). The first ones are the most distinct,
 * since most levels have only two or three groups; the biggest late levels have up to 8.
 */
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

/**
 * A color for each linked group of the deal, keyed by its `link`. Groups are taken in
 * about the order they go out (by their deepest member, then their shallowest),
 * and each takes the next color, so groups on the board at the same time differ:
 * every level has at most as many groups as there are colors. With more, the
 * colors repeat, between the groups furthest apart.
 */
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
	// Groups already out in the slots go first.
	for (const e of deal.slots) {
		const g = e?.link;
		if (g !== undefined) span.set(g, { lo: -1, hi: -1 });
	}
	const order = [...span].sort(([ga, a], [gb, b]) => a.hi - b.hi || a.lo - b.lo || ga - gb);
	return new Map(order.map(([g], k) => [g, LINK_MARKS[k % LINK_MARKS.length]]));
}

/** A lock color for each column that has a lock in the deal. */
export function lockColors(s: State): Record<number, string> {
	const out: Record<number, string> = {};
	let n = 0;
	s.locks.forEach((cell, k) => {
		if (cell >= 0) out[k] = LOCK_MARKS[n++ % LOCK_MARKS.length];
	});
	return out;
}

// ---------- rail layout ----------

/** The gap between lanes (and slots), and the strip between the slots and the lanes, px. */
export const GAP = 12;

/**
 * A length on the lanes' grid: `lanes` lane pitches (a slot plus the GAP),
 * `slots` slot sizes, `pads` paddings (half of slot minus colony) and `px` pixels.
 * Slot and colony sizes are even and the padding is too, so halves of each are
 * whole pixels.
 */
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

/** Where a member sits: its column (or slot), and how far back (0 = the front). */
export interface Spot {
	col: number;
	depth: number;
}

/** A length; see Len. */
const L = (lanes = 0, slots = 0, pads = 0, px = 0): Len => ({ lanes, slots, pads, px });
const add = (a: Len, b: Len): Len =>
	L(a.lanes + b.lanes, a.slots + b.slots, a.pads + b.pads, a.px + b.px);
const sub = (a: Len, b: Len): Len =>
	L(a.lanes - b.lanes, a.slots - b.slots, a.pads - b.pads, a.px - b.px);
const px = (n: number) => L(0, 0, 0, n);
/** A length in px at the desktop sizes, to compare lengths and weigh paths. */
const size = (v: Len) => v.lanes * (52 + GAP) + v.slots * 52 + v.pads * 8 + v.px;

/** The CSS for a length. */
function css(v: Len): string {
	return `calc(${v.lanes} * var(--lane-pitch) + ${v.slots} * var(--slot-size) + ${v.pads} * var(--pad) + ${v.px}px)`;
}

/** A bar's place and size as inline CSS. */
export function segStyle(s: Seg): string {
	return `left:${css(s.x)};top:${css(s.y)};width:${css(s.w)};height:${css(s.h)}`;
}

/** Rail thickness, px. Even, so a rail centered on a whole pixel has whole edges. */
const RAIL = 4;
/** How far apart rails of different groups run when they share a gap, px. Two fit in a GAP. */
const TRACK = 6;

export interface RailGrid {
	/** Columns (lanes or slots). */
	cols: number;
	/** Rows shown; a member deeper than this is out of sight. */
	rows: number;
	/** Whether something sits at a spot, so a rail has to go around it. */
	taken: (col: number, depth: number) => boolean;
	/**
	 * Rails keep to the gaps between columns and the strip above the rows (the lanes),
	 * leaving a colony only by a short step into the gap beside it or the strip above.
	 * Without it (the slots) a rail may cross a row's middle and runs just above it.
	 */
	channels?: boolean;
}

/** A linked group to join: its members, in sight or not. */
export interface Group {
	g: number;
	members: Spot[];
}

/*
 * The router works on a grid of lines between the colonies: x index i runs over
 * the gaps and lanes left to right (even = the gap left of lane i/2, odd = lane
 * (i-1)/2's middle), y index j over the bands and rows top to bottom (even = the
 * band above row j/2; odd = row (j-1)/2's middle). A rail may go anywhere on it
 * except through a spot that's taken, and in channels only along the gaps and
 * the top strip.
 */
const xAt = (i: number) => (i % 2 ? L((i - 1) / 2, 0.5) : L(i / 2 - 1, 1, 0, GAP / 2));
function yAt(j: number, grid: RailGrid) {
	if (j % 2) return L(0, (j - 1) / 2 + 0.5);
	if (j === 0) return px(grid.channels ? -GAP / 2 : -2);
	return L(0, j / 2);
}

/** Path weights, in desktop px. */
const BEND = 40;
/**
 * Sharing a line with another group: cheap where there's room for tracks side by
 * side (the gaps between lanes, the strip above them), dear in the narrow bands between rows.
 */
const SHARE_ROOMY = 30;
const SHARE = 400;
const CROSS = 60;
const NARROW = 8;
const OUTSIDE = 30;
const UPRIGHT_END = 12;

type Node = [number, number];
/** Which of a grid's lines and points each group already uses. */
type Used = Map<string, Set<number>>;
const edgeKey = (a: Node, b: Node) =>
	a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? `${a}|${b}` : `${b}|${a}`;
const DIRS: Node[] = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1]
];

/** Where a member's rail starts: its middle. */
const nodeOf = (m: Spot): Node => [2 * m.col + 1, 2 * m.depth + 1];

/**
 * Whether a rail may run from (i, j) to (ni, nj) in channels: along a gap, along
 * the top strip, or a step out of (or into) a member, sideways into the gap
 * beside it or, from the front row, up into the strip.
 */
function inChannels(i: number, j: number, ni: number, nj: number, stub: boolean): boolean {
	if (j === nj) return j === 0 || stub;
	if (i % 2 === 0) return true;
	return stub && Math.min(j, nj) === 0;
}

/** The cheapest grid path from a to b (a small Dijkstra over node and heading), or null. */
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
			if (grid.channels && !inChannels(i, j, ni, nj, start || end)) continue;
			let step =
				Math.abs(size(sub(xAt(ni), xAt(i)))) + Math.abs(size(sub(yAt(nj, grid), yAt(j, grid))));
			if (!start && nd !== d) step += BEND;
			// Leaving or reaching a colony through its top or bottom rather than its side.
			if (dj !== 0 && ((start && a[1] % 2) || (end && b[1] % 2))) step += UPRIGHT_END;
			if (ni === 0 || ni === W - 1) step += OUTSIDE;
			// The bands between rows are narrow, so a rail keeps to them only when it has to.
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

/** A rail's straight runs, on grid lines: h runs at y index `at` from x index lo to hi, v likewise. */
interface Run {
	g: number;
	h: boolean;
	at: number;
	lo: number;
	hi: number;
	off: number;
	/** The runs before and after it on its rail. */
	before?: Run;
	after?: Run;
	/** Its ends, in the rail's order. */
	from: Node;
	to: Node;
}

/** The path's corners (where it turns), with its two ends. */
function corners(path: Node[]): Node[] {
	return path.filter((_, k) => {
		if (k === 0 || k === path.length - 1) return true;
		const [a, b] = [path[k - 1], path[k + 1]];
		return a[0] !== b[0] && a[1] !== b[1];
	});
}

/**
 * Rails of different groups that share a gap run side by side, TRACK apart and
 * centered on the gap, rather than over each other.
 *
 * Across a line, shorter stretches take the inner tracks. Down a gap, tracks
 * are ordered by where each rail turns off at its ends, so rails turning the
 * same way nest rather than cross.
 */
function spread(runs: Run[], yOf: (j: number) => number) {
	const lines = new Map<string, Run[]>();
	for (const r of runs) {
		const key = `${r.h}${r.at}`;
		lines.set(key, [...(lines.get(key) ?? []), r]);
	}
	const sorted = [...lines.values()].sort((a, b) => Number(b[0].h) - Number(a[0].h));
	for (const line of sorted) {
		const h = line[0].h;
		// One stretch per group on this line, from its runs' union.
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
		// Stretches that overlap, or meet at a point, form a cluster; each takes its own track in it.
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
				// Across: shortest first, each on the first track it fits.
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
				// Down: one track each, left to right in turning order.
				cluster.forEach(([g], t) => track.set(g, t));
				for (const r of line) {
					const t = track.get(r.g);
					if (t !== undefined) r.off = Math.round((t - (cluster.length - 1) / 2) * TRACK);
				}
			}
		}
	}
}

/**
 * Where an upright run belongs across its gap, from how it turns off at its
 * bottom end (or its top, when its bottom is a colony): rails turning left
 * keep to the left, and of those, the one turning off lower is further right at
 * a bottom turn, further left at a top turn (and the mirror for right turns).
 */
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

/**
 * The rails joining each group's members. Each group's members are joined left
 * to right, the shortest joins first, each by the path with the fewest bends
 * that keeps off colonies and other groups' rails. Only the members in sight
 * are joined (a lane's count stands for the rest). Members in one column are
 * back to back, so they're joined straight down.
 */
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

	// Each rail's runs, spread where groups share a line.
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
		// Each corner sits where its two runs' tracks meet.
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

/** Pull a rail's end back from a member's middle to the inside of its ring, so the rail meets the ring. */
function trimEnd(at: { x: Len; y: Len }[], pts: Node[], k: number) {
	const next = pts[k === 0 ? 1 : k - 1];
	const p = pts[k];
	const h = next[1] === p[1];
	const toward = h ? Math.sign(next[0] - p[0]) : Math.sign(next[1] - p[1]);
	// From the middle: half a colony (half a slot less the padding), then the ring's gap.
	const reach = L(0, 0.5, -0.5, -2);
	const v = toward > 0 ? reach : sub(L(), reach);
	if (h) at[k].x = add(at[k].x, v);
	else at[k].y = add(at[k].y, v);
}

/**
 * A path as bars of RAIL thickness. Bars meeting at a corner each run half the
 * thickness past it, so the corner is filled; the ends at colonies don't.
 */
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
