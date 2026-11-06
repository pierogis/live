/*
 * A small drawing surface for Mosaic's generated pictures.
 *
 * Templates paint named parts ("sky", "roof", "eye") with shapes given in fractions of
 * the picture (0..1 across and down; circles are round whatever the picture's shape).
 * Each part says which true colors it may take, how important it is, and what it turns
 * into when the picture has fewer colors than parts (a window becomes wall).
 * `finish` keeps the most important parts that fit the color budget, folds away
 * regions too small to be worth a group, and picks the colors.
 */
import { pickOne, type Rng } from '../../src/lib/shared/engine.ts';
import { inside, type Shape } from '../shapes.ts';
import { assignColors, fits, hexOf, lightness, tones } from './colors.ts';

/** A test on a cell's center, in fractions of the picture. */
export type Pred = (x: number, y: number) => boolean;

export interface Part {
	colors: string[];
	/** Lower is kept first when the color budget is short. */
	pri: number;
	/** What this part becomes when it isn't kept; none means its neighbors grow over it. */
	else?: string;
	/** Smallest region worth keeping (cells, corners touching count). */
	min?: number;
	/** Colors for its lower half, first choice, when it has to be split (see finish). */
	tones?: string[];
}

/** Regions smaller than this fold into a neighbor, unless a part asks for less. */
const MIN_REGION = 6;

export class Canvas {
	readonly w: number;
	readonly h: number;
	/** How far into play: 0 (first picture) to 1 (last). Templates add detail with it. */
	readonly t: number;
	/** Which use of its template this picture is (0, 1, ...), so repeats can differ. */
	readonly use: number;
	readonly rng: Rng;
	/** Part name per cell. */
	grid: string[];
	parts = new Map<string, Part>();
	#order: number[] = [];

	constructor(w: number, h: number, t: number, use: number, rng: Rng) {
		this.w = w;
		this.h = h;
		this.t = t;
		this.use = use;
		this.rng = rng;
		this.grid = new Array(w * h).fill('');
	}

	// ---------- randomness ----------
	r(a: number, b: number) {
		return a + this.rng() * (b - a);
	}
	ri(a: number, b: number) {
		return Math.floor(this.r(a, b + 1));
	}
	chance(p: number) {
		return this.rng() < p;
	}
	pick<T>(xs: readonly T[]): T {
		return pickOne(xs, this.rng);
	}
	/** One of `xs` per use of the template, in an order fixed per template, so repeats differ. */
	cycle<T>(xs: readonly T[], salt = 0): T {
		let k = this.#order[salt];
		if (k === undefined) k = this.#order[salt] = Math.floor(this.rng() * xs.length);
		return xs[(k + this.use) % xs.length];
	}
	/** `lo` at the start of play, `hi` at the end, rounded. */
	more(lo: number, hi: number) {
		return Math.round(lo + (hi - lo) * this.t);
	}

	// ---------- parts ----------
	part(name: string, colors: string[], pri: number, orElse?: string, min?: number) {
		this.parts.set(name, { colors, pri, else: orElse, min });
		return name;
	}
	paint(name: string, where: Pred | Shape) {
		if (!this.parts.has(name)) throw new Error(`no part "${name}"`);
		const test = typeof where === 'function' ? where : this.shape(where);
		for (let y = 0; y < this.h; y++) {
			for (let x = 0; x < this.w; x++) {
				if (test((x + 0.5) / this.w, (y + 0.5) / this.h)) this.grid[y * this.w + x] = name;
			}
		}
	}
	/** Paint only over cells that are now one of `over`. */
	paintOver(name: string, where: Pred | Shape, over: string[]) {
		const test = typeof where === 'function' ? where : this.shape(where);
		this.paint(name, (x, y) => over.includes(this.at(x, y)) && test(x, y));
	}
	fill(name: string) {
		this.paint(name, () => true);
	}
	/** The part at a point given in fractions. */
	at(x: number, y: number): string {
		const cx = Math.min(this.w - 1, Math.max(0, Math.floor(x * this.w)));
		const cy = Math.min(this.h - 1, Math.max(0, Math.floor(y * this.h)));
		return this.grid[cy * this.w + cx];
	}

	// ---------- shapes, in fractions ----------
	/** A shapes.ts shape given in cells. */
	shape(s: Shape): Pred {
		return (x, y) => inside(s, x * this.w, y * this.h);
	}
	rect(x0: number, y0: number, x1: number, y1: number): Pred {
		return (x, y) => x >= x0 && x < x1 && y >= y0 && y < y1;
	}
	/** An ellipse with radii in fractions of the width and the height. */
	ell(cx: number, cy: number, rx: number, ry: number): Pred {
		return (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
	}
	/** A round circle: r in fractions of the shorter side. */
	circ(cx: number, cy: number, r: number): Pred {
		const m = Math.min(this.w, this.h);
		const sx = this.w / m;
		const sy = this.h / m;
		return (x, y) => ((x - cx) * sx) ** 2 + ((y - cy) * sy) ** 2 <= r * r;
	}
	/** A round blob scaled by (kx, ky) of the shorter side. */
	oval(cx: number, cy: number, kx: number, ky: number): Pred {
		const m = Math.min(this.w, this.h);
		return (x, y) => (((x - cx) * this.w) / m / kx) ** 2 + (((y - cy) * this.h) / m / ky) ** 2 <= 1;
	}
	/** A round dot `r` cells across its radius, at (x, y) in fractions. */
	dot(x: number, y: number, r: number): Pred {
		return (px, py) => Math.hypot((px - x) * this.w, (py - y) * this.h) <= r;
	}
	poly(pts: [number, number][]): Pred {
		return (x, y) => inside(['poly', pts], x, y);
	}
	/** Inside all of them. */
	and(...ps: Pred[]): Pred {
		return (x, y) => ps.every((p) => p(x, y));
	}
	/** Inside any of them. */
	or(...ps: Pred[]): Pred {
		return (x, y) => ps.some((p) => p(x, y));
	}
	not(p: Pred): Pred {
		return (x, y) => !p(x, y);
	}
	/** A thick segment; `width` in cells. */
	line(x0: number, y0: number, x1: number, y1: number, width: number): Pred {
		const ax = x0 * this.w;
		const ay = y0 * this.h;
		const dx = (x1 - x0) * this.w;
		const dy = (y1 - y0) * this.h;
		const len2 = dx * dx + dy * dy || 1;
		return (x, y) => {
			const px = x * this.w - ax;
			const py = y * this.h - ay;
			const k = Math.max(0, Math.min(1, (px * dx + py * dy) / len2));
			return Math.hypot(px - k * dx, py - k * dy) <= width / 2;
		};
	}
	/** Below the curve y = f(x). */
	below(f: (x: number) => number): Pred {
		return (x, y) => y >= f(x);
	}
	/** A wavy horizon: base height, amplitude, waves across, phase (all fractions). */
	wave(base: number, amp: number, waves: number, phase: number): (x: number) => number {
		return (x) => base + amp * Math.sin((x * waves + phase) * 2 * Math.PI);
	}

	// ---------- finishing ----------
	/** Flip the picture left to right. */
	mirror() {
		const g = this.grid.slice();
		for (let y = 0; y < this.h; y++) {
			for (let x = 0; x < this.w; x++) this.grid[y * this.w + x] = g[y * this.w + this.w - 1 - x];
		}
	}

	/** Regions (corners touching) of one part each, as cell lists. */
	regions(grid = this.grid): number[][] {
		const { w, h } = this;
		const seen = new Uint8Array(w * h);
		const out: number[][] = [];
		for (let i = 0; i < w * h; i++) {
			if (seen[i]) continue;
			const cells = [i];
			seen[i] = 1;
			for (let k = 0; k < cells.length; k++) {
				const j = cells[k];
				const x = j % w;
				const y = (j - x) / w;
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						const nx = x + dx;
						const ny = y + dy;
						if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
						const n = ny * w + nx;
						if (!seen[n] && grid[n] === grid[i]) {
							seen[n] = 1;
							cells.push(n);
						}
					}
				}
			}
			out.push(cells);
		}
		return out;
	}

	/** Fold regions smaller than their part's minimum into the neighbor they touch most. */
	fold(grid: string[], min: (name: string) => number) {
		const { w, h } = this;
		for (let pass = 0; pass < 40; pass++) {
			let changed = false;
			const regions = this.regions(grid).sort((a, b) => a.length - b.length);
			for (const cells of regions) {
				const name = grid[cells[0]];
				if (name && cells.length >= min(name)) continue;
				const mine = new Set(cells);
				const votes = new Map<string, number>();
				for (const j of cells) {
					const x = j % w;
					const y = (j - x) / w;
					for (const [nx, ny] of [
						[x - 1, y],
						[x + 1, y],
						[x, y - 1],
						[x, y + 1]
					]) {
						if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
						const n = ny * w + nx;
						if (mine.has(n) || !grid[n] || grid[n] === name) continue;
						votes.set(grid[n], (votes.get(grid[n]) ?? 0) + 1);
					}
				}
				let best = '';
				let bestN = 0;
				for (const [k, n] of votes) {
					if (n > bestN) {
						best = k;
						bestN = n;
					}
				}
				if (!best) continue;
				for (const j of cells) grid[j] = best;
				changed = true;
			}
			if (!changed) return;
		}
	}

	/**
	 * Keep the `budget` most important parts, fold the rest and any tiny regions away,
	 * and give each kept part a color. When one color would cover more than `maxShare`
	 * of the picture, its lower half takes a nearby tone instead (like a sky's lower band,
	 * or a wall's wainscot), within the same budget. Returns the rows and palette, or
	 * null when no colors fit.
	 */
	finish(
		budget: number,
		rng: Rng,
		maxShare = 1
	): { art: string[]; palette: Record<string, string> } | null {
		let pick = this.#pick(budget, rng);
		if (pick && topOf(pick.grid).share > maxShare && budget > 2) {
			const fewer = this.#pick(budget - 1, rng);
			if (fewer && this.#split(fewer)) pick = fewer;
		}
		if (!pick) return null;
		const { want, names, grid } = pick;
		const letters = letterFor(names);
		const key = new Map(want.map((k, i) => [k, letters[i]]));
		const art: string[] = [];
		for (let y = 0; y < this.h; y++) {
			let row = '';
			for (let x = 0; x < this.w; x++) row += key.get(grid[y * this.w + x])!;
			art.push(row);
		}
		const palette: Record<string, string> = {};
		want.forEach((k, i) => (palette[letters[i]] = hexOf(names[i])));
		return { art, palette };
	}

	/** The parts kept for `budget` colors, their colors, and the folded grid of them. */
	#pick(budget: number, rng: Rng): { want: string[]; names: string[]; grid: string[] } | null {
		const minOf = (name: string) => this.parts.get(name)?.min ?? MIN_REGION;
		const order = [...this.parts.keys()];
		const ranked = order
			.slice()
			.sort(
				(a, b) =>
					this.parts.get(a)!.pri - this.parts.get(b)!.pri || order.indexOf(a) - order.indexOf(b)
			);
		const painted = new Set(this.grid);
		// Parts that fold away to nothing, or whose colors can't sit with the rest, are
		// skipped: the next parts in line take their places.
		const skip = new Set<string>();
		for (let round = 0; round < 40; round++) {
			const want: string[] = [];
			let names: string[] = [];
			for (const k of ranked) {
				if (want.length >= budget) break;
				if (skip.has(k) || !painted.has(k)) continue;
				const next = assignColors(
					[...want, k].map((p) => this.parts.get(p)!.colors),
					rng
				);
				if (next) {
					want.push(k);
					names = next;
				} else skip.add(k);
			}
			const grid = this.grid.map((name) => {
				let k: string | undefined = name;
				const seen = new Set<string>();
				while (k && !want.includes(k) && !seen.has(k)) {
					seen.add(k);
					k = this.parts.get(k)?.else;
				}
				return k && want.includes(k) ? k : '';
			});
			this.fold(grid, minOf);
			const present = new Set(grid.filter(Boolean));
			const lost = want.filter((k) => !present.has(k));
			if (lost.length) {
				lost.forEach((k) => skip.add(k));
				continue;
			}
			if (grid.some((k) => !k) || want.length < 2) return null;
			return { want, names, grid };
		}
		return null;
	}

	/** Give the lower half of the biggest part a nearby tone that fits the other colors. */
	#split(pick: { want: string[]; names: string[]; grid: string[] }): boolean {
		const { want, names, grid } = pick;
		const { key: top } = topOf(grid);
		const part = this.parts.get(top)!;
		const cells: number[] = [];
		grid.forEach((k, i) => k === top && cells.push(i));
		// Lighter toward a sky's horizon, darker toward the bottom of ground or water.
		const high =
			cells.reduce((sum, i) => sum + Math.floor(i / this.w), 0) / cells.length < this.h / 2;
		const mine = names[want.indexOf(top)];
		const way = (n: string) => (lightness(n) > lightness(mine) === high ? 0 : 1);
		// A nearby tone of its color, else another of the part's own colors.
		const own = [...tones(mine), ...part.colors].sort((a, b) => way(a) - way(b));
		// A part that names its tones (a sky) only takes those, or its own colors.
		const choices = part.tones ? [...part.tones, ...part.colors] : [...own, ...tones(mine, 0.8)];
		const tone = choices.find((n) => !names.includes(n) && names.every((o) => fits(o, n)));
		if (!tone) return false;
		const splitRow = Math.floor(cells[Math.floor(cells.length / 2)] / this.w);
		const lower = `${top}~`;
		for (const i of cells) if (Math.floor(i / this.w) >= splitRow) grid[i] = lower;
		this.fold(grid, (name) => this.parts.get(name.replace(/~$/, ''))?.min ?? MIN_REGION);
		if (!grid.includes(lower)) return false;
		want.push(lower);
		names.push(tone);
		return true;
	}
}

/** The most common key in a grid, and its share of the cells. */
function topOf(grid: string[]): { key: string; share: number } {
	const counts = new Map<string, number>();
	for (const k of grid) counts.set(k, (counts.get(k) ?? 0) + 1);
	const [key, n] = [...counts].sort((a, b) => b[1] - a[1])[0];
	return { key, share: n / grid.length };
}

/** A letter per color name: its first letter when free, else another of its letters. */
function letterFor(names: string[]): string[] {
	const used = new Set<string>();
	return names.map((name) => {
		const options = [...name.toUpperCase(), ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
		const ch = options.find((c) => /[A-Z]/.test(c) && !used.has(c))!;
		used.add(ch);
		return ch;
	});
}
