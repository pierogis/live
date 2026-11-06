// Generate Forage level pictures from shape templates, seeded, so the packs can be rebuilt:
//   pnpm -F parlor forage:pictures [--start-pack 6] [--out <dir>]
// Every picture is original: simple objects and scenes drawn from circles, rects and
// polygons, with dark outlines around objects so their insides start sealed off.
// Then each gets more colors (shading and small parts, see Extra), about 7 at the start of
// play rising to 12 by pack 05 and 16 by pack 10, every pair still at least MIN_DELTA apart,
// and small islands of its colors (see Detail).
// Two sets: packs 02 to 05 (88 levels) from TEMPLATES, and packs 06 to 10 (100 levels)
// mostly from SUBJECTS. Both are drawn on every run, even with `--start-pack`, so the
// second set's names never repeat the first's.
// Writes src/lib/forage/levels/NN-<name>.json packs from `--start-pack` on (02 by default),
// or into `--out <dir>` instead, to compare a change to this script without touching the
// packs. A level whose picture comes out the same keeps the deal forage:tune saved for it;
// run forage:tune for the rest.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { slug } from '../src/lib/shared/editor/grid.ts';
import { makeRng, type Rng } from '../src/lib/shared/engine.ts';
import type { Picture } from '../src/lib/shared/level.ts';
import { closePairs, deltaE, lab, MIN_DELTA, rgbToHex } from '../src/lib/shared/palette.ts';
import {
	inside,
	or,
	path,
	rasterize,
	regular,
	ring,
	roundRect,
	segment,
	star,
	type Shape
} from './shapes.ts';
import { TUNED } from '../src/lib/forage/engine.ts';
import { writePack } from './write-pack.ts';

const { values: args } = parseArgs({
	options: {
		'start-pack': { type: 'string', default: '2' },
		out: { type: 'string' }
	}
});
/** Pictures in the first set (packs 02 to 05, 22 each). */
const FIRST = 88;
const START_PACK = Number(args['start-pack']);
const OUT = args.out
	? pathToFileURL(`${args.out.replace(/\/$/, '')}/`)
	: new URL('../src/lib/forage/levels/', import.meta.url);

/** Colors to choose from, by name, so templates can ask for "something warm". */
const BANK: Record<string, string> = {
	red: '#e63946',
	coral: '#ff6f61',
	orange: '#ff9f43',
	amber: '#f2a541',
	yellow: '#ffd23f',
	lime: '#a7d948',
	green: '#2e9d5b',
	forest: '#1e5631',
	teal: '#1fb5a8',
	mint: '#9ad0c2',
	sky: '#8fd3ff',
	blue: '#3b7dd8',
	navy: '#24426b',
	indigo: '#4b3f9e',
	violet: '#9b5de5',
	lilac: '#c8a2e8',
	pink: '#ff7eb6',
	rose: '#f4a6b8',
	magenta: '#d63aa0',
	plum: '#6a2c70',
	brown: '#8a5a32',
	tan: '#e8c39e',
	sand: '#f2c46d',
	cream: '#fff4d6',
	white: '#ffffff',
	grey: '#9a97a8',
	night: '#1c2340',
	dusk: '#3f5fb0'
};
const WARM = ['red', 'coral', 'orange', 'amber', 'yellow', 'pink', 'magenta'];
const COOL = ['teal', 'blue', 'indigo', 'violet', 'sky', 'mint', 'green'];
const SKY = ['sky', 'cream', 'mint', 'rose', 'lilac', 'night', 'dusk', 'sand'];
const GROUND = ['green', 'forest', 'sand', 'tan', 'brown', 'lime', 'teal'];
const ANY = Object.keys(BANK).filter((k) => !['white', 'cream', 'night'].includes(k));
const OUTLINES = ['#24212b', '#000000', '#f8f8f2', '#5a3a1a', '#3a2f5b', '#7a1f3d', '#0f4d3a'];

/**
 * More colors, for the parts added once a picture's first colors are set (see Extra).
 * The bank above stays as it is: its colors pick each picture's name.
 */
const MORE: Record<string, string> = {
	maroon: '#7b1e2b',
	crimson: '#b3123c',
	scarlet: '#ff3b2f',
	brick: '#b5482e',
	rust: '#b7410e',
	terracotta: '#d2694a',
	salmon: '#fa8f74',
	peach: '#ffc4a3',
	apricot: '#f9b17a',
	tangerine: '#ff8a1c',
	gold: '#e8b10e',
	mustard: '#c9a227',
	ochre: '#c27c0e',
	lemon: '#fff35c',
	khaki: '#c8bf7a',
	olive: '#7a7a2a',
	moss: '#5d7c2f',
	chartreuse: '#b8e04a',
	leaf: '#6abf4b',
	emerald: '#13a35f',
	jade: '#00a67e',
	pine: '#0f4a3c',
	sage: '#9fb89a',
	seafoam: '#7fe0c0',
	aqua: '#4fd8e0',
	turquoise: '#2bb6c4',
	cyan: '#12c2e9',
	cerulean: '#2a8bc9',
	azure: '#4a9df8',
	cobalt: '#1f48b5',
	steel: '#5f7f9f',
	slate: '#4b5a6b',
	ice: '#d4f1ff',
	periwinkle: '#9aa8f0',
	lavender: '#b9a7f5',
	iris: '#6c5ce7',
	grape: '#5b2a86',
	mauve: '#b07aa1',
	orchid: '#da70d6',
	fuchsia: '#f03fb0',
	berry: '#8e2a5c',
	wine: '#5e1a33',
	blush: '#f7b8c6',
	bubblegum: '#ff9cd0',
	chocolate: '#4e2a1a',
	cocoa: '#6b4226',
	caramel: '#c47a3a',
	copper: '#b86b3c',
	bronze: '#9c6b30',
	coffee: '#7a5a44',
	beige: '#e8d8b8',
	ivory: '#fffbe8',
	stone: '#8d8478',
	ash: '#b8b4ae',
	charcoal: '#3b3b42',
	smoke: '#6e6a7a',
	ink: '#14162b',
	denim: '#3a5f8f'
};
const COLORS: Record<string, string> = { ...BANK, ...MORE };
const GREENS = ['leaf', 'moss', 'olive', 'sage', 'emerald', 'jade', 'pine', 'chartreuse'];
const GREENS_ALL = GREENS.concat(['green', 'forest', 'lime', 'teal']);
const BROWNS = ['chocolate', 'cocoa', 'caramel', 'copper', 'bronze', 'coffee', 'rust', 'ochre'];
const LIGHTS = ['ivory', 'beige', 'ice', 'blush', 'peach', 'lemon', 'seafoam', 'white', 'cream'];
const GREYS = ['stone', 'ash', 'charcoal', 'smoke', 'slate', 'steel', 'grey'];
const BRIGHTS = [
	'scarlet',
	'crimson',
	'tangerine',
	'gold',
	'lemon',
	'chartreuse',
	'emerald',
	'jade',
	'aqua',
	'cyan',
	'cerulean',
	'azure',
	'cobalt',
	'iris',
	'orchid',
	'fuchsia',
	'bubblegum',
	'salmon',
	'apricot',
	'turquoise',
	'periwinkle',
	'lavender',
	'mauve',
	'berry',
	'terracotta'
];
const BLOOMS = ['scarlet', 'tangerine', 'gold', 'lemon', 'orchid', 'fuchsia', 'bubblegum', 'iris'];
const BLOOMS_ALL = BLOOMS.concat(['lavender', 'periwinkle', 'salmon', 'white', 'azure']);

/** Lab to '#rrggbb', or null when a screen can't show it. */
function labToHex(L: number, a: number, b: number): string | null {
	const fy = (L + 16) / 116;
	const inv = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
	const x = inv(fy + a / 500) * 0.95047;
	const y = inv(fy);
	const z = inv(fy - b / 200) * 1.08883;
	const lin = [
		3.2406 * x - 1.5372 * y - 0.4986 * z,
		-0.9689 * x + 1.8758 * y + 0.0415 * z,
		0.0557 * x - 0.204 * y + 1.057 * z
	];
	if (lin.some((v) => v < -0.002 || v > 1.002)) return null;
	const gamma = (v: number) =>
		255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
	const [r, g, bl] = lin.map((v) => Math.min(255, Math.max(0, gamma(Math.max(0, v)))));
	return rgbToHex(r, g, bl);
}

/** Colors near `hex`: lightness moved by each of `dLs`, hue turned by `dhs` degrees, chroma times `cs`. */
function around(hex: string, dLs: number[], dhs: number[], cs: number[]): string[] {
	const [L, a, b] = lab(hex);
	const C = Math.hypot(a, b);
	const h = Math.atan2(b, a);
	const out = new Set<string>();
	for (const dL of dLs) {
		for (const dh of dhs) {
			for (const s of cs) {
				const t = h + (dh * Math.PI) / 180;
				const c2 = C * s;
				const x = labToHex(L + dL, c2 * Math.cos(t), c2 * Math.sin(t));
				if (x) out.add(x);
			}
		}
	}
	return [...out];
}

/** The outline's palette key, which `finish` adds around objects. */
const OUTLINE = 'K';

/** How a hatched area repeats its colors, cell by cell. */
type Pattern = 'diag' | 'anti' | 'zig' | 'dots';
const mod = (a: number, n: number) => ((a % n) + n) % n;
/**
 * Which of `n` colors cell (x, y) takes. In 'diag', 'anti' and 'zig' a cell's four
 * sides all take other colors, so every color comes as single cells (with n = 2
 * they are all a checkerboard). 'dots' is mostly color 0, with the rest as spaced
 * dots, one color to a row.
 */
function patternAt(p: Pattern, x: number, y: number, n: number): number {
	switch (p) {
		case 'diag':
			return mod(x + y, n);
		case 'anti':
			return mod(x - y, n);
		case 'zig':
			return mod(x + Math.abs(mod(y, 4) - 2), n);
		case 'dots': {
			const on = mod(y, 2) === 0 && mod(x + (mod(y, 4) === 2 ? 2 : 0), 4) === 0;
			return on && n > 1 ? 1 + mod(Math.floor(y / 2), n - 1) : 0;
		}
	}
}

/**
 * Small detail painted over a finished, outlined picture: spots, specks and hatching.
 * It only uses colors the picture already has, so each island shares its color with
 * a bigger area, and it never paints over the outline. It has its own random numbers,
 * so adding detail doesn't change the picture under it (or its colors and name).
 */
class Detail {
	readonly w: number;
	readonly h: number;
	/** How much detail, 0 (first picture) to 1 (last). */
	readonly amount: number;
	#rng: Rng;
	#art: string[][];
	/** Painted by detail: specks keep clear of it, and nothing paints a cell twice. */
	#touched: Uint8Array;
	/** A band's second tone counts as its first, so one host covers both. */
	#alias: Map<string, string>;
	#used: Set<string>;

	constructor(art: string[], rng: Rng, amount: number, alias: Map<string, string>) {
		this.#art = art.map((row) => [...row]);
		this.h = art.length;
		this.w = art[0].length;
		this.#rng = rng;
		this.amount = amount;
		this.#alias = alias;
		this.#used = new Set(art.join(''));
		this.#touched = new Uint8Array(this.w * this.h);
	}

	rows(): string[] {
		return this.#art.map((row) => row.join(''));
	}
	r(a: number, b: number) {
		return a + this.#rng() * (b - a);
	}
	/** About `lo` at the start of play and `hi` at the end, give or take one. */
	n(lo: number, hi: number) {
		return Math.max(0, Math.round(lo + (hi - lo) * this.amount + this.r(-1, 1)));
	}
	/** Colors in a hatched area: 2 early on, 4 late. */
	get mix() {
		return this.amount < 0.2 ? 2 : this.amount < 0.45 ? 3 : 4;
	}

	/** The color cell (x, y) counts as: a tone or band counts as the color it shades. */
	#host(x: number, y: number) {
		let k = this.#art[y][x];
		while (this.#alias.has(k)) k = this.#alias.get(k)!;
		return k;
	}
	#free(x: number, y: number, hosts: string[], shape?: Shape) {
		return (
			x >= 0 &&
			y >= 0 &&
			x < this.w &&
			y < this.h &&
			!this.#touched[y * this.w + x] &&
			hosts.includes(this.#host(x, y)) &&
			(!shape || inside(shape, x + 0.5, y + 0.5))
		);
	}

	/**
	 * Hatch the `hosts` cells inside `shape`: cell by cell, the first `mix` of `keys`
	 * in `pattern` (null, or the host's own color, keeps the cell as it is). Keys not in
	 * the picture drop out.
	 */
	hatch(
		shape: Shape,
		hosts: (string | undefined)[],
		keys: (string | null | undefined)[],
		pattern: Pattern
	) {
		const ks = keys
			.filter((k): k is string | null => k === null || (!!k && this.#used.has(k)))
			.filter((k, i, all) => all.indexOf(k) === i)
			.slice(0, this.mix);
		if (ks.length < 2) return;
		const hs = hosts.filter((k): k is string => !!k);
		for (let y = 0; y < this.h; y++) {
			for (let x = 0; x < this.w; x++) {
				if (!this.#free(x, y, hs, shape)) continue;
				// The host's own color keeps the cell's tone, so shading shows through.
				const k = ks[patternAt(pattern, x, y, ks.length)];
				if (k !== null && k !== this.#host(x, y)) this.#art[y][x] = k;
				this.#touched[y * this.w + x] = 1;
			}
		}
	}

	/**
	 * Up to `count` single cells, taking turns through `keys`, on `hosts` cells (inside
	 * `shape`, if given). Each lands where none of its four sides has its color and no
	 * other detail is next to it, so each one is a food on its own.
	 */
	specks(
		keys: (string | undefined)[],
		hosts: (string | undefined)[],
		count: number,
		shape?: Shape
	) {
		const ks = keys.filter((k): k is string => !!k && this.#used.has(k));
		const hs = hosts.filter((k): k is string => !!k);
		if (!ks.length || !hs.length || count <= 0) return;
		const spots: [number, number][] = [];
		for (let y = 1; y < this.h - 1; y++) {
			for (let x = 1; x < this.w - 1; x++) if (this.#free(x, y, hs, shape)) spots.push([x, y]);
		}
		for (let i = spots.length - 1; i > 0; i--) {
			const j = Math.floor(this.#rng() * (i + 1));
			[spots[i], spots[j]] = [spots[j], spots[i]];
		}
		let placed = 0;
		for (const [x, y] of spots) {
			if (placed >= count) break;
			let near = false;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) if (this.#touched[(y + dy) * this.w + x + dx]) near = true;
			}
			if (near) continue;
			const sides = [
				this.#art[y][x - 1],
				this.#art[y][x + 1],
				this.#art[y - 1][x],
				this.#art[y + 1][x]
			];
			const k = [...ks.slice(placed % ks.length), ...ks].find(
				(k) => k !== this.#art[y][x] && !sides.includes(k)
			);
			if (!k) continue;
			this.#art[y][x] = k;
			this.#touched[y * this.w + x] = 1;
			placed++;
		}
	}

	/** Paint `key` over the `hosts` cells inside `shape`, like window bars. */
	paint(key: string | undefined, shape: Shape, hosts: (string | undefined)[]) {
		if (!key || !this.#used.has(key)) return;
		const hs = hosts.filter((k): k is string => !!k);
		for (let y = 0; y < this.h; y++) {
			for (let x = 0; x < this.w; x++) {
				if (!this.#free(x, y, hs, shape)) continue;
				this.#art[y][x] = key;
				this.#touched[y * this.w + x] = 1;
			}
		}
	}
}

/** Every palette key a picture can use; the outline's is 'K'. */
const KEYS = 'ABCDEFGHIJLMNOPRSTUVWY';

/** Which way a side faces, in cells. */
type Side = 'lr' | 'ul' | 'r' | 'l' | 'b' | 't';
const SIDES: Record<Side, [number, number]> = {
	lr: [Math.SQRT1_2, Math.SQRT1_2],
	ul: [-Math.SQRT1_2, -Math.SQRT1_2],
	r: [1, 0],
	l: [-1, 0],
	b: [0, 1],
	t: [0, -1]
};

/** How many colors a picture aims for: 7 at the start of play, 12 at the end. */
const colorsFor = (amount: number) => Math.round(7.3 + 4.7 * amount);

/** Where a part goes: a shape, or a test on a cell. */
type Where = Shape | ((x: number, y: number) => boolean);
const test = (where: Where) =>
	typeof where === 'function' ? where : (x: number, y: number) => inside(where, x + 0.5, y + 0.5);
/** Inside any of `shapes`. */
const any =
	(...shapes: Shape[]) =>
	(x: number, y: number) =>
		shapes.some((s) => inside(s, x + 0.5, y + 0.5));
/** Within `w` of the segment from (x0, y0) to (x1, y1), like a stick. */
const line =
	(x0: number, y0: number, x1: number, y1: number, w = 0.6) =>
	(x: number, y: number) => {
		const px = x + 0.5 - x0;
		const py = y + 0.5 - y0;
		const dx = x1 - x0;
		const dy = y1 - y0;
		const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));
		return Math.hypot(px - t * dx, py - t * dy) <= w;
	};

/**
 * New colors for a finished, outlined picture: shading, and parts like clouds, a path
 * or a beak. It runs after the picture is accepted, on its own random numbers, so the
 * shapes, first colors and name stay as they were. Each new color is the one that
 * stands furthest from the colors already in the picture (in delta E), from a family
 * that fits the part. It never paints over the outline, and it stops at `target` colors.
 */
class Extra {
	readonly w: number;
	readonly h: number;
	palette: Record<string, string>;
	/** A tone's base color (and a background band's): Detail treats them as one host. */
	alias: Map<string, string>;
	background: Set<string>;
	#art: string[][];
	#rng: Rng;
	#free: string[];

	constructor(
		art: string[],
		palette: Record<string, string>,
		rng: Rng,
		alias: Map<string, string>,
		background: Set<string>
	) {
		this.#art = art.map((row) => [...row]);
		this.h = art.length;
		this.w = art[0].length;
		this.palette = { ...palette };
		this.#rng = rng;
		this.alias = new Map(alias);
		this.background = background;
		this.#free = [...KEYS].filter((k) => !(k in palette));
	}

	rows(): string[] {
		return this.#art.map((row) => row.join(''));
	}
	r(a: number, b: number) {
		return a + this.#rng() * (b - a);
	}
	#tally() {
		const t = new Map<string, number>();
		for (const row of this.#art) for (const k of row) t.set(k, (t.get(k) ?? 0) + 1);
		return t;
	}
	/** Colors the picture shows now. */
	get size() {
		return this.#tally().size;
	}
	has(k: string | undefined): k is string {
		return !!k && this.#art.some((row) => row.includes(k));
	}
	/** The key at (x, y). */
	at(x: number, y: number) {
		return this.#art[y]?.[x];
	}
	#host(k: string) {
		while (this.alias.has(k)) k = this.alias.get(k)!;
		return k;
	}

	/**
	 * A new key for the color among `cands` that stands furthest from every color in
	 * the picture (capped, with a little chance, so pictures don't all pick alike).
	 * A tone of `base` stays near it: farther than MIN_DELTA, but not by much.
	 */
	#take(cands: string[], base?: string): string | undefined {
		if (!this.#free.length) return;
		const used = [...this.#tally().keys()].map((k) => [k, lab(this.palette[k])] as const);
		const baseLab = base ? lab(this.palette[base]) : null;
		let best: string | undefined;
		let top = -Infinity;
		for (const hex of cands) {
			const c = lab(hex);
			let m = Infinity;
			for (const [k, l] of used) if (k !== base) m = Math.min(m, deltaE(c, l));
			if (m < MIN_DELTA + 2) continue;
			let score = Math.min(m, 44);
			if (baseLab) {
				const db = deltaE(c, baseLab);
				if (db < MIN_DELTA + 2) continue;
				score = Math.min(score, db) - 0.5 * Math.max(0, db - 36);
			}
			score += this.#rng() * 6;
			if (score > top) {
				top = score;
				best = hex;
			}
		}
		if (!best) return;
		const key = this.#free.shift()!;
		this.palette[key] = best;
		if (base) this.alias.set(key, base);
		return key;
	}
	#drop(key: string) {
		delete this.palette[key];
		this.alias.delete(key);
		this.#free.unshift(key);
	}

	/** A darker (-1) or lighter (1) tone of `base`; by default whichever way has more room. */
	tone(base: string, dir?: 1 | -1) {
		const L = lab(this.palette[base])[0];
		const way = dir ?? (L > 55 ? -1 : 1);
		const cands = around(
			this.palette[base],
			[24, 29, 34, 39, 44].map((d) => d * way),
			[-25, -12, 0, 12, 25],
			[0.7, 1, 1.3]
		);
		return this.#take(cands, base);
	}
	/** A new color from the named families (each give or take a little). */
	color(names: string[]) {
		const cands = names.flatMap((n) => around(COLORS[n], [-7, 0, 7], [-10, 0, 10], [0.85, 1.1]));
		return this.#take(cands);
	}

	/**
	 * Paint a new color over the cells inside `where` that count as one of `hosts`
	 * (a tone counts as its base). The color is a tone of `from`, or one of `from`'s
	 * names. Fewer than `min` cells and nothing changes.
	 */
	part(
		from: string | string[] | undefined,
		where: Where,
		hosts: (string | undefined)[],
		min = 3,
		dir?: 1 | -1
	): string | undefined {
		if (!from) return;
		const cells = this.#cells(where, hosts);
		if (cells.length < min) return;
		const key =
			typeof from === 'string'
				? this.has(from)
					? this.tone(from, dir)
					: undefined
				: this.color(from);
		if (!key) return;
		return this.#put(key, cells);
	}

	/** Paint `key`, a color the picture has, like `part` does: for a part that matches another. */
	paint(key: string | undefined, where: Where, hosts: (string | undefined)[]) {
		if (!this.has(key)) return;
		this.#put(key, this.#cells(where, hosts), false);
	}

	/**
	 * About `n` single cells of a new color from `names`, on `hosts` (inside `where`),
	 * none touching another or the outline, like stars or flowers in the grass.
	 */
	sprinkle(names: string[], n: number, hosts: (string | undefined)[], where: Where = () => true) {
		const cells = this.#cells(where, hosts).filter(([x, y]) =>
			[
				[x - 1, y],
				[x + 1, y],
				[x, y - 1],
				[x, y + 1]
			].every(([nx, ny]) => {
				const k = this.at(nx, ny);
				return k !== undefined && k !== OUTLINE;
			})
		);
		for (let i = cells.length - 1; i > 0; i--) {
			const j = Math.floor(this.#rng() * (i + 1));
			[cells[i], cells[j]] = [cells[j], cells[i]];
		}
		const picked: [number, number][] = [];
		for (const [x, y] of cells) {
			if (picked.length >= n) break;
			if (picked.some(([px, py]) => Math.abs(px - x) <= 2 && Math.abs(py - y) <= 2)) continue;
			picked.push([x, y]);
		}
		if (picked.length < Math.min(n, 3)) return;
		const key = this.color(names);
		if (key) return this.#put(key, picked);
	}

	/** Cells inside `where` that count as one of `hosts`, never the outline. */
	#cells(where: Where, hosts: (string | undefined)[]) {
		const hs = new Set(hosts.filter((k): k is string => !!k));
		const inWhere = test(where);
		const cells: [number, number][] = [];
		for (let y = 0; y < this.h; y++) {
			for (let x = 0; x < this.w; x++) {
				const k = this.#art[y][x];
				if (k !== OUTLINE && hs.has(this.#host(k)) && inWhere(x, y)) cells.push([x, y]);
			}
		}
		return cells;
	}

	/** Paint `key` on `cells`, unless that paints out a color entirely; then undo it. */
	#put(key: string, cells: [number, number][], fresh = true) {
		const was = cells.map(([x, y]) => this.#art[y][x]);
		for (const [x, y] of cells) this.#art[y][x] = key;
		// A color it painted out entirely would be lost: put it back.
		const left = this.#tally();
		if (was.some((k) => !left.has(k))) {
			cells.forEach(([x, y], i) => (this.#art[y][x] = was[i]));
			if (fresh) this.#drop(key);
			return;
		}
		return key;
	}

	/**
	 * Move each first color a little (same hue family, within delta E 12), at random,
	 * so the same named color doesn't repeat exactly from picture to picture. A move
	 * never brings a color closer to another than it was or than 34, whichever is less.
	 */
	vary() {
		const keys = Object.keys(this.palette).filter((k) => k !== OUTLINE);
		for (let i = keys.length - 1; i > 0; i--) {
			const j = Math.floor(this.#rng() * (i + 1));
			[keys[i], keys[j]] = [keys[j], keys[i]];
		}
		for (const k of keys) {
			if (this.#rng() < 0.25) continue;
			const was = lab(this.palette[k]);
			const others = Object.keys(this.palette)
				.filter((o) => o !== k)
				.map((o) => lab(this.palette[o]));
			const room = (c: ReturnType<typeof lab>) => Math.min(...others.map((o) => deltaE(c, o)));
			const floor = Math.min(room(was), 34);
			const ok = around(this.palette[k], [-6, 0, 6], [-12, -6, 0, 6, 12], [0.85, 1, 1.15]).filter(
				(hex) => {
					const c = lab(hex);
					const d = deltaE(c, was);
					return d >= 3 && d <= 12 && room(c) >= floor;
				}
			);
			if (ok.length) this.palette[k] = ok[Math.floor(this.#rng() * ok.length)];
		}
	}

	/** Each 4-way connected run of exactly `key`, as cell lists, biggest first. */
	#runs(key: string) {
		const seen = new Uint8Array(this.w * this.h);
		const runs: [number, number][][] = [];
		for (let y0 = 0; y0 < this.h; y0++) {
			for (let x0 = 0; x0 < this.w; x0++) {
				if (seen[y0 * this.w + x0] || this.#art[y0][x0] !== key) continue;
				const run: [number, number][] = [[x0, y0]];
				seen[y0 * this.w + x0] = 1;
				for (let i = 0; i < run.length; i++) {
					const [x, y] = run[i];
					for (const [nx, ny] of [
						[x - 1, y],
						[x + 1, y],
						[x, y - 1],
						[x, y + 1]
					]) {
						if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) continue;
						if (seen[ny * this.w + nx] || this.#art[ny][nx] !== key) continue;
						seen[ny * this.w + nx] = 1;
						run.push([nx, ny]);
					}
				}
				runs.push(run);
			}
		}
		return runs.sort((a, b) => b.length - a.length);
	}

	/**
	 * Shade each big run of `base` on its `side`: the `frac` of its cells farthest from
	 * a light on the other side, so a round part gets a crescent. A tone a little
	 * darker by default; `glint` puts a lighter tone near the light instead.
	 */
	shade(base: string | undefined, side: Side = 'lr', frac = 0.3, dir: 1 | -1 = -1, min = 10) {
		if (!base || !this.has(base) || base === OUTLINE) return;
		const runs = this.#runs(base).filter((r) => r.length >= min);
		if (!runs.length) return;
		const key = this.tone(base, dir);
		if (!key) return;
		this.#light(runs, key, side, frac, false);
		return key;
	}
	/** A lighter spot on each big run of `base`, toward `side`. */
	glint(base: string | undefined, side: Side = 'ul', frac = 0.18, min = 14) {
		if (!base || !this.has(base) || base === OUTLINE) return;
		const runs = this.#runs(base).filter((r) => r.length >= min);
		if (!runs.length) return;
		const key = this.tone(base, 1) ?? this.tone(base, -1);
		if (!key) return;
		this.#light(runs, key, side, frac, true);
		return key;
	}
	#light(runs: [number, number][][], key: string, side: Side, frac: number, near: boolean) {
		const [dx, dy] = SIDES[side];
		for (const run of runs) {
			const cx = run.reduce((s, [x]) => s + x, 0) / run.length;
			const cy = run.reduce((s, [, y]) => s + y, 0) / run.length;
			const R = Math.sqrt(run.length / Math.PI);
			// The light sits off the shaded side; a glint sits on its own side.
			const lx = near ? cx + dx * R * 0.45 : cx - dx * R * 0.7;
			const ly = near ? cy + dy * R * 0.45 : cy - dy * R * 0.7;
			const d = (x: number, y: number) => Math.hypot(x - lx, y - ly);
			const order = run.slice().sort((a, b) => (near ? 1 : -1) * (d(a[0], a[1]) - d(b[0], b[1])));
			const n = Math.max(1, Math.min(run.length - 1, Math.round(run.length * frac)));
			for (const [x, y] of order.slice(0, n)) this.#art[y][x] = key;
		}
	}

	/** The colors parts may sit on: everything but the outline and tones. */
	#parts() {
		const t = this.#tally();
		return [...t.keys()]
			.filter((k) => k !== OUTLINE && !this.alias.has(k))
			.sort((a, b) => t.get(b)! - t.get(a)!);
	}

	/**
	 * Run a template's steps in order, then plain shading, until the picture has
	 * `target` colors. A step that finds no color far enough from the rest does nothing.
	 */
	run(steps: ((e: Extra) => void)[], target: number) {
		this.vary();
		for (const step of steps) {
			if (this.size >= target) return;
			step(this);
		}
		for (const k of this.#parts()) {
			if (this.size >= target) return;
			if (this.background.has(k)) continue;
			this.shade(k);
		}
		for (const k of this.#parts()) {
			if (this.size >= target) return;
			if (!this.background.has(k)) continue;
			// A background gets a band at the top, or at the bottom for ground.
			const rows = this.#art.map((row) => row.filter((c) => this.#host(c) === k).length);
			const mid =
				rows.reduce((s, n, y) => s + n * y, 0) /
				Math.max(
					1,
					rows.reduce((s, n) => s + n, 0)
				);
			const top = mid < this.h / 2;
			const cut = this.h * (top ? 0.16 : 0.88);
			this.part(k, ['rect', 0, top ? 0 : cut, this.w, top ? cut : this.h], [k], 6);
		}
		for (const k of this.#parts()) {
			if (this.size >= target) return;
			if (!this.background.has(k)) this.glint(k);
		}
		// Last, flecks of a new color on the background, like stars or petals.
		const bg = this.#parts().find((k) => this.background.has(k));
		while (bg && this.size < target && this.sprinkle(LIGHTS.concat(BRIGHTS), 5, [bg]));
	}
}

/** What a template draws with. */
class Canvas {
	w: number;
	h: number;
	rng: Rng;
	draw: [string, Shape][] = [];
	base = 'A';
	background = new Set<string>();
	#used = new Map<string, string>(); // key -> hex
	#names = new Map<string, string>(); // key -> bank name
	#detailRng: Rng;
	#amount: number;
	#later: ((d: Detail) => void)[] = [];
	#extraRng: Rng;
	#more: ((e: Extra) => void)[] = [];
	/** How many colors to aim for; by default from `amount` (see colorsFor). */
	colors?: number;

	/**
	 * `amount` (0 to 1, by place in play) sets how many colors and how much detail;
	 * `detailRng` and `extraRng` are their own random numbers.
	 */
	constructor(w: number, h: number, rng: Rng, detailRng: Rng, amount: number, extraRng: Rng) {
		this.w = w;
		this.h = h;
		this.rng = rng;
		this.#detailRng = detailRng;
		this.#amount = amount;
		this.#extraRng = extraRng;
	}

	/**
	 * A step that adds a color once the picture is outlined (see Extra), tried in
	 * order until the picture has enough. Like `later`, it runs on its own random
	 * numbers and leaves the shapes, first colors and name as they were.
	 */
	more(fn: (e: Extra) => void) {
		this.#more.push(fn);
	}

	/**
	 * Detail to paint once the picture is outlined: islands of its colors. It runs on
	 * its own random numbers (use the Detail's, never this canvas's), so it leaves the
	 * shapes, colors and name above it as they were.
	 */
	later(fn: (d: Detail) => void) {
		this.#later.push(fn);
	}

	/** A random number in [a, b). */
	r(a: number, b: number) {
		return a + this.rng() * (b - a);
	}
	ri(a: number, b: number) {
		return Math.floor(this.r(a, b + 1));
	}

	/**
	 * A palette key for a color from `names` that stands apart from the colors
	 * already chosen. `bg` marks it as background, which objects get outlined against.
	 */
	color(names: string[], bg = false): string {
		const order = [...names].sort(() => this.rng() - 0.5);
		const taken = new Set(this.#names.values());
		for (const name of [...order, ...ANY]) {
			if (taken.has(name)) continue;
			const hex = BANK[name];
			const trial = Object.fromEntries([...this.#used, ['?', hex]]);
			if (closePairs(trial, undefined, MIN_DELTA + 2).length) continue;
			const key = KEYS[this.#used.size];
			this.#used.set(key, hex);
			this.#names.set(key, name);
			if (bg) this.background.add(key);
			return key;
		}
		throw new Error('ran out of distinct colors');
	}

	nameOf(key: string) {
		return this.#names.get(key) ?? '';
	}

	fill(key: string) {
		this.base = key;
	}
	add(key: string, shape: Shape) {
		this.draw.push([key, shape]);
	}

	/**
	 * The picture: rows of letters with a 1-pixel outline around everything that isn't
	 * background, then its added colors (Extra) and detail (Detail). Null when it makes a
	 * poor level: too few colors, one color most of the picture, or colors too alike.
	 */
	finish(id: string, name: string): Picture | null {
		let art = rasterize({ w: this.w, h: this.h, base: this.base, draw: this.draw });
		// A background that's most of the picture is split into bands of two tones.
		const tally = (rows: string[]) => {
			const t: Record<string, number> = {};
			for (const ch of rows.join('')) t[ch] = (t[ch] || 0) + 1;
			return t;
		};
		const first = tally(art);
		const big = Object.keys(first).sort((a, b) => first[b] - first[a])[0];
		const alias = new Map<string, string>();
		if (this.background.has(big) && first[big] > this.w * this.h * 0.4) {
			let second: string;
			try {
				second = this.color(SKY.concat(GROUND, ['lilac', 'rose', 'mint', 'sand']), true);
			} catch {
				return null;
			}
			alias.set(second, big);
			const bands = this.ri(1, 2);
			const band = this.h / (bands * 2);
			art = art.map((row, y) => (Math.floor(y / band) % 2 ? row.replaceAll(big, second) : row));
		}
		const used = new Set(art.join(''));
		const colors = Object.fromEntries([...this.#used].filter(([k]) => used.has(k)));
		const hex = OUTLINES.find((h) => !closePairs({ ...colors, '?': h }).length);
		if (!hex) return null;
		const { w, h } = this;
		const isBg = (x: number, y: number) =>
			x < 0 || y < 0 || x >= w || y >= h || this.background.has(art[y][x]);
		const out = art.map((row, y) =>
			[...row]
				.map((ch, x) =>
					!this.background.has(ch) &&
					(isBg(x - 1, y) || isBg(x + 1, y) || isBg(x, y - 1) || isBg(x, y + 1))
						? OUTLINE
						: ch
				)
				.join('')
		);
		const palette: Record<string, string> = {};
		for (const k of new Set(out.join(''))) palette[k] = k === OUTLINE ? hex : colors[k];
		// Too few colors, or one color is most of the picture: skip it.
		const counts = tally(out);
		const total = w * h;
		if (Object.keys(palette).length < 4) return null;
		if (Math.max(...Object.values(counts)) > total * 0.55) return null;
		if (closePairs(palette).length) return null;
		// New colors next, then detail, which only reuses colors the picture has.
		const e = new Extra(out, palette, this.#extraRng, alias, this.background);
		e.run(this.#more, this.colors ?? colorsFor(this.#amount));
		const d = new Detail(e.rows(), this.#detailRng, this.#amount, e.alias);
		for (const fn of this.#later) fn(d);
		const rows = d.rows();
		const final: Record<string, string> = {};
		for (const k of new Set(rows.join(''))) final[k] = e.palette[k];
		const close = closePairs(final);
		if (close.length) throw new Error(`${id}: ${close[0].a} and ${close[0].b} look alike`);
		return { id, name, palette: final, art: rows };
	}
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

type Template = (c: Canvas) => string;

/** Each template draws onto the canvas and returns the picture's name. */
const TEMPLATES: Record<string, Template> = {
	target(c) {
		const bg = c.color(SKY, true);
		c.fill(bg);
		const cx = c.w / 2;
		const cy = c.h / 2;
		const rings = c.ri(3, 5);
		const r = Math.min(c.w, c.h) / 2 - 1.5;
		const keys = Array.from({ length: rings }, () => c.color(ANY));
		for (let k = 0; k < rings; k++) c.add(keys[k], ['circle', cx, cy, r - (k * r) / rings]);
		const ring = (k: number): Shape => [
			'and',
			['circle', cx, cy, r - (k * r) / rings],
			['not', ['circle', cx, cy, r - ((k + 1) * r) / rings]]
		];
		// New colors: a shaded rim, a vignette, a bullseye, then each ring shaded.
		let rim: string | undefined;
		c.more((e) => (rim = e.shade(keys[0], 'lr', 0.4)));
		c.more((e) => e.part(bg, ['not', ['circle', cx, cy, r + 2.5]], [bg], 6));
		c.more((e) =>
			e.part(BRIGHTS, ['circle', cx, cy, Math.max(1.3, r / rings / 2)], [keys[rings - 1]])
		);
		for (let k = 1; k < rings; k++) c.more((e) => e.shade(keys[k], 'lr', 0.4));
		c.later((d) => {
			// A patterned ring, then flecks of each ring's color in its neighbors.
			if (d.amount > 0.15)
				d.hatch(ring(1), [keys[1]], [keys[1], keys[0], keys[2], rim ?? OUTLINE], 'zig');
			if (d.amount > 0.6)
				d.hatch(
					ring(rings - 2),
					[keys[rings - 2]],
					[keys[rings - 2], keys[rings - 1], keys[0], OUTLINE],
					'anti'
				);
			for (let k = 0; k < rings; k++) {
				d.specks([keys[(k + 1) % rings], keys[(k + 2) % rings]], [keys[k]], d.n(1, 5));
			}
			d.specks([keys[0]], [bg], d.n(0, 8));
		});
		return `${cap(c.nameOf(keys[0]))} Target`;
	},
	gem(c) {
		const bg = c.color(['night', 'dusk', 'navy', 'plum', 'sky', 'cream'], true);
		c.fill(bg);
		const cx = c.w / 2;
		const cy = c.h / 2;
		const a = c.color(COOL.concat(['pink', 'red']));
		const b = c.color(['white', 'lilac', 'mint', 'sky']);
		const inner = c.color(WARM);
		const rx = c.w / 2 - 1.5;
		const ry = c.h / 2 - 1.5;
		c.add(a, [
			'poly',
			[
				[cx, cy - ry],
				[cx + rx, cy - ry * 0.25],
				[cx, cy + ry],
				[cx - rx, cy - ry * 0.25]
			]
		]);
		c.add(inner, [
			'poly',
			[
				[cx, cy - ry * 0.5],
				[cx + rx * 0.5, cy - ry * 0.1],
				[cx, cy + ry * 0.55],
				[cx - rx * 0.5, cy - ry * 0.1]
			]
		]);
		c.add(b, [
			'poly',
			[
				[cx - rx * 0.55, cy - ry * 0.45],
				[cx - rx * 0.25, cy - ry * 0.65],
				[cx - rx * 0.15, cy - ry * 0.4]
			]
		]);
		let star: string | undefined;
		if (c.rng() < 0.6) {
			star = c.color(['yellow', 'white', 'cream']);
			for (let k = 0; k < 4; k++) c.add(star, ['circle', c.r(2, c.w - 2), c.r(2, 6), 0.8]);
		}
		// New colors: light and shadow facets, a shaded heart, sparkles.
		let facet: string | undefined;
		const ledge = cy - ry * 0.25;
		c.more(
			(e) =>
				(facet = e.part(
					a,
					[
						'poly',
						[
							[cx + rx, ledge],
							[cx, cy + ry],
							[cx, ledge]
						]
					],
					[a],
					4,
					-1
				))
		);
		c.more((e) =>
			e.part(
				a,
				[
					'poly',
					[
						[cx, cy - ry],
						[cx - rx, ledge],
						[cx, ledge]
					]
				],
				[a],
				4,
				1
			)
		);
		c.more((e) => e.shade(inner, 'lr', 0.4));
		c.more((e) => e.sprinkle(LIGHTS.concat(['gold', 'lemon', 'aqua']), 7, [bg]));
		c.later((d) => {
			// Facets: the heart of the stone sparkles in its colors; glints in the rest.
			const heart: Shape = ['ellipse', cx, cy + ry * 0.05, rx * 0.32, ry * 0.4];
			if (d.amount > 0.2) d.hatch(heart, [inner], [inner, a, b, facet ?? OUTLINE], 'diag');
			if (d.amount > 0.55) {
				d.hatch(
					['and', ['rect', 0, cy + ry * 0.3, c.w, c.h], ['not', heart]],
					[a],
					[a, b, inner, null],
					'zig'
				);
			}
			d.specks([b, inner], [a], d.n(2, 12));
			d.specks([a, b, OUTLINE], [inner], d.n(1, 6));
			d.specks([star ?? b], [bg], d.n(1, 12));
		});
		return `${cap(c.nameOf(a))} Gem`;
	},
	flower(c) {
		const sky = c.color(SKY, true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.78, c.w, c.h]);
		const stem = c.color(['green', 'forest', 'lime']);
		const petal = c.color(WARM.concat(['violet', 'lilac', 'rose']));
		const middle = c.color(['yellow', 'amber', 'brown', 'orange']);
		const cx = c.w / 2 + c.r(-2, 2);
		const cy = c.h * 0.38;
		const pr = c.w * c.r(0.11, 0.14);
		c.add(stem, ['rect', cx - 1, cy, 2.2, c.h]);
		c.add(stem, ['ellipse', cx + 4, c.h * 0.66, 4, 1.8]);
		c.add(stem, ['ellipse', cx - 4, c.h * 0.56, 4, 1.8]);
		const petals = c.ri(5, 8);
		for (let k = 0; k < petals; k++) {
			const t = (k / petals) * Math.PI * 2;
			c.add(petal, ['circle', cx + Math.cos(t) * pr * 1.3, cy + Math.sin(t) * pr * 1.3, pr]);
		}
		c.add(middle, ['circle', cx, cy, pr * 0.95]);
		let sun: string | undefined;
		if (c.rng() < 0.5) {
			sun = c.color(['yellow', 'orange', 'white']);
			c.add(sun, ['circle', c.w * 0.85, c.h * 0.12, 2.6]);
		}
		// New colors: shaded petals and leaves, darker soil, a cloud, a deeper sky, wildflowers.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(petal, 'lr', 0.3)));
		c.more((e) => e.shade(stem, 'r', 0.4, -1, 6));
		c.more((e) => e.part(ground, ['rect', 0, c.h * 0.9, c.w, c.h], [ground], 6, -1));
		c.more((e) => {
			const x = sun ? c.w * e.r(0.15, 0.35) : c.w * e.r(0.65, 0.85);
			const y = c.h * e.r(0.1, 0.18);
			e.part(LIGHTS, any(['ellipse', x, y, 4, 1.6], ['circle', x + 1, y - 1, 1.8]), [sky], 6);
		});
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.14], [sky], 6));
		c.more((e) => e.shade(middle, 'lr', 0.35, -1, 6));
		c.more((e) => e.sprinkle(BLOOMS_ALL, 6, [ground]));
		c.later((d) => {
			// Seeds in the middle, pollen on the petals, grass and flowers in the ground.
			if (d.amount > 0.1)
				d.hatch(['circle', cx, cy, pr * 0.95], [middle], [null, OUTLINE, petal, stem], 'dots');
			d.specks([OUTLINE, petal], [middle], d.n(1, 4));
			d.specks([middle, sky], [petal], d.n(1, 10));
			d.specks([sky], [stem], d.n(0, 4));
			if (d.amount > 0.25) {
				d.hatch(
					['rect', 0, c.h * 0.78, c.w, 3],
					[ground],
					[ground, stem, petal, shadow ?? middle],
					'zig'
				);
			}
			d.specks([petal, middle, stem, sun], [ground], d.n(1, 10));
			d.specks([petal], [sky], d.n(0, 6));
		});
		return `${cap(c.nameOf(petal))} Flower`;
	},
	mushroom(c) {
		const sky = c.color(SKY, true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.8, c.w, c.h]);
		const capk = c.color(['red', 'orange', 'violet', 'blue', 'magenta', 'brown']);
		const spot = c.color(['white', 'cream', 'yellow']);
		const stalk = c.color(['tan', 'cream', 'sand']);
		const cx = c.w / 2;
		const capY = c.h * 0.42;
		const rx = c.w * c.r(0.38, 0.45);
		c.add(stalk, ['rect', cx - rx * 0.3, capY, rx * 0.6, c.h * 0.45]);
		c.add(capk, ['and', ['ellipse', cx, capY, rx, c.h * 0.3], ['rect', 0, 0, c.w, capY + 1]]);
		const spots = c.ri(3, 6);
		for (let k = 0; k < spots; k++) {
			c.add(spot, [
				'circle',
				cx + c.r(-rx * 0.7, rx * 0.7),
				capY - c.r(1.5, c.h * 0.22),
				c.r(1.2, 2.4)
			]);
		}
		let small: string | undefined;
		if (c.rng() < 0.5) {
			small = c.color(['orange', 'pink', 'lilac', 'yellow']);
			const sx = c.rng() < 0.5 ? c.w * 0.16 : c.w * 0.84;
			c.add(stalk, ['rect', sx - 1, c.h * 0.7, 2.4, c.h * 0.15]);
			c.add(small, ['and', ['ellipse', sx, c.h * 0.71, 3.6, 3], ['rect', 0, 0, c.w, c.h * 0.72]]);
		}
		// New colors: shading on the cap and stalk, darker soil, a deeper sky, grass, flowers.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(capk, 'lr', 0.3)));
		c.more((e) => e.shade(stalk, 'r', 0.35, -1, 6));
		c.more((e) => e.part(ground, ['rect', 0, c.h * 0.9, c.w, c.h], [ground], 6, -1));
		c.more((e) => {
			const y = Math.floor(c.h * 0.8);
			const off = Math.floor(e.r(0, 3));
			e.part(GREENS_ALL, (x, yy) => yy === y - 1 && (x + off) % 3 === 0, [sky], 3);
		});
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.14], [sky], 6));
		c.more((e) => e.sprinkle(BLOOMS_ALL, 5, [ground]));
		c.more((e) => e.glint(capk));
		c.later((d) => {
			// Little spots between the big ones, gills under the cap, grass and pebbles.
			d.specks([spot, stalk], [capk], d.n(2, 12));
			if (d.amount > 0.2) {
				d.hatch(['rect', 0, capY + 0.5, c.w, 2.5], [stalk], [stalk, OUTLINE, capk, spot], 'anti');
			}
			d.specks([OUTLINE, capk], [stalk], d.n(0, 6));
			d.specks([capk, stalk], [spot], d.n(0, 3));
			d.specks([spot, capk], [small], d.n(0, 3));
			if (d.amount > 0.3) {
				d.hatch(
					['rect', 0, c.h * 0.8, c.w, 3],
					[ground],
					[ground, small ?? stalk, capk, shadow ?? spot],
					'zig'
				);
			}
			d.specks([spot, stalk, capk, small], [ground], d.n(1, 10));
			d.specks([spot], [sky], d.n(0, 8));
		});
		return `${cap(c.nameOf(capk))} Mushroom`;
	},
	house(c) {
		const sky = c.color(SKY, true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.8, c.w, c.h]);
		const wall = c.color(['cream', 'tan', 'sand', 'rose', 'mint', 'white', 'sky']);
		const roof = c.color(['red', 'brown', 'navy', 'plum', 'indigo', 'coral']);
		const door = c.color(['brown', 'blue', 'green', 'red', 'violet']);
		const glass = c.color(['yellow', 'sky', 'amber']);
		const x0 = c.w * c.r(0.18, 0.26);
		const x1 = c.w - x0;
		const top = c.h * 0.45;
		const bottom = c.h * 0.82;
		c.add(wall, ['rect', x0, top, x1 - x0, bottom - top]);
		c.add(roof, [
			'poly',
			[
				[x0 - 2, top + 0.5],
				[c.w / 2, c.h * 0.14],
				[x1 + 2, top + 0.5]
			]
		]);
		c.add(door, ['rect', c.w / 2 - 2, bottom - c.h * 0.2, 4, c.h * 0.2]);
		c.add(glass, ['rect', x0 + 2, top + 2.5, 4, 3.5]);
		c.add(glass, ['rect', x1 - 6, top + 2.5, 4, 3.5]);
		let chim: string | undefined;
		let sun: string | undefined;
		if (c.rng() < 0.6) {
			chim = c.color(['brown', 'grey', 'red']);
			c.add(chim, ['rect', x1 - 6, c.h * 0.18, 3, c.h * 0.14]);
		}
		if (c.rng() < 0.6) {
			sun = c.color(['yellow', 'orange', 'white']);
			c.add(sun, ['circle', c.w * 0.12, c.h * 0.12, 2.8]);
		}
		// New colors: a shaded side wall and roof, a path, a cloud, a shaded door, flowers.
		let side: string | undefined;
		c.more(
			(e) => (side = e.part(wall, ['rect', x1 - (x1 - x0) * 0.25, 0, c.w, c.h], [wall], 4, -1))
		);
		c.more((e) => e.shade(roof, 'r', 0.4));
		c.more((e) =>
			e.part(
				['stone', 'ash', 'beige', 'khaki', 'sand', 'tan', 'terracotta'],
				[
					'poly',
					[
						[c.w / 2 - 2, bottom],
						[c.w / 2 + 2, bottom],
						[c.w / 2 + 5, c.h],
						[c.w / 2 - 5, c.h]
					]
				],
				[ground],
				4
			)
		);
		c.more((e) => {
			const x = c.w * (sun ? e.r(0.6, 0.85) : e.r(0.12, 0.3));
			const y = c.h * e.r(0.07, 0.14);
			e.part(LIGHTS, any(['ellipse', x, y, 3.6, 1.5], ['circle', x - 1, y - 1, 1.6]), [sky], 5);
		});
		c.more((e) => e.shade(door, 'r', 0.4, -1, 6));
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.08], [sky], 6));
		c.more((e) => e.sprinkle(BLOOMS_ALL, 5, [ground]));
		c.more((e) => e.part(ground, ['rect', 0, c.h * 0.94, c.w, c.h], [ground], 6, -1));
		c.later((d) => {
			// Window bars split each window into small panes.
			for (const wx of [x0 + 2, x1 - 6]) {
				d.paint(OUTLINE, ['rect', Math.floor(wx + 2) - 0.01, 0, 1, c.h], [glass]);
				d.paint(OUTLINE, ['rect', 0, Math.floor(top + 4.25) - 0.01, c.w, 1], [glass]);
			}
			// Bricks and shingles, a door knob, flowers in the grass, birds.
			if (d.amount > 0.15)
				d.hatch(['rect', 0, 0, c.w, c.h], [wall], [null, roof, OUTLINE, door], 'dots');
			else d.specks([roof, OUTLINE], [wall], d.n(2, 6));
			if (d.amount > 0.4) {
				d.hatch(
					['rect', 0, c.h * 0.3, c.w, top - c.h * 0.3],
					[roof],
					[roof, wall, side ?? OUTLINE, chim ?? door],
					'zig'
				);
			} else d.specks([wall, OUTLINE], [roof], d.n(1, 8));
			d.specks([glass], [door], 1);
			d.specks([OUTLINE, roof], [chim], d.n(0, 3));
			d.specks([roof, glass, door, wall, sun], [ground], d.n(2, 14));
			d.specks([OUTLINE], [sky], d.n(0, 4));
		});
		return `${cap(c.nameOf(wall))} House`;
	},
	tree(c) {
		const sky = c.color(SKY, true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['ellipse', c.w / 2, c.h * 1.05, c.w * 0.8, c.h * 0.22]);
		const trunk = c.color(['brown', 'tan', 'plum']);
		const leaves = c.color(['green', 'forest', 'lime', 'teal', 'orange', 'pink']);
		const fruit = c.color(['red', 'yellow', 'orange', 'violet', 'white']);
		const cx = c.w / 2;
		c.add(trunk, [
			'poly',
			[
				[cx - 2.5, c.h * 0.88],
				[cx + 2.5, c.h * 0.88],
				[cx + 1.5, c.h * 0.5],
				[cx - 1.5, c.h * 0.5]
			]
		]);
		const blobs = c.ri(4, 6);
		for (let k = 0; k < blobs; k++) {
			const t = (k / blobs) * Math.PI * 2;
			c.add(leaves, [
				'circle',
				cx + Math.cos(t) * c.w * 0.18,
				c.h * 0.34 + Math.sin(t) * c.h * 0.12,
				c.w * c.r(0.15, 0.2)
			]);
		}
		c.add(leaves, ['circle', cx, c.h * 0.34, c.w * 0.2]);
		const fruits = c.ri(4, 8);
		for (let k = 0; k < fruits; k++) {
			c.add(fruit, [
				'circle',
				cx + c.r(-c.w * 0.28, c.w * 0.28),
				c.h * 0.34 + c.r(-c.h * 0.16, c.h * 0.16),
				1.2
			]);
		}
		// New colors: shaded leaves and bark, hills behind, a sunlit edge, soil, sky, a cloud.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(leaves, 'lr', 0.3)));
		c.more((e) => e.shade(trunk, 'r', 0.45, -1, 6));
		c.more((e) =>
			e.part(
				GREENS_ALL.concat(['sage', 'khaki', 'lavender', 'periwinkle']),
				any(
					['ellipse', c.w * 0.12, c.h * 0.86, c.w * 0.32, c.h * 0.2],
					['ellipse', c.w * 0.92, c.h * 0.88, c.w * 0.28, c.h * 0.16]
				),
				[sky],
				8
			)
		);
		c.more((e) => e.glint(leaves, 'ul', 0.12));
		c.more((e) => e.part(ground, ['rect', 0, c.h * 0.94, c.w, c.h], [ground], 6, -1));
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.08], [sky], 6));
		c.more((e) => e.sprinkle(BLOOMS_ALL, 5, [ground]));
		c.later((d) => {
			// Small fruit and sky showing through the leaves, bark, grass, fallen fruit.
			d.specks([fruit, sky], [leaves], d.n(3, 18));
			if (d.amount > 0.3) {
				d.hatch(
					['circle', cx, c.h * 0.34, c.w * 0.14],
					[leaves],
					[leaves, fruit, shadow ?? sky, OUTLINE],
					'zig'
				);
			}
			if (d.amount > 0.15)
				d.hatch(['rect', 0, 0, c.w, c.h], [trunk], [trunk, OUTLINE, leaves, fruit], 'anti');
			else d.specks([OUTLINE], [trunk], d.n(1, 4));
			if (d.amount > 0.25) {
				d.hatch(['rect', 0, c.h * 0.86, c.w, 3], [ground], [ground, leaves, fruit, trunk], 'zig');
			}
			d.specks([fruit, leaves, trunk], [ground], d.n(1, 10));
		});
		return `${cap(c.nameOf(fruit))} Fruit Tree`;
	},
	fish(c) {
		const water = c.color(['sky', 'teal', 'blue', 'navy', 'mint'], true);
		const sand = c.color(['sand', 'tan', 'cream'], true);
		c.fill(water);
		c.add(sand, ['ellipse', c.w / 2, c.h * 1.1, c.w * 0.9, c.h * 0.22]);
		const body = c.color(WARM.concat(['violet', 'lime']));
		const stripe = c.color(['white', 'cream', 'navy', 'yellow']);
		const fin = c.color(WARM.concat(COOL));
		const cx = c.w * 0.45;
		const cy = c.h * 0.45;
		const rx = c.w * 0.3;
		const ry = c.h * 0.2;
		c.add(fin, [
			'poly',
			[
				[cx + rx * 0.8, cy],
				[c.w - 1.5, cy - ry * 1.1],
				[c.w - 1.5, cy + ry * 1.1]
			]
		]);
		c.add(fin, [
			'poly',
			[
				[cx - rx * 0.2, cy - ry * 0.8],
				[cx + rx * 0.3, cy - ry * 1.7],
				[cx + rx * 0.5, cy - ry * 0.7]
			]
		]);
		c.add(body, ['ellipse', cx, cy, rx, ry]);
		const stripes = c.ri(1, 3);
		for (let k = 0; k < stripes; k++) {
			c.add(stripe, [
				'and',
				['ellipse', cx, cy, rx, ry],
				['rect', cx - rx * 0.5 + k * rx * 0.45, 0, 1.6, c.h]
			]);
		}
		const eye = c.color(['white', 'cream']);
		c.add(eye, ['circle', cx - rx * 0.6, cy - ry * 0.25, 1.4]);
		const weed = c.color(['green', 'forest', 'lime']);
		for (let k = 0; k < 3; k++)
			c.add(weed, ['ellipse', c.r(2, c.w - 2), c.h * 0.95, 1.1, c.h * 0.1]);
		// New colors: a dark back and light belly, deep and shallow water, fins, bubbles.
		let back: string | undefined;
		c.more((e) => (back = e.shade(body, 't', 0.3)));
		c.more((e) => e.part(water, ['rect', 0, c.h * 0.72, c.w, c.h], [water], 6, -1));
		c.more((e) => e.shade(body, 'b', 0.22, 1));
		c.more((e) => e.shade(fin, 'lr', 0.35, -1, 6));
		c.more((e) =>
			e.sprinkle(['ice', 'white', 'seafoam', 'aqua', 'ivory', 'periwinkle'], 6, [water])
		);
		c.more((e) => e.part(water, ['rect', 0, 0, c.w, c.h * 0.1], [water], 6, 1));
		c.more((e) => e.part(sand, ['rect', 0, c.h * 0.95, c.w, c.h], [sand], 4, -1));
		c.later((d) => {
			// Scales toward the tail, a pupil, fin rays, bubbles, pebbles in the sand.
			d.specks([OUTLINE], [eye], 1);
			if (d.amount > 0.12) {
				d.hatch(
					['and', ['ellipse', cx, cy, rx - 1, ry - 1], ['rect', cx - rx * 0.25, 0, c.w, c.h]],
					[body],
					[body, stripe, back ?? fin, OUTLINE],
					'zig'
				);
			}
			d.specks([stripe, fin], [body], d.n(2, 10));
			d.specks([body, OUTLINE], [stripe], d.n(0, 4));
			if (d.amount > 0.45)
				d.hatch(['rect', cx + rx * 0.95, 0, c.w, c.h], [fin], [fin, body, stripe], 'anti');
			else d.specks([body, stripe], [fin], d.n(1, 6));
			d.specks([eye], [water], d.n(2, 14));
			d.specks([body, weed, fin, OUTLINE], [sand], d.n(1, 10));
		});
		return `${cap(c.nameOf(body))} Fish`;
	},
	planet(c) {
		const space = c.color(['night', 'navy', 'plum', 'dusk', 'indigo'], true);
		c.fill(space);
		const star = c.color(['white', 'yellow', 'cream']);
		for (let k = 0; k < 9; k++) c.add(star, ['circle', c.r(1, c.w - 1), c.r(1, c.h - 1), 0.7]);
		const body = c.color(WARM.concat(['teal', 'sky', 'lime', 'violet']));
		const band = c.color(ANY);
		const ringk = c.color(['sand', 'tan', 'cream', 'lilac', 'mint', 'rose']);
		const cx = c.w / 2;
		const cy = c.h / 2;
		const r = Math.min(c.w, c.h) * c.r(0.26, 0.32);
		const tilt = c.r(-0.2, 0.2);
		const ringShape: Shape = [
			'and',
			['ellipse', cx, cy, r * 1.85, r * 0.45],
			['not', ['ellipse', cx, cy, r * 1.45, r * 0.28]]
		];
		c.add(ringk, ringShape);
		c.add(body, ['and', ['circle', cx, cy, r], ['not', ['rect', 0, cy + r * 0.25, c.w, c.h]]]);
		c.add(body, ['and', ['circle', cx, cy, r], ['rect', 0, cy + r * 0.25, c.w, c.h]]);
		c.add(band, ['and', ['circle', cx, cy, r], ['rect', 0, cy - r * (0.45 - tilt), c.w, r * 0.3]]);
		c.add(ringk, ['and', ringShape, ['rect', 0, cy, c.w, c.h]]);
		let moon: string | undefined;
		if (c.rng() < 0.6) {
			moon = c.color(['grey', 'cream', 'lilac', 'white']);
			c.add(moon, ['circle', c.w * 0.82, c.h * 0.18, 2.6]);
		}
		// New colors: night on the planet, a shaded ring, a far planet, star colors.
		let night: string | undefined;
		c.more((e) => (night = e.shade(body, 'lr', 0.4)));
		c.more((e) => e.shade(ringk, 'r', 0.4, -1, 6));
		c.more((e) => e.shade(band, 'lr', 0.4, -1, 6));
		c.more((e) => e.part(BRIGHTS, ['circle', c.w * 0.15, c.h * 0.16, 1.6], [space], 4));
		c.more((e) => e.shade(moon, 'lr', 0.4, -1, 6));
		c.more((e) => e.sprinkle(['ice', 'lemon', 'peach', 'lavender', 'seafoam', 'aqua'], 7, [space]));
		c.later((d) => {
			// Stars that keep their color, craters, a swirling band, a grainy ring.
			d.specks([star, ringk, moon, band], [space], d.n(4, 18));
			d.specks([band, OUTLINE, ringk], [body], d.n(1, 10));
			d.specks([body, star], [band], d.n(0, 4));
			if (d.amount > 0.2) {
				d.hatch(
					['and', ['circle', cx, cy, r], ['rect', 0, cy - r * (0.45 - tilt), c.w, r * 0.3]],
					[band],
					[band, body, night ?? ringk, OUTLINE],
					'diag'
				);
			}
			if (d.amount > 0.5)
				d.hatch(['rect', 0, 0, c.w, c.h], [ringk], [ringk, body, star, band], 'anti');
			else d.specks([body, star], [ringk], d.n(0, 6));
			d.specks([OUTLINE, space], [moon], d.n(0, 2));
		});
		return `${cap(c.nameOf(body))} Planet`;
	},
	cake(c) {
		const bg = c.color(['rose', 'mint', 'sky', 'lilac', 'cream', 'sand'], true);
		c.fill(bg);
		const plate = c.color(['white', 'grey', 'cream']);
		const sponge = c.color(['tan', 'brown', 'sand', 'pink']);
		const cream = c.color(['white', 'cream', 'rose', 'mint']);
		const cherry = c.color(['red', 'magenta', 'violet']);
		const x0 = c.w * 0.18;
		const x1 = c.w * 0.82;
		c.add(plate, ['ellipse', c.w / 2, c.h * 0.86, c.w * 0.42, 2]);
		const tiers = c.ri(2, 3);
		let bottom = c.h * 0.85;
		for (let k = 0; k < tiers; k++) {
			const inset = k * c.w * 0.1;
			const height = c.h * (0.22 - k * 0.03);
			c.add(sponge, ['rect', x0 + inset, bottom - height, x1 - x0 - 2 * inset, height]);
			c.add(cream, ['rect', x0 + inset, bottom - height, x1 - x0 - 2 * inset, 2.2]);
			c.add(cream, ['rect', x0 + inset, bottom - height * 0.55, x1 - x0 - 2 * inset, 1.3]);
			bottom -= height;
		}
		c.add(cherry, ['circle', c.w / 2, bottom - 2, 2.2]);
		const candle = c.color(['sky', 'yellow', 'lime', 'pink']);
		const lit = c.rng() < 0.6;
		if (lit) c.add(candle, ['rect', c.w / 2 + 3, bottom - 6, 1.5, 6]);
		// New colors: shaded sponge and cream, a table, wallpaper stripes, a flame, a shine.
		let crumb: string | undefined;
		c.more((e) => (crumb = e.shade(sponge, 'r', 0.3, -1, 6)));
		c.more((e) =>
			e.part(
				BROWNS.concat(['tan', 'brown', 'denim', 'slate']),
				['rect', 0, c.h * 0.9, c.w, c.h],
				[bg],
				6
			)
		);
		c.more((e) => e.part(bg, (x, y) => x % 4 === 1 && e.at(x, y) === bg, [bg], 8));
		c.more((e) => e.shade(cream, 'r', 0.3, -1, 6));
		if (lit) {
			c.more((e) =>
				e.part(
					['tangerine', 'gold', 'lemon', 'scarlet'],
					['circle', c.w / 2 + 3.75, bottom - 7, 1],
					[bg],
					1
				)
			);
		}
		c.more((e) => e.shade(plate, 'b', 0.4, -1, 6));
		c.more((e) => e.glint(cherry, 'ul', 0.25, 6));
		c.later((d) => {
			// Berries and crumbs in the sponge, sprinkles on the cream, a dotted plate.
			if (d.amount > 0.15)
				d.hatch(['rect', 0, 0, c.w, c.h], [sponge], [null, cherry, crumb ?? cream, candle], 'dots');
			d.specks([cherry, cream, candle], [sponge], d.n(2, 12));
			d.specks([cherry, candle, sponge], [cream], d.n(1, 10));
			d.specks([cherry, sponge], [plate], d.n(0, 4));
			d.specks([cream, OUTLINE], [cherry], d.n(0, 1));
			d.specks([cherry], [bg], d.n(0, 8));
		});
		return `${cap(c.nameOf(sponge))} Cake`;
	},
	potion(c) {
		const bg = c.color(['night', 'plum', 'dusk', 'navy', 'cream', 'sand'], true);
		c.fill(bg);
		const glass = c.color(['white', 'mint', 'sky', 'lilac']);
		const liquid = c.color(['magenta', 'lime', 'violet', 'red', 'teal', 'orange']);
		const cork = c.color(['brown', 'tan', 'sand']);
		const cx = c.w / 2;
		const cy = c.h * 0.6;
		const r = Math.min(c.w, c.h) * 0.3;
		c.add(glass, ['circle', cx, cy, r]);
		c.add(glass, ['rect', cx - r * 0.3, cy - r * 1.6, r * 0.6, r]);
		c.add(liquid, [
			'and',
			['circle', cx, cy, r - 1.5],
			['rect', 0, cy - r * c.r(0.2, 0.5), c.w, c.h]
		]);
		c.add(cork, ['rect', cx - r * 0.35, cy - r * 1.9, r * 0.7, r * 0.45]);
		const bubble = c.color(['white', 'cream', 'yellow']);
		for (let k = 0; k < 4; k++)
			c.add(bubble, ['circle', cx + c.r(-r * 0.5, r * 0.5), cy + c.r(0, r * 0.6), 0.9]);
		// New colors: a deep brew, a glint on the glass, a shelf, a glow, sparkles.
		let deep: string | undefined;
		c.more((e) => (deep = e.shade(liquid, 'lr', 0.3)));
		c.more((e) => e.glint(glass, 'ul', 0.25, 6));
		c.more((e) =>
			e.part(BROWNS.concat(['brown', 'tan', 'stone']), ['rect', 0, cy + r - 0.5, c.w, c.h], [bg], 6)
		);
		c.more((e) => e.shade(cork, 'r', 0.4, -1, 4));
		c.more((e) => e.part(bg, ['circle', cx, cy - r * 0.3, r + 4], [bg], 6, 1));
		c.more((e) => e.sprinkle(['lemon', 'ice', 'seafoam', 'lavender', 'peach', 'aqua'], 7, [bg]));
		c.more((e) => e.part(bg, ['rect', 0, 0, c.w, c.h * 0.1], [bg], 6));
		c.later((d) => {
			// A shimmering brew, glints on the glass, a grainy cork, sparkles around.
			if (d.amount > 0.15) {
				d.hatch(
					['ellipse', cx, cy + r * 0.25, r * 0.55, r * 0.45],
					[liquid],
					[liquid, bubble, deep ?? glass, cork],
					'zig'
				);
			}
			d.specks([bubble, glass], [liquid], d.n(2, 12));
			d.specks([bubble, bg], [glass], d.n(1, 6));
			if (d.amount > 0.4)
				d.hatch(['rect', 0, 0, c.w, c.h], [cork], [cork, OUTLINE, liquid], 'anti');
			d.specks([bubble], [bg], d.n(1, 12));
		});
		return `${cap(c.nameOf(liquid))} Potion`;
	},
	mountains(c) {
		const sky = c.color(SKY, true);
		c.fill(sky);
		const sun = c.color(['yellow', 'orange', 'white', 'coral']);
		c.add(sun, ['circle', c.w * c.r(0.15, 0.85), c.h * 0.18, 3.2]);
		const far = c.color(['lilac', 'grey', 'dusk', 'mint', 'violet']);
		const near = c.color(['indigo', 'navy', 'forest', 'plum', 'brown']);
		const snow = c.color(['white', 'cream']);
		const lake = c.color(['blue', 'teal', 'sky']);
		const p1 = c.w * c.r(0.25, 0.4);
		const p2 = c.w * c.r(0.6, 0.75);
		c.add(far, [
			'poly',
			[
				[-2, c.h * 0.75],
				[p1, c.h * 0.22],
				[c.w * 0.65, c.h * 0.75]
			]
		]);
		c.add(snow, [
			'poly',
			[
				[p1 - 3, c.h * 0.33],
				[p1, c.h * 0.22],
				[p1 + 3, c.h * 0.33]
			]
		]);
		c.add(near, [
			'poly',
			[
				[c.w * 0.3, c.h * 0.78],
				[p2, c.h * 0.32],
				[c.w + 2, c.h * 0.78]
			]
		]);
		c.add(snow, [
			'poly',
			[
				[p2 - 2.5, c.h * 0.41],
				[p2, c.h * 0.32],
				[p2 + 2.5, c.h * 0.41]
			]
		]);
		c.add(lake, ['rect', 0, c.h * 0.76, c.w, c.h]);
		// New colors: shaded faces, woods at the foot, a deep lake, sky, a cloud, the sun.
		let face: string | undefined;
		c.more(
			(e) =>
				(face = e.part(
					far,
					[
						'poly',
						[
							[p1, c.h * 0.22],
							[c.w * 0.65, c.h * 0.75],
							[p1 + 1, c.h * 0.75]
						]
					],
					[far],
					4,
					-1
				))
		);
		c.more((e) =>
			e.part(
				near,
				[
					'poly',
					[
						[p2, c.h * 0.32],
						[c.w + 2, c.h * 0.78],
						[p2 + 1, c.h * 0.78]
					]
				],
				[near],
				4,
				-1
			)
		);
		c.more((e) => {
			const phase = e.r(0, 6);
			e.part(
				GREENS_ALL,
				(x, y) => y + 0.5 > c.h * 0.68 + 1.2 * Math.sin(x * 0.7 + phase),
				[far, near],
				6
			);
		});
		c.more((e) => e.part(lake, ['rect', 0, c.h * 0.9, c.w, c.h], [lake], 6, -1));
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.08], [sky], 6));
		c.more((e) => {
			const x = c.w * e.r(0.2, 0.8);
			const y = c.h * e.r(0.08, 0.14);
			e.part(LIGHTS, any(['ellipse', x, y, 3.6, 1.4], ['circle', x + 1, y - 1, 1.5]), [sky], 5);
		});
		c.more((e) => e.shade(sun, 'lr', 0.35, -1, 6));
		c.later((d) => {
			// Snow patches, rock strata on the near slope, ripples and the sun's glints in the lake.
			d.specks([snow], [far, near], d.n(2, 12));
			if (d.amount > 0.2) {
				d.hatch(
					['rect', 0, c.h * 0.62, c.w, c.h * 0.14],
					[near],
					[near, face ?? OUTLINE, far, snow],
					'anti'
				);
				d.hatch(['rect', 0, c.h * 0.55, c.w, c.h * 0.2], [far], [null, near, snow, sun], 'dots');
			}
			if (d.amount > 0.1)
				d.hatch(['rect', 0, c.h * 0.8, c.w, c.h], [lake], [null, sky, sun, snow], 'dots');
			d.specks([sun, snow, sky], [lake], d.n(1, 10));
			d.specks([OUTLINE], [sky], d.n(0, 4));
			d.specks([sky], [sun], d.n(0, 2));
		});
		return `${cap(c.nameOf(near))} Peaks`;
	},
	balloons(c) {
		const sky = c.color(['sky', 'mint', 'cream', 'rose', 'lilac'], true);
		c.fill(sky);
		const string = c.color(['grey', 'brown', 'navy']);
		const n = c.ri(2, 3);
		const colors = Array.from({ length: n }, () => c.color(WARM.concat(COOL)));
		const balloons: Shape[] = [];
		for (let k = 0; k < n; k++) {
			const cx = (c.w * (k + 1)) / (n + 1) + c.r(-1.5, 1.5);
			const cy = c.h * c.r(0.25, 0.42);
			const r = c.w * c.r(0.12, 0.16);
			c.add(string, ['rect', cx - 0.4, cy + r, 0.9, c.h]);
			c.add(colors[k], ['ellipse', cx, cy, r, r * 1.2]);
			balloons.push(['ellipse', cx, cy, r, r * 1.2]);
		}
		const cloud = c.color(['white', 'cream']);
		c.add(cloud, ['ellipse', c.w * 0.2, c.h * 0.85, 5, 2]);
		// New colors: shaded balloons, grass, a deeper sky, a cloud's shadow, confetti.
		const shadows: (string | undefined)[] = [];
		colors.forEach((k, i) => c.more((e) => (shadows[i] = e.shade(k, 'lr', 0.3))));
		c.more((e) => e.part(GREENS_ALL, ['rect', 0, c.h * 0.93, c.w, c.h], [sky], 6));
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.1], [sky], 6));
		c.more((e) => e.shade(cloud, 'b', 0.35, -1, 6));
		c.more((e) => e.sprinkle(BRIGHTS, 6, [sky]));
		c.later((d) => {
			// Patterned balloons (a band across each), shine, confetti in the sky.
			balloons.forEach((shape, k) => {
				const [, , cy, , ry] = shape as ['ellipse', number, number, number, number];
				if (d.amount > 0.15 + k * 0.12) {
					d.hatch(
						['and', shape, ['rect', 0, cy - ry * 0.15, c.w, ry * (0.3 + d.amount * 0.5)]],
						[colors[k]],
						[colors[k], colors[(k + 1) % n], shadows[k] ?? cloud, string],
						k % 2 ? 'anti' : 'diag'
					);
				}
				d.specks([cloud, colors[(k + 1) % n]], [colors[k]], d.n(1, 6), shape);
			});
			d.specks([...colors, cloud, string], [sky], d.n(2, 18));
			d.specks([sky, ...colors], [cloud], d.n(0, 3));
		});
		return `${cap(c.nameOf(colors[0]))} Balloons`;
	},
	cat(c) {
		const bg = c.color(['mint', 'sky', 'rose', 'lilac', 'cream', 'sand'], true);
		c.fill(bg);
		const fur = c.color(['orange', 'grey', 'brown', 'tan', 'white', 'amber']);
		const ear = c.color(['pink', 'rose', 'coral']);
		const eye = c.color(['green', 'yellow', 'blue', 'teal']);
		const nose = c.color(['pink', 'red', 'brown', 'magenta']);
		const cx = c.w / 2;
		const cy = c.h * 0.58;
		const r = c.w * 0.32;
		// Ears, then inner ears, then eyes, each left then right: later shapes paint on top.
		for (const sx of [-1, 1]) {
			c.add(fur, [
				'poly',
				[
					[cx + sx * r, cy - r * 0.2],
					[cx + sx * r * 0.7, cy - r * 1.35],
					[cx + sx * r * 0.15, cy - r * 0.7]
				]
			]);
		}
		for (const sx of [-1, 1]) {
			c.add(ear, [
				'poly',
				[
					[cx + sx * r * 0.8, cy - r * 0.45],
					[cx + sx * r * 0.68, cy - r * 1.05],
					[cx + sx * r * 0.35, cy - r * 0.7]
				]
			]);
		}
		c.add(fur, ['ellipse', cx, cy, r, r * 0.85]);
		for (const sx of [-1, 1]) {
			c.add(eye, ['ellipse', cx + sx * r * 0.4, cy - r * 0.15, r * 0.18, r * 0.24]);
		}
		c.add(nose, [
			'poly',
			[
				[cx - 1.5, cy + r * 0.15],
				[cx + 1.5, cy + r * 0.15],
				[cx, cy + r * 0.32]
			]
		]);
		// New colors: shaded fur, a lighter muzzle, blushing cheeks, a floor, wallpaper.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(fur, 'lr', 0.3)));
		c.more((e) => e.part(fur, ['ellipse', cx, cy + r * 0.32, r * 0.38, r * 0.24], [fur], 4, 1));
		c.more((e) =>
			e.part(
				['blush', 'bubblegum', 'salmon', 'peach', 'rose', 'pink'],
				any(
					['circle', cx - r * 0.62, cy + r * 0.22, r * 0.13],
					['circle', cx + r * 0.62, cy + r * 0.22, r * 0.13]
				),
				[fur],
				2
			)
		);
		c.more((e) =>
			e.part(BROWNS.concat(GREYS, ['denim', 'sage']), ['rect', 0, c.h * 0.9, c.w, c.h], [bg], 6)
		);
		c.more((e) => e.part(bg, (x, y) => x % 4 === 1 && e.at(x, y) === bg, [bg], 8));
		c.more((e) => e.shade(eye, 'b', 0.4, -1, 4));
		c.more((e) => e.shade(ear, 'r', 0.4, -1, 3));
		c.later((d) => {
			// Slit pupils, tabby marks on the forehead and cheeks, freckles, dotted wallpaper.
			for (const sx of [-1, 1]) {
				const ex = cx + sx * r * 0.4;
				d.paint(OUTLINE, ['rect', Math.floor(ex) - 0.01, cy - r * 0.38, 1, r * 0.46], [eye]);
			}
			const head: Shape = ['ellipse', cx, cy, r, r * 0.85];
			if (d.amount > 0.1) {
				d.hatch(
					['and', head, ['rect', cx - r * 0.35, 0, r * 0.7, cy - r * 0.42]],
					[fur],
					[fur, OUTLINE, shadow ?? ear, nose],
					'anti'
				);
			}
			if (d.amount > 0.4) {
				for (const sx of [-1, 1]) {
					d.hatch(
						['and', head, ['ellipse', cx + sx * r * 0.75, cy + r * 0.3, r * 0.25, r * 0.3]],
						[fur],
						[fur, OUTLINE, ear, nose],
						'diag'
					);
				}
			}
			d.specks([OUTLINE], [fur], d.n(1, 6), ['rect', cx - r * 0.5, cy + r * 0.15, r, r * 0.35]);
			d.specks([fur], [ear], d.n(0, 2));
			d.specks([eye], [bg], d.n(0, 8));
		});
		return `${cap(c.nameOf(fur))} Cat`;
	},
	owl(c) {
		const sky = c.color(['night', 'dusk', 'navy', 'plum', 'sky'], true);
		c.fill(sky);
		const moon = c.color(['cream', 'yellow', 'white']);
		c.add(moon, ['circle', c.w * 0.82, c.h * 0.14, 3]);
		const branch = c.color(['brown', 'tan']);
		c.add(branch, ['rect', 0, c.h * 0.84, c.w, 2.5]);
		const body = c.color(['brown', 'tan', 'grey', 'violet', 'orange']);
		const belly = c.color(['cream', 'sand', 'white', 'rose']);
		const eyes = c.color(['yellow', 'amber', 'orange', 'lime']);
		const cx = c.w / 2;
		const cy = c.h * 0.55;
		const rx = c.w * 0.27;
		const ry = c.h * 0.3;
		for (const sx of [-1, 1]) {
			c.add(body, [
				'poly',
				[
					[cx + sx * rx, cy - ry * 0.9],
					[cx + sx * rx * 0.6, cy - ry * 1.25],
					[cx + sx * rx * 0.4, cy - ry * 0.8]
				]
			]);
		}
		c.add(body, ['ellipse', cx, cy, rx, ry]);
		c.add(belly, ['ellipse', cx, cy + ry * 0.3, rx * 0.6, ry * 0.55]);
		for (const sx of [-1, 1]) c.add(eyes, ['circle', cx + sx * rx * 0.42, cy - ry * 0.4, rx * 0.3]);
		// Picked after the eyes are drawn, as before, so the colors come out the same.
		const pupil = c.color(['night', 'navy', 'brown']);
		for (const sx of [-1, 1]) {
			c.add(pupil, ['circle', cx + sx * rx * 0.42, cy - ry * 0.4, rx * 0.12]);
		}
		// New colors: darker wings, a beak and feet, a shaded moon, sky, branch and leaves.
		let wing: string | undefined;
		let beak: string | undefined;
		c.more(
			(e) =>
				(wing = e.part(
					body,
					any(
						['ellipse', cx - rx * 0.88, cy + ry * 0.15, rx * 0.3, ry * 0.55],
						['ellipse', cx + rx * 0.88, cy + ry * 0.15, rx * 0.3, ry * 0.55]
					),
					[body],
					6,
					-1
				))
		);
		c.more((e) => {
			const by = cy - ry * 0.22;
			beak = e.part(
				['tangerine', 'gold', 'ochre', 'apricot', 'amber', 'orange'],
				[
					'poly',
					[
						[cx - 1.4, by],
						[cx + 1.4, by],
						[cx, by + 2.8]
					]
				],
				[body, belly],
				2
			);
			for (const sx of [-1, 1])
				e.paint(beak, ['rect', cx + sx * rx * 0.35 - 1, c.h * 0.84, 2.2, 2], [branch]);
		});
		c.more((e) => e.shade(moon, 'lr', 0.4, -1, 6));
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.1], [sky], 6));
		c.more((e) => e.shade(branch, 'b', 0.4, -1, 6));
		c.more((e) =>
			e.part(
				GREENS_ALL,
				any(['ellipse', 2.5, c.h * 0.8, 3, 1.4], ['ellipse', c.w - 3, c.h * 0.81, 3, 1.4]),
				[sky, branch],
				4
			)
		);
		c.more((e) => e.shade(belly, 'lr', 0.3));
		c.later((d) => {
			// Feathered belly, spots on the wings, stars, a grainy branch.
			const chest: Shape = ['ellipse', cx, cy + ry * 0.3, rx * 0.6, ry * 0.55];
			if (d.amount > 0.1)
				d.hatch(chest, [belly], [belly, body, wing ?? eyes, beak ?? OUTLINE], 'zig');
			else d.specks([body], [belly], d.n(2, 4));
			d.specks([belly, eyes, OUTLINE], [body], d.n(2, 12));
			d.specks([moon], [sky], d.n(2, 16));
			d.specks([OUTLINE, sky], [moon], d.n(0, 2));
			if (d.amount > 0.35)
				d.hatch(['rect', 0, 0, c.w, c.h], [branch], [branch, OUTLINE, body], 'anti');
			else d.specks([OUTLINE, body], [branch], d.n(1, 6));
		});
		return `${cap(c.nameOf(body))} Owl`;
	},
	snowman(c) {
		const sky = c.color(['sky', 'dusk', 'navy', 'night', 'lilac'], true);
		const snow = c.color(['white', 'cream']);
		const snowGround = c.color(['mint', 'lilac', 'rose', 'sky', 'grey'], true);
		c.fill(sky);
		c.add(snowGround, ['rect', 0, c.h * 0.86, c.w, c.h]);
		const hat = c.color(['night', 'red', 'navy', 'plum', 'forest']);
		const scarf = c.color(['red', 'orange', 'green', 'magenta', 'yellow']);
		const nose = c.color(['orange', 'coral', 'amber']);
		const cx = c.w / 2;
		c.add(snow, ['circle', cx, c.h * 0.72, c.w * 0.24]);
		c.add(snow, ['circle', cx, c.h * 0.43, c.w * 0.17]);
		c.add(scarf, ['rect', cx - c.w * 0.16, c.h * 0.54, c.w * 0.32, 2.2]);
		c.add(scarf, ['rect', cx + c.w * 0.05, c.h * 0.54, 2.2, 6]);
		c.add(hat, ['rect', cx - c.w * 0.17, c.h * 0.29, c.w * 0.34, 1.8]);
		c.add(hat, ['rect', cx - c.w * 0.1, c.h * 0.13, c.w * 0.2, c.h * 0.17]);
		c.add(nose, [
			'poly',
			[
				[cx, c.h * 0.42],
				[cx + 4, c.h * 0.44],
				[cx, c.h * 0.46]
			]
		]);
		for (let k = 0; k < 8; k++) c.add(snow, ['circle', c.r(1, c.w - 1), c.r(1, c.h * 0.8), 0.7]);
		// New colors: blue snow shadows, a hat band, a shaded scarf, drifts, sky, stick arms.
		let chill: string | undefined;
		c.more((e) => (chill = e.shade(snow, 'lr', 0.3)));
		c.more((e) => e.part(BRIGHTS, ['rect', cx - c.w * 0.1, c.h * 0.25, c.w * 0.2, 1.2], [hat], 3));
		c.more((e) => e.shade(scarf, 'b', 0.4, -1, 4));
		c.more((e) =>
			e.part(
				BROWNS,
				(x, y) =>
					line(cx - c.w * 0.18, c.h * 0.62, cx - c.w * 0.38, c.h * 0.47)(x, y) ||
					line(cx + c.w * 0.18, c.h * 0.62, cx + c.w * 0.38, c.h * 0.47)(x, y),
				[sky],
				3
			)
		);
		c.more((e) => e.part(snowGround, ['rect', 0, c.h * 0.95, c.w, c.h], [snowGround], 4, -1));
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.08], [sky], 6));
		c.more((e) => e.shade(hat, 'r', 0.35, -1, 6));
		c.later((d) => {
			// Coal eyes and buttons, snowflakes, a plaid scarf, a hat band, sparkling snow.
			d.specks([OUTLINE], [snow], 2, ['rect', cx - c.w * 0.1, c.h * 0.36, c.w * 0.2, c.h * 0.04]);
			d.specks([OUTLINE, hat], [snow], d.n(2, 4), ['rect', cx - 0.5, c.h * 0.58, 1, c.h * 0.3]);
			d.specks([snow], [sky], d.n(3, 18));
			if (d.amount > 0.1)
				d.hatch(['rect', 0, 0, c.w, c.h], [scarf], [scarf, hat, snow, nose], 'zig');
			if (d.amount > 0.3)
				d.hatch(['rect', 0, c.h * 0.25, c.w, 1], [hat], [hat, scarf, nose], 'diag');
			if (d.amount > 0.2)
				d.hatch(['rect', 0, 0, c.w, c.h], [snowGround], [null, snow, chill ?? sky, scarf], 'dots');
		});
		return `${cap(c.nameOf(scarf))} Snowman`;
	},
	butterfly(c) {
		const bg = c.color(['mint', 'sky', 'cream', 'rose', 'lime', 'sand'], true);
		c.fill(bg);
		const wing = c.color(WARM.concat(['violet', 'blue', 'teal']));
		const spot = c.color(['white', 'yellow', 'cream', 'navy']);
		const body = c.color(['night', 'brown', 'navy', 'plum']);
		const inner = c.color(WARM.concat(COOL));
		const cx = c.w / 2;
		const cy = c.h / 2;
		for (const sx of [-1, 1]) {
			c.add(wing, ['ellipse', cx + sx * c.w * 0.22, cy - c.h * 0.12, c.w * 0.22, c.h * 0.2]);
			c.add(wing, ['ellipse', cx + sx * c.w * 0.18, cy + c.h * 0.18, c.w * 0.16, c.h * 0.15]);
			c.add(inner, ['ellipse', cx + sx * c.w * 0.24, cy - c.h * 0.12, c.w * 0.12, c.h * 0.1]);
			c.add(spot, ['circle', cx + sx * c.w * 0.2, cy + c.h * 0.18, 1.6]);
		}
		c.add(body, ['ellipse', cx, cy, 1.6, c.h * 0.3]);
		// New colors: lower wings, shading, antennae, grass and flowers, a deeper sky.
		let lower: string | undefined;
		c.more(
			(e) =>
				(lower = e.part(
					BRIGHTS,
					any(
						['ellipse', cx - c.w * 0.18, cy + c.h * 0.18, c.w * 0.16, c.h * 0.15],
						['ellipse', cx + c.w * 0.18, cy + c.h * 0.18, c.w * 0.16, c.h * 0.15]
					),
					[wing],
					6
				))
		);
		c.more((e) => e.shade(wing, 'lr', 0.3));
		c.more((e) =>
			e.part(
				['ink', 'charcoal', 'chocolate', 'grape', 'denim', 'wine'],
				(x, y) =>
					line(cx - 0.5, cy - c.h * 0.29, cx - 3.5, cy - c.h * 0.42)(x, y) ||
					line(cx + 0.5, cy - c.h * 0.29, cx + 3.5, cy - c.h * 0.42)(x, y),
				[bg],
				2
			)
		);
		c.more((e) => e.shade(inner, 'lr', 0.35, -1, 6));
		c.more((e) => e.part(GREENS_ALL, ['rect', 0, c.h * 0.93, c.w, c.h], [bg], 6));
		c.more((e) => e.sprinkle(BLOOMS_ALL, 5, [bg], ['rect', 0, c.h * 0.75, c.w, c.h]));
		c.more((e) => e.part(bg, ['rect', 0, 0, c.w, c.h * 0.08], [bg], 6));
		c.later((d) => {
			// A patterned edge on the upper wings, spots, a banded body, pollen in the air.
			if (d.amount > 0.15) {
				for (const sx of [-1, 1]) {
					const ex = cx + sx * c.w * 0.22;
					const ey = cy - c.h * 0.12;
					d.hatch(
						[
							'and',
							['ellipse', ex, ey, c.w * 0.22, c.h * 0.2],
							['not', ['ellipse', ex + sx * 0.5, ey, c.w * 0.15, c.h * 0.13]],
							['not', ['rect', cx - c.w * 0.12, 0, c.w * 0.24, c.h]]
						],
						[wing],
						[wing, inner, lower ?? spot, body],
						'zig'
					);
				}
			}
			d.specks([spot, inner], [wing], d.n(2, 14));
			d.specks([spot, wing, OUTLINE], [inner], d.n(1, 8));
			if (d.amount > 0.4) {
				for (let y = Math.floor(cy - c.h * 0.2); y < cy + c.h * 0.25; y += 3) {
					d.paint(spot, ['rect', 0, y, c.w, 1], [body]);
				}
			}
			d.specks([spot], [bg], d.n(1, 10));
		});
		return `${cap(c.nameOf(wing))} Butterfly`;
	},
	rocket(c) {
		const space = c.color(['night', 'navy', 'plum', 'dusk'], true);
		c.fill(space);
		const star = c.color(['white', 'yellow']);
		for (let k = 0; k < 8; k++) c.add(star, ['circle', c.r(1, c.w - 1), c.r(1, c.h - 1), 0.7]);
		const hull = c.color(['white', 'grey', 'cream', 'sky']);
		const nosec = c.color(['red', 'orange', 'magenta', 'teal']);
		const glass = c.color(['sky', 'teal', 'mint', 'blue']);
		const flame = c.color(['orange', 'yellow', 'amber']);
		const cx = c.w / 2;
		const rx = c.w * 0.15;
		const top = c.h * 0.1;
		const bottom = c.h * 0.72;
		c.add(flame, [
			'poly',
			[
				[cx - rx * 0.7, bottom],
				[cx + rx * 0.7, bottom],
				[cx, c.h * 0.95]
			]
		]);
		for (const sx of [-1, 1]) {
			c.add(nosec, [
				'poly',
				[
					[cx + sx * rx * 1.9, bottom + 1],
					[cx + sx * rx, bottom - c.h * 0.18],
					[cx + sx * rx, bottom + 1]
				]
			]);
		}
		c.add(hull, ['ellipse', cx, (top + bottom) / 2 + 2, rx, (bottom - top) / 2]);
		c.add(nosec, [
			'and',
			['ellipse', cx, (top + bottom) / 2 + 2, rx, (bottom - top) / 2],
			['rect', 0, 0, c.w, top + c.h * 0.14]
		]);
		c.add(glass, ['circle', cx, c.h * 0.38, rx * 0.5]);
		// New colors: a shaded hull and fins, a hot core, a far planet, a glint, smoke.
		let side: string | undefined;
		c.more((e) => (side = e.shade(hull, 'r', 0.35)));
		c.more((e) =>
			e.part(
				flame,
				[
					'poly',
					[
						[cx - rx * 0.35, bottom],
						[cx + rx * 0.35, bottom],
						[cx, c.h * 0.86]
					]
				],
				[flame],
				3,
				1
			)
		);
		c.more((e) => e.shade(nosec, 'r', 0.4, -1, 6));
		c.more((e) => {
			const x = e.r(0, 1) < 0.5 ? c.w * 0.16 : c.w * 0.84;
			e.part(BRIGHTS, ['circle', x, c.h * 0.2, 2.8], [space], 6);
		});
		c.more((e) => e.glint(glass, 'ul', 0.3, 5));
		c.more((e) =>
			e.part(
				GREYS.concat(['white', 'ivory', 'lavender']),
				any(['ellipse', cx - 4, c.h * 0.97, 4, 2], ['ellipse', cx + 4, c.h * 0.98, 4, 2]),
				[space],
				6
			)
		);
		c.later((d) => {
			// Stars that keep their color, rivets on the hull, a flickering flame, a glint.
			d.specks([star, hull, glass, flame], [space], d.n(4, 18));
			if (d.amount > 0.15)
				d.hatch(
					['rect', 0, c.h * 0.48, c.w, c.h],
					[hull],
					[null, OUTLINE, side ?? nosec, glass],
					'dots'
				);
			d.specks([OUTLINE, nosec], [hull], d.n(1, 6));
			if (d.amount > 0.3)
				d.hatch(['rect', 0, 0, c.w, c.h], [flame], [flame, nosec, star, hull], 'zig');
			else d.specks([nosec, star], [flame], d.n(1, 3));
			d.specks([hull, star], [glass], d.n(1, 2));
			d.specks([hull, glass], [nosec], d.n(0, 6));
		});
		return `${cap(c.nameOf(nosec))} Rocket`;
	},
	quilt(c) {
		const bg = c.color(['cream', 'white', 'sand', 'mint', 'rose'], true);
		c.fill(bg);
		const a = c.color(WARM);
		const b = c.color(COOL);
		const d = c.color(ANY);
		const n = c.ri(2, 3);
		const cw = c.w / n;
		const ch = c.h / n;
		const patches: { k: string; x: number; y: number; r: number }[] = [];
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < n; j++) {
				const x = i * cw + cw / 2;
				const y = j * ch + ch / 2;
				const k = (i + j) % 2 ? a : b;
				const r = Math.min(cw, ch) * 0.42;
				if (c.rng() < 0.5) c.add(k, ['circle', x, y, r]);
				else
					c.add(k, [
						'poly',
						[
							[x, y - r],
							[x + r, y],
							[x, y + r],
							[x - r, y]
						]
					]);
				c.add(d, ['circle', x, y, r * 0.4]);
				patches.push({ k, x, y, r });
			}
		}
		// New colors: shaded patches, a border, seams, centers, sequins.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(a, 'lr', 0.35, -1, 6)));
		c.more((e) => e.shade(b, 'lr', 0.35, -1, 6));
		c.more((e) =>
			e.part(
				BRIGHTS.concat(BROWNS),
				(x, y) => x === 0 || y === 0 || x === c.w - 1 || y === c.h - 1,
				[bg],
				6
			)
		);
		c.more((e) =>
			e.part(
				bg,
				(x, y) =>
					Array.from({ length: n - 1 }, (_, i) => Math.round((i + 1) * cw)).includes(x) ||
					Array.from({ length: n - 1 }, (_, i) => Math.round((i + 1) * ch)).includes(y),
				[bg],
				6
			)
		);
		c.more((e) => e.shade(d, 'lr', 0.4, -1, 4));
		c.more((e) => e.glint(a, 'ul', 0.15, 10));
		c.more((e) => e.sprinkle(BRIGHTS, 6, [bg]));
		c.later((t) => {
			// Some patches woven or checked in the quilt's colors, stitches on the cloth.
			const weaves: Pattern[] = ['zig', 'diag', 'anti', 'dots'];
			patches.forEach((p, i) => {
				const other = p.k === a ? b : a;
				// More patches get a weave as the game goes on; the rest get a few flecks.
				if (t.amount > 0.1 && ((i * 7) % patches.length) / patches.length < t.amount + 0.15) {
					t.hatch(
						['circle', p.x, p.y, p.r],
						[p.k],
						[p.k, other, d, shadow ?? OUTLINE],
						weaves[i % weaves.length]
					);
				} else t.specks([other, d], [p.k], t.n(1, 4), ['circle', p.x, p.y, p.r]);
				t.specks([p.k, OUTLINE], [d], t.n(0, 2), ['circle', p.x, p.y, p.r]);
			});
			t.specks([a, b, d], [bg], t.n(2, 16));
		});
		return `${cap(c.nameOf(a))} Quilt`;
	},
	icecream(c) {
		const bg = c.color(['sky', 'mint', 'rose', 'lilac', 'cream'], true);
		c.fill(bg);
		const cone = c.color(['sand', 'tan', 'amber']);
		const scoops = c.ri(2, 3);
		const flavors = Array.from({ length: scoops }, () =>
			c.color(['pink', 'white', 'brown', 'mint', 'yellow', 'lilac', 'coral'])
		);
		const cx = c.w / 2;
		c.add(cone, [
			'poly',
			[
				[cx - c.w * 0.2, c.h * 0.55],
				[cx + c.w * 0.2, c.h * 0.55],
				[cx, c.h * 0.95]
			]
		]);
		for (let k = 0; k < scoops; k++) {
			c.add(flavors[k], [
				'circle',
				cx + (k % 2 ? 1 : -1) * (k ? 1.5 : 0),
				c.h * (0.5 - k * 0.17),
				c.w * 0.21
			]);
		}
		const sprinkle = c.color(['red', 'blue', 'green', 'violet']);
		for (let k = 0; k < 6; k++)
			c.add(sprinkle, ['rect', cx + c.r(-5, 5), c.h * c.r(0.2, 0.5), 1.2, 1.2]);
		// New colors: shaded scoops and cone, a cherry, wallpaper, a table, sprinkles.
		const shadows: (string | undefined)[] = [];
		flavors.forEach((f, i) => c.more((e) => (shadows[i] = e.shade(f, 'lr', 0.3))));
		c.more((e) => e.shade(cone, 'r', 0.4, -1, 6));
		c.more((e) => {
			const k = scoops - 1;
			const x = cx + (k % 2 ? 1 : -1) * (k ? 1.5 : 0);
			const y = c.h * (0.5 - k * 0.17) - c.w * 0.21 + 2;
			e.part(['scarlet', 'crimson', 'berry', 'red'], ['circle', x, y, 1.5], [flavors[k]], 3);
		});
		c.more((e) => e.part(bg, (x, y) => x % 4 === 1 && e.at(x, y) === bg, [bg], 8));
		c.more((e) => e.part(BROWNS.concat(GREYS), ['rect', 0, c.h * 0.95, c.w, c.h], [bg], 6));
		c.more((e) => e.sprinkle(BRIGHTS, 5, [bg]));
		c.later((d) => {
			// Chips and sprinkles in every scoop, a waffle cone, polka dots behind.
			for (const f of flavors) d.specks([sprinkle, ...flavors, OUTLINE], [f], d.n(2, 8));
			if (d.amount > 0.1)
				d.hatch(
					['rect', 0, 0, c.w, c.h],
					[cone],
					[cone, OUTLINE, shadows[0] ?? flavors[0], sprinkle],
					'zig'
				);
			else d.specks([OUTLINE], [cone], d.n(2, 4));
			d.specks([sprinkle], [bg], d.n(1, 10));
		});
		return `${cap(c.nameOf(flavors[0]))} Ice Cream`;
	}
};

/**
 * Subjects for the second set of drawn packs (06 on). Like TEMPLATES, each draws onto
 * the canvas, adds its colors (`more`) and its islands (`later`), and returns its name.
 * They only run with lots of detail (amount 1 and up), so their detail isn't gated.
 */
const SUBJECTS: Record<string, Template> = {
	lighthouse(c) {
		const sky = c.color(SKY, true);
		const sea = c.color(['blue', 'navy', 'teal', 'dusk'], true);
		c.fill(sky);
		c.add(sea, ['rect', 0, c.h * 0.78, c.w, c.h]);
		const rock = c.color(['grey', 'brown', 'tan', 'plum']);
		const tower = c.color(['white', 'cream', 'sand']);
		const stripe = c.color(['red', 'coral', 'navy', 'green', 'magenta']);
		const lamp = c.color(['yellow', 'amber', 'orange']);
		const cx = c.w * c.r(0.4, 0.6);
		const base = c.h * 0.8;
		const top = c.h * 0.34;
		const bw = c.w * 0.15;
		const tw = c.w * 0.095;
		const rockShape: Shape = ['ellipse', cx, c.h * 0.86, c.w * 0.32, c.h * 0.1];
		c.add(rock, rockShape);
		const body: Shape = [
			'poly',
			[
				[cx - bw, base],
				[cx + bw, base],
				[cx + tw, top],
				[cx - tw, top]
			]
		];
		c.add(tower, body);
		const bands = c.ri(3, 4);
		const bandH = (base - top) / (bands * 2);
		for (let k = 0; k < bands; k++) {
			c.add(stripe, ['and', body, ['rect', 0, top + bandH * (2 * k + 1), c.w, bandH]]);
		}
		const room: Shape = ['rect', cx - tw + 0.5, top - 6.5, (tw - 0.5) * 2, 5];
		c.add(lamp, room);
		c.add(stripe, ['rect', cx - tw - 1.5, top - 2, (tw + 1.5) * 2, 2.5]);
		c.add(stripe, [
			'poly',
			[
				[cx - tw - 1, top - 6],
				[cx + tw + 1, top - 6],
				[cx, top - 11]
			]
		]);
		const door: Shape = ['rect', cx - 1.5, base - 5, 3, 5];
		c.add(rock, door);
		// New colors: a beam, a shaded side, deep sea, a cloud, foam, a sunset band.
		const left = cx < c.w / 2;
		c.more((e) =>
			e.part(
				['lemon', 'ivory', 'cream', 'gold'],
				[
					'poly',
					[
						[cx, top - 4],
						[left ? c.w : 0, top - 10],
						[left ? c.w : 0, top + 2]
					]
				],
				[sky],
				6
			)
		);
		let side: string | undefined;
		c.more((e) => (side = e.part(tower, ['rect', cx + tw * 0.35, 0, c.w, c.h], [tower], 4, -1)));
		c.more((e) => e.part(sea, ['rect', 0, c.h * 0.92, c.w, c.h], [sea], 6, -1));
		c.more((e) => e.shade(rock, 'r', 0.35, -1, 6));
		c.more((e) => {
			const x = left ? c.w * e.r(0.08, 0.25) : c.w * e.r(0.72, 0.88);
			e.part(
				LIGHTS,
				any(['ellipse', x, c.h * 0.12, 4, 1.5], ['circle', x + 1, c.h * 0.12 - 1, 1.7]),
				[sky],
				5
			);
		});
		c.more((e) => e.part(sky, ['rect', 0, c.h * 0.62, c.w, c.h * 0.16], [sky], 6));
		c.more((e) => e.glint(lamp, 'ul', 0.3, 4));
		c.later((d) => {
			// Panes in the lamp room, windows up the tower, weed on the rock, waves.
			d.hatch(room, [lamp], [lamp, OUTLINE, stripe, side ?? tower], 'diag');
			d.specks([OUTLINE, lamp], [tower], d.n(1, 4), body);
			d.hatch(rockShape, [rock], [rock, OUTLINE, sea, tower], 'zig');
			d.hatch(['rect', 0, c.h * 0.78, c.w, 3], [sea], [sea, tower, sky, stripe], 'zig');
			d.specks([tower, lamp, rock], [sea], d.n(2, 10));
			d.specks([OUTLINE, stripe], [sky], d.n(1, 8));
		});
		return `${cap(c.nameOf(stripe))} Lighthouse`;
	},
	sailboat(c) {
		const sky = c.color(SKY, true);
		const sea = c.color(['blue', 'teal', 'navy', 'dusk'], true);
		c.fill(sky);
		c.add(sea, ['rect', 0, c.h * 0.7, c.w, c.h]);
		const hull = c.color(['brown', 'red', 'navy', 'plum', 'forest']);
		const sail = c.color(['white', 'cream', 'sand']);
		const jib = c.color(WARM.concat(['sky', 'lime', 'teal']));
		const cx = c.w * c.r(0.46, 0.54);
		const wl = c.h * 0.72;
		const hw = c.w * 0.36;
		const mast = cx - c.w * 0.02;
		const main: Shape = [
			'poly',
			[
				[mast - 0.6, c.h * 0.1],
				[mast - 0.6, wl - 5],
				[cx - hw * 0.88, wl - 5]
			]
		];
		c.add(sail, main);
		c.add(jib, [
			'poly',
			[
				[mast + 0.6, c.h * 0.16],
				[mast + 0.6, wl - 5],
				[cx + hw * 0.85, wl - 5]
			]
		]);
		c.add(hull, ['rect', mast - 0.6, c.h * 0.08, 1.2, wl - c.h * 0.08]);
		c.add(jib, [
			'poly',
			[
				[mast + 0.5, c.h * 0.04],
				[mast + 4.5, c.h * 0.065],
				[mast + 0.5, c.h * 0.09]
			]
		]);
		const hullShape: Shape = [
			'poly',
			[
				[cx - hw, wl - 4.5],
				[cx + hw, wl - 4.5],
				[cx + hw * 0.72, wl + 2.5],
				[cx - hw * 0.78, wl + 2.5]
			]
		];
		c.add(hull, hullShape);
		let sun: string | undefined;
		if (c.rng() < 0.6) {
			sun = c.color(['yellow', 'orange', 'coral']);
			c.add(sun, ['circle', c.w * 0.86, c.h * 0.14, 2.8]);
		}
		// New colors: shaded sails, a hull stripe, deep water, a cloud, gulls.
		let fold: string | undefined;
		c.more((e) => (fold = e.shade(sail, 'r', 0.3)));
		c.more((e) => e.part(BRIGHTS, ['rect', 0, wl - 3.2, c.w, 1.4], [hull], 4));
		c.more((e) => e.shade(jib, 'b', 0.35, -1, 6));
		c.more((e) => e.part(sea, ['rect', 0, c.h * 0.88, c.w, c.h], [sea], 6, -1));
		c.more((e) => {
			const x = c.w * e.r(0.1, 0.3);
			e.part(
				LIGHTS,
				any(['ellipse', x, c.h * 0.2, 4, 1.5], ['circle', x + 1, c.h * 0.2 - 1, 1.7]),
				[sky],
				5
			);
		});
		c.more((e) => e.part(sky, ['rect', 0, c.h * 0.56, c.w, c.h * 0.14], [sky], 6));
		c.more((e) => e.shade(hull, 'b', 0.3, -1, 6));
		c.later((d) => {
			// A striped sail, portholes, waves at the bow, sparkles on the water.
			d.hatch(
				['and', main, ['rect', 0, c.h * 0.42, c.w, 3]],
				[sail],
				[sail, jib, hull, fold ?? OUTLINE],
				'diag'
			);
			d.specks([sail, OUTLINE], [hull], d.n(2, 5), hullShape);
			d.specks([sail, hull], [jib], d.n(1, 5));
			d.hatch(['rect', 0, wl + 3, c.w, 3], [sea], [sea, sail, sky, jib], 'zig');
			d.specks([sail, jib, sun], [sea], d.n(2, 12));
			d.specks([OUTLINE], [sky], d.n(1, 6));
		});
		return `${cap(c.nameOf(jib))} Sailboat`;
	},
	whale(c) {
		const sea = c.color(['blue', 'navy', 'teal', 'dusk', 'indigo'], true);
		const air = c.color(['sky', 'cream', 'rose', 'lilac', 'mint'], true);
		c.fill(sea);
		c.add(air, ['rect', 0, 0, c.w, c.h * 0.26]);
		const body = c.color(['grey', 'blue', 'navy', 'dusk', 'violet', 'teal']);
		const belly = c.color(['white', 'cream', 'sand', 'rose']);
		const spout = c.color(['white', 'sky', 'mint', 'cream']);
		const cx = c.w * 0.42;
		const cy = c.h * 0.55;
		const rx = c.w * 0.32;
		const ry = c.h * 0.17;
		const tx = cx + rx * 1.25;
		const hull: Shape = ['ellipse', cx, cy, rx, ry];
		c.add(body, [
			'poly',
			[
				[cx + rx * 0.4, cy - ry * 0.95],
				[tx, cy - ry * 0.2],
				[tx, cy + ry * 0.25],
				[cx + rx * 0.4, cy + ry * 0.95]
			]
		]);
		c.add(body, [
			'poly',
			[
				[tx - 1.5, cy],
				[tx + 3.5, cy - ry * 1.5],
				[tx + 5, cy - ry * 0.9],
				[tx + 1, cy + 0.5]
			]
		]);
		c.add(body, [
			'poly',
			[
				[tx - 1.5, cy],
				[tx + 3.5, cy + ry * 1.3],
				[tx + 5, cy + ry * 0.8],
				[tx + 1, cy - 0.5]
			]
		]);
		c.add(body, hull);
		const under: Shape = [
			'and',
			hull,
			['ellipse', cx - rx * 0.1, cy + ry * 0.95, rx * 0.95, ry * 0.75]
		];
		c.add(belly, under);
		c.add(body, [
			'poly',
			[
				[cx - rx * 0.2, cy + ry * 0.5],
				[cx + rx * 0.1, cy + ry * 0.5],
				[cx - rx * 0.25, cy + ry * 1.6]
			]
		]);
		const sx = cx - rx * 0.45;
		const sy = cy - ry - 2;
		c.add(spout, ['rect', sx - 0.8, sy - 3, 1.6, 3.5]);
		c.add(spout, ['circle', sx - 2.6, sy - 4.5, 2]);
		c.add(spout, ['circle', sx + 2.6, sy - 4.5, 2]);
		c.add(spout, ['circle', sx, sy - 5.5, 2]);
		// New colors: a darker back, shaded belly, deep water, a sun, small fish, bubbles.
		let back: string | undefined;
		c.more((e) => (back = e.shade(body, 't', 0.3)));
		c.more((e) => e.shade(belly, 'b', 0.3, -1, 6));
		c.more((e) => e.part(sea, ['rect', 0, c.h * 0.86, c.w, c.h], [sea], 6, -1));
		c.more((e) =>
			e.part(
				['gold', 'lemon', 'tangerine', 'salmon'],
				['circle', c.w * 0.86, c.h * 0.11, 2.6],
				[air],
				4
			)
		);
		c.more((e) =>
			e.part(
				BRIGHTS,
				any(
					['ellipse', c.w * 0.15, c.h * 0.88, 2, 1.1],
					['ellipse', c.w * 0.25, c.h * 0.93, 2, 1.1]
				),
				[sea],
				3
			)
		);
		c.more((e) => e.part(sea, ['rect', 0, c.h * 0.26, c.w, 2], [sea], 6, 1));
		c.more((e) => e.sprinkle(['ice', 'seafoam', 'aqua', 'ivory', 'periwinkle'], 6, [sea]));
		c.later((d) => {
			// An eye, throat grooves, barnacles, bubbles, ripples at the surface.
			d.specks([OUTLINE], [body], 1, ['circle', cx - rx * 0.62, cy - ry * 0.05, 1.2]);
			d.hatch(under, [belly], [belly, body, OUTLINE, back ?? spout], 'zig');
			d.specks([belly, spout, OUTLINE], [body], d.n(2, 10), [
				'rect',
				cx - rx * 0.6,
				0,
				rx * 1.4,
				c.h
			]);
			d.specks([spout, belly], [sea], d.n(2, 12));
			d.hatch(['rect', 0, c.h * 0.26, c.w, 2], [sea], [sea, air, spout, body], 'zig');
			d.specks([OUTLINE, body], [air], d.n(0, 4));
		});
		return `${cap(c.nameOf(body))} Whale`;
	},
	turtle(c) {
		const bg = c.color(['teal', 'sky', 'blue', 'mint', 'sand', 'navy'], true);
		c.fill(bg);
		const skin = c.color(['lime', 'green', 'tan', 'mint', 'teal']);
		const shell = c.color(['brown', 'forest', 'amber', 'orange', 'plum']);
		const plate = c.color(['sand', 'tan', 'yellow', 'lime', 'cream']);
		const cx = c.w / 2;
		const cy = c.h * 0.54;
		const rx = c.w * 0.27;
		const ry = c.h * 0.25;
		const head: Shape = ['ellipse', cx, cy - ry - c.h * 0.06, c.w * 0.09, c.h * 0.085];
		c.add(skin, head);
		for (const sx of [-1, 1]) {
			c.add(skin, [
				'poly',
				[
					[cx + sx * rx * 0.5, cy - ry * 0.6],
					[cx + sx * rx * 1.45, cy - ry * 1.05],
					[cx + sx * rx * 1.5, cy - ry * 0.7],
					[cx + sx * rx * 0.7, cy - ry * 0.1]
				]
			]);
			c.add(skin, ['ellipse', cx + sx * rx * 0.8, cy + ry * 0.85, rx * 0.3, ry * 0.2]);
		}
		c.add(skin, [
			'poly',
			[
				[cx - 1.5, cy + ry * 0.8],
				[cx + 1.5, cy + ry * 0.8],
				[cx, cy + ry * 1.3]
			]
		]);
		const shellShape: Shape = ['ellipse', cx, cy, rx, ry];
		c.add(shell, shellShape);
		const s = Math.min(rx, ry);
		c.add(plate, regular(cx, cy, s * 0.36, 6));
		for (let k = 0; k < 6; k++) {
			const t = (k / 6) * Math.PI * 2 + Math.PI / 6;
			c.add(plate, regular(cx + Math.cos(t) * rx * 0.6, cy + Math.sin(t) * ry * 0.6, s * 0.22, 6));
		}
		// New colors: a shaded shell, a darker skin, sea grass, a deeper sea, bubbles.
		let dark: string | undefined;
		c.more((e) => (dark = e.shade(shell, 'lr', 0.3)));
		c.more((e) => e.shade(skin, 'r', 0.3, -1, 4));
		c.more((e) => e.shade(plate, 'lr', 0.3, -1, 4));
		c.more((e) =>
			e.part(
				GREENS_ALL,
				(x, y) => y > c.h * 0.8 && Math.abs(((x * 7) % 11) - 5) < 2 && y > c.h - 2 - ((x * 5) % 4),
				[bg],
				4
			)
		);
		c.more((e) => e.part(bg, ['rect', 0, 0, c.w, c.h * 0.12], [bg], 6, 1));
		c.more((e) => e.glint(shell, 'ul', 0.12, 10));
		c.more((e) => e.sprinkle(['ice', 'seafoam', 'ivory', 'aqua', 'lemon'], 6, [bg]));
		c.later((d) => {
			// Eyes, a patterned rim, spots on the flippers and plates, bubbles.
			d.specks([OUTLINE], [skin], 2, head);
			d.hatch(
				['and', shellShape, ['not', ['ellipse', cx, cy, rx - 2.5, ry - 2.5]]],
				[shell],
				[shell, plate, OUTLINE, dark ?? skin],
				'zig'
			);
			d.specks([plate, OUTLINE], [skin], d.n(2, 10));
			d.specks([shell, skin], [plate], d.n(1, 8));
			d.specks([plate, skin, shell], [bg], d.n(2, 12));
		});
		return `${cap(c.nameOf(shell))} Turtle`;
	},
	fox(c) {
		const bg = c.color(['mint', 'sky', 'cream', 'lilac', 'forest', 'navy'], true);
		c.fill(bg);
		const fur = c.color(['orange', 'coral', 'amber', 'red', 'brown']);
		const cheek = c.color(['white', 'cream']);
		const ear = c.color(['night', 'brown', 'plum', 'navy']);
		const eye = c.color(['yellow', 'lime', 'teal', 'amber', 'mint']);
		const cx = c.w / 2;
		const cy = c.h * 0.54;
		const r = c.w * 0.36;
		for (const sx of [-1, 1]) {
			c.add(fur, [
				'poly',
				[
					[cx + sx * r * 0.98, cy - r * 0.2],
					[cx + sx * r * 0.82, cy - r * 1.22],
					[cx + sx * r * 0.2, cy - r * 0.55]
				]
			]);
			c.add(ear, [
				'poly',
				[
					[cx + sx * r * 0.82, cy - r * 0.42],
					[cx + sx * r * 0.78, cy - r * 1.0],
					[cx + sx * r * 0.42, cy - r * 0.62]
				]
			]);
		}
		const head: Shape = or(
			['ellipse', cx, cy - r * 0.28, r, r * 0.45],
			[
				'poly',
				[
					[cx - r, cy - r * 0.3],
					[cx + r, cy - r * 0.3],
					[cx + r * 0.72, cy + r * 0.22],
					[cx, cy + r * 0.92],
					[cx - r * 0.72, cy + r * 0.22]
				]
			]
		);
		c.add(fur, head);
		for (const sx of [-1, 1]) {
			c.add(cheek, [
				'and',
				head,
				[
					'poly',
					[
						[cx + sx * r * 1.05, cy - r * 0.12],
						[cx + sx * r * 0.12, cy + r * 0.32],
						[cx, cy + r * 0.95],
						[cx + sx * r * 0.7, cy + r * 0.3]
					]
				]
			]);
			c.add(eye, ['ellipse', cx + sx * r * 0.38, cy - r * 0.16, r * 0.13, r * 0.1]);
		}
		c.add(ear, ['circle', cx, cy + r * 0.8, 1.7]);
		// New colors: shaded fur, dark ear tips, ground and leaves, a shaded chin.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(fur, 'lr', 0.3)));
		c.more((e) => e.paint(ear, ['rect', 0, 0, c.w, cy - r * 1.02], [fur]));
		c.more((e) =>
			e.part(
				['moss', 'olive', 'leaf', 'sage', 'pine', 'khaki'],
				['rect', 0, c.h * 0.9, c.w, c.h],
				[bg],
				6
			)
		);
		c.more((e) => e.shade(cheek, 'b', 0.3, -1, 6));
		c.more((e) => e.part(bg, (x, y) => (x + y) % 5 === 0 && y < c.h * 0.88, [bg], 8));
		c.more((e) => e.shade(eye, 'b', 0.4, -1, 3));
		c.more((e) =>
			e.sprinkle(['rust', 'ochre', 'gold', 'tangerine', 'scarlet', 'caramel'], 6, [bg])
		);
		c.later((d) => {
			// Slit pupils, a marked forehead, whisker dots, falling leaves.
			for (const sx of [-1, 1]) {
				d.paint(
					OUTLINE,
					['rect', Math.floor(cx + sx * r * 0.38) - 0.01, cy - r * 0.28, 1, r * 0.24],
					[eye]
				);
			}
			d.hatch(
				['and', head, ['rect', cx - r * 0.3, cy - r * 0.72, r * 0.6, r * 0.42]],
				[fur],
				[fur, OUTLINE, shadow ?? ear, cheek],
				'anti'
			);
			d.specks([OUTLINE, fur], [cheek], d.n(2, 8), ['rect', 0, cy + r * 0.1, c.w, r * 0.4]);
			d.specks([fur, cheek, ear], [bg], d.n(2, 12));
		});
		return `${cap(c.nameOf(fur))} Fox`;
	},
	rabbit(c) {
		const sky = c.color(SKY, true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.8, c.w, c.h]);
		const fur = c.color(['white', 'grey', 'tan', 'brown', 'cream', 'sand']);
		const inner = c.color(['pink', 'rose', 'coral']);
		const carrot = c.color(['orange', 'amber', 'coral']);
		const cx = c.w * 0.42;
		const hx = cx + c.w * 0.1;
		const hy = c.h * 0.44;
		const hr = c.w * 0.14;
		const body: Shape = ['ellipse', cx, c.h * 0.66, c.w * 0.24, c.h * 0.17];
		for (const [dx, tilt] of [
			[-0.35, -1.5],
			[0.35, 1.5]
		]) {
			const ex = hx + dx * hr * 1.2;
			c.add(fur, [
				'poly',
				[
					[ex - 2.2, hy - hr * 0.5],
					[ex + 2.2, hy - hr * 0.5],
					[ex + 2.4 + tilt, hy - hr * 2.5],
					[ex - 2 + tilt, hy - hr * 2.6]
				]
			]);
			c.add(inner, [
				'poly',
				[
					[ex - 0.8, hy - hr * 0.8],
					[ex + 0.8, hy - hr * 0.8],
					[ex + 1 + tilt, hy - hr * 2.3],
					[ex - 0.7 + tilt, hy - hr * 2.35]
				]
			]);
		}
		c.add(fur, body);
		c.add(fur, ['circle', hx, hy, hr]);
		c.add(fur, ['ellipse', cx + c.w * 0.14, c.h * 0.8, c.w * 0.08, c.h * 0.035]);
		c.add(inner, ['circle', hx + hr * 0.85, hy + hr * 0.15, 1.1]);
		const puff = c.color(['white', 'cream', 'sand', 'grey']);
		c.add(puff, ['circle', cx - c.w * 0.25, c.h * 0.62, c.w * 0.06]);
		const kx = c.w * 0.68;
		const ky = c.h * 0.84;
		const carrotShape: Shape = [
			'poly',
			[
				[kx, ky - 1.8],
				[kx, ky + 1.8],
				[kx + c.w * 0.26, ky + 0.2]
			]
		];
		c.add(carrot, carrotShape);
		// New colors: carrot tops, shaded fur, darker soil, a cloud, flowers, a lighter belly.
		c.more((e) =>
			e.part(
				GREENS_ALL,
				any(segment(kx, ky, kx - 3.5, ky - 3.5, 1.8), segment(kx, ky, kx - 4.5, ky - 1, 1.8)),
				[sky, ground],
				3
			)
		);
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(fur, 'lr', 0.3)));
		c.more((e) => e.part(ground, ['rect', 0, c.h * 0.93, c.w, c.h], [ground], 6, -1));
		c.more((e) => {
			const x = c.w * e.r(0.6, 0.85);
			e.part(
				LIGHTS,
				any(['ellipse', x, c.h * 0.12, 4, 1.5], ['circle', x + 1, c.h * 0.12 - 1, 1.7]),
				[sky],
				5
			);
		});
		c.more((e) => e.shade(carrot, 'b', 0.35, -1, 4));
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.08], [sky], 6));
		c.more((e) => e.sprinkle(BLOOMS_ALL, 5, [ground]));
		c.later((d) => {
			// An eye, a dappled flank, carrot ridges, grass and flowers, birds.
			d.specks([OUTLINE], [fur], 1, ['circle', hx + hr * 0.35, hy - hr * 0.2, 1.3]);
			d.hatch(
				['ellipse', cx - c.w * 0.04, c.h * 0.63, c.w * 0.13, c.h * 0.08],
				[fur],
				[fur, OUTLINE, inner, shadow ?? puff],
				'zig'
			);
			d.specks([OUTLINE], [carrot], d.n(2, 4), carrotShape);
			d.hatch(['rect', 0, c.h * 0.8, c.w, 3], [ground], [ground, carrot, fur, inner], 'zig');
			d.specks([carrot, inner, puff], [ground], d.n(2, 10));
			d.specks([OUTLINE], [sky], d.n(1, 6));
		});
		return `${cap(c.nameOf(fur))} Rabbit`;
	},
	bee(c) {
		const bg = c.color(['sky', 'mint', 'cream', 'lilac', 'rose'], true);
		c.fill(bg);
		const body = c.color(['yellow', 'amber', 'orange']);
		const band = c.color(['night', 'brown', 'navy', 'plum']);
		const wing = c.color(['white', 'sky', 'lilac', 'mint', 'cream']);
		const comb = c.color(['amber', 'yellow', 'orange', 'sand', 'tan']);
		const cx = c.w * 0.52;
		const cy = c.h * 0.46;
		const rx = c.w * 0.25;
		const ry = c.h * 0.15;
		const combs: Shape[] = [];
		for (let k = 0; k * 5.6 < c.w + 3; k++) {
			const hex = regular(k * 5.6, c.h * 0.93 - (k % 2) * 3, 3.4, 6);
			combs.push(hex);
			c.add(comb, hex);
		}
		const wings: Shape[] = [
			['ellipse', cx - rx * 0.1, cy - ry * 1.4, rx * 0.42, ry * 0.95],
			['ellipse', cx + rx * 0.4, cy - ry * 1.2, rx * 0.34, ry * 0.8]
		];
		for (const s of wings) c.add(wing, s);
		c.add(band, [
			'poly',
			[
				[cx + rx * 0.9, cy - 1.5],
				[cx + rx * 0.9, cy + 1.5],
				[cx + rx * 1.25, cy]
			]
		]);
		const bodyShape: Shape = ['ellipse', cx, cy, rx, ry];
		c.add(body, bodyShape);
		for (let k = 0; k < 3; k++) {
			c.add(band, ['and', bodyShape, ['rect', cx - rx * 0.4 + k * rx * 0.42, 0, rx * 0.2, c.h]]);
		}
		c.add(band, ['circle', cx - rx * 1.05, cy, ry * 0.75]);
		c.add(
			band,
			path(
				[
					[cx - rx * 1.2, cy - ry * 0.6],
					[cx - rx * 1.45, cy - ry * 1.6],
					[cx - rx * 1.7, cy - ry * 1.8]
				],
				0.9
			)
		);
		// New colors: honey, a shaded body, a flower, glinting wings, pollen.
		c.more((e) => e.shade(comb, 'b', 0.35, -1, 4));
		c.more((e) => e.shade(body, 'b', 0.3, -1, 6));
		c.more((e) =>
			e.part(
				BLOOMS,
				any(['circle', c.w * 0.12, c.h * 0.2, 2.6], ['circle', c.w * 0.88, c.h * 0.62, 2.2]),
				[bg],
				4
			)
		);
		c.more((e) => e.glint(wing, 'ul', 0.25, 6));
		c.more((e) => e.part(bg, ['rect', 0, 0, c.w, c.h * 0.1], [bg], 6));
		c.more((e) => e.sprinkle(['lemon', 'gold', 'ivory', 'apricot', 'lavender'], 6, [bg]));
		c.later((d) => {
			// Veined wings, honey in the comb, an eye, fuzz on the body, pollen.
			for (const s of wings) d.hatch(s, [wing], [wing, bg, OUTLINE, comb], 'diag');
			for (const s of combs) d.hatch(s, [comb], [null, OUTLINE, body, band], 'dots');
			d.specks([wing], [band], 1, ['circle', cx - rx * 1.1, cy - ry * 0.2, 1.5]);
			d.specks([band, wing, OUTLINE], [body], d.n(2, 8));
			d.specks([body, comb, band], [bg], d.n(2, 14));
		});
		return `${cap(c.nameOf(body))} Bee`;
	},
	ladybug(c) {
		const bg = c.color(['cream', 'sky', 'mint', 'sand', 'rose', 'lilac'], true);
		c.fill(bg);
		const leaf = c.color(['green', 'lime', 'forest', 'teal']);
		const shell = c.color(['red', 'orange', 'coral', 'yellow', 'magenta']);
		const spot = c.color(['night', 'navy', 'plum', 'brown']);
		// A leaf across the picture, corner to corner, with the bug on it from above.
		const flip = c.rng() < 0.5;
		const A: [number, number] = [flip ? c.w * 0.97 : c.w * 0.03, c.h * 0.97];
		const B: [number, number] = [flip ? c.w * 0.08 : c.w * 0.92, c.h * 0.06];
		const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
		const [nx, ny] = [-(B[1] - A[1]) / len, (B[0] - A[0]) / len];
		const half = Math.min(c.w, c.h) * 0.3;
		const arc = (w: number, side: number) =>
			Array.from({ length: 13 }, (_, k): [number, number] => {
				const t = k / 12;
				const o = Math.sin(Math.PI * t) ** 0.8 * w * side;
				return [A[0] + (B[0] - A[0]) * t + nx * o, A[1] + (B[1] - A[1]) * t + ny * o];
			});
		const lens = (w: number): Shape => ['poly', [...arc(w, 1), ...arc(w, -1).reverse()]];
		const leafShape = lens(half);
		c.add(leaf, leafShape);
		const bx = c.w / 2 + c.r(-1, 1);
		const by = c.h * 0.54;
		const br = Math.min(c.w, c.h) * 0.27;
		for (const sx of [-1, 1]) {
			for (const dy of [-0.35, 0.15, 0.6]) {
				c.add(
					spot,
					segment(
						bx + sx * br * 0.8,
						by + dy * br,
						bx + sx * br * 1.25,
						by + dy * br + br * 0.2,
						1.4
					)
				);
			}
			c.add(
				spot,
				path(
					[
						[bx + sx * br * 0.2, by - br * 1.25],
						[bx + sx * br * 0.45, by - br * 1.6]
					],
					1
				)
			);
		}
		const head: Shape = ['circle', bx, by - br * 0.95, br * 0.45];
		c.add(spot, head);
		const back: Shape = ['circle', bx, by, br];
		c.add(shell, back);
		c.add(spot, ['and', back, ['rect', bx - 0.6, 0, 1.2, c.h]]);
		for (const sx of [-1, 1]) {
			for (const [dx, dy] of [
				[0.45, -0.4],
				[0.58, 0.15],
				[0.35, 0.62]
			]) {
				c.add(spot, ['circle', bx + sx * dx * br, by + dy * br, br * 0.17]);
			}
		}
		// New colors: a vein, a shaded leaf half, a shiny shell, dew, a deeper ground.
		let vein: string | undefined;
		c.more((e) => (vein = e.part(leaf, segment(A[0], A[1], B[0], B[1], 1.2), [leaf], 3, -1)));
		c.more((e) =>
			e.part(leaf, (x, y) => (x + 0.5 - A[0]) * nx + (y + 0.5 - A[1]) * ny > 0, [leaf], 6, -1)
		);
		c.more((e) => e.shade(shell, 'lr', 0.25));
		c.more((e) => e.glint(shell, 'ul', 0.12, 8));
		c.more((e) => e.part(bg, ['rect', 0, c.h * 0.9, c.w, c.h], [bg], 6, -1));
		c.more((e) => e.sprinkle(['ice', 'aqua', 'seafoam', 'ivory'], 6, [leaf]));
		c.later((d) => {
			// White eyes, a serrated leaf edge, small spots, aphids, dew on the ground.
			d.specks([bg, shell], [spot], 2, ['rect', bx - br * 0.4, by - br * 1.3, br * 0.8, br * 0.25]);
			d.hatch(
				['and', leafShape, ['not', lens(half - 3)]],
				[leaf],
				[leaf, vein ?? spot, bg, shell],
				'zig'
			);
			d.specks([spot, OUTLINE], [shell], d.n(1, 6), back);
			d.specks([shell, spot, bg], [leaf], d.n(2, 10));
			d.specks([leaf, shell], [bg], d.n(2, 12));
		});
		return `${cap(c.nameOf(shell))} Ladybug`;
	},
	cactus(c) {
		const sky = c.color(['sky', 'cream', 'rose', 'lilac', 'mint'], true);
		const sand = c.color(['sand', 'tan', 'amber', 'cream'], true);
		c.fill(sky);
		c.add(sand, ['rect', 0, c.h * 0.8, c.w, c.h]);
		const mesa = c.color(['coral', 'orange', 'plum', 'brown', 'rose']);
		const plant = c.color(['green', 'forest', 'lime', 'teal']);
		const bloom = c.color(['pink', 'magenta', 'red', 'yellow', 'violet']);
		const left = c.rng() < 0.5;
		const mx = left ? c.w * 0.78 : c.w * 0.22;
		const mesaShape: Shape = [
			'poly',
			[
				[mx - c.w * 0.24, c.h * 0.82],
				[mx - c.w * 0.14, c.h * 0.55],
				[mx + c.w * 0.14, c.h * 0.55],
				[mx + c.w * 0.24, c.h * 0.82]
			]
		];
		c.add(mesa, mesaShape);
		const cx = left ? c.w * 0.4 : c.w * 0.6;
		const tw = Math.max(7, c.w * 0.2);
		const trunk = roundRect(cx - tw / 2, c.h * 0.2, tw, c.h * 0.66, tw / 2);
		c.add(plant, trunk);
		const aw = Math.max(4.5, c.w * 0.12);
		const ly = c.h * c.r(0.46, 0.54);
		const ry = c.h * c.r(0.38, 0.46);
		c.add(plant, roundRect(cx - tw / 2 - aw * 2, ly, aw * 2 + 1, aw, aw / 2));
		c.add(plant, roundRect(cx - tw / 2 - aw * 2, ly - c.h * 0.18, aw, c.h * 0.18 + aw, aw / 2));
		c.add(plant, roundRect(cx + tw / 2 - 1, ry, aw * 2 + 1, aw, aw / 2));
		c.add(plant, roundRect(cx + tw / 2 + aw, ry - c.h * 0.15, aw, c.h * 0.15 + aw, aw / 2));
		c.add(bloom, ['circle', cx, c.h * 0.2, 2.6]);
		const sun = c.color(['yellow', 'white', 'orange', 'amber']);
		c.add(sun, ['circle', left ? c.w * 0.16 : c.w * 0.84, c.h * 0.14, 3]);
		// New colors: shaded ribs, the mesa's dark face, dunes, a deeper sky, rocks.
		let rib: string | undefined;
		c.more((e) => (rib = e.part(plant, (x) => (x - Math.floor(cx)) % 3 === 0, [plant], 6, -1)));
		c.more((e) =>
			e.part(
				mesa,
				['rect', left ? mx + c.w * 0.04 : 0, 0, left ? c.w : mx - c.w * 0.04, c.h],
				[mesa],
				4,
				-1
			)
		);
		c.more((e) =>
			e.part(sand, ['ellipse', c.w * 0.5, c.h * 1.02, c.w * 0.6, c.h * 0.1], [sand], 6, -1)
		);
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.12], [sky], 6));
		c.more((e) =>
			e.part(
				GREYS.concat(BROWNS),
				any(
					['ellipse', c.w * 0.1, c.h * 0.88, 2.5, 1.3],
					['ellipse', c.w * 0.92, c.h * 0.92, 2.2, 1.2]
				),
				[sand],
				3
			)
		);
		c.more((e) => e.shade(bloom, 'b', 0.4, -1, 4));
		c.later((d) => {
			// Spines, strata in the mesa, pebbles and tracks in the sand, birds.
			d.specks([sky, bloom, sand], [plant], d.n(4, 16));
			d.hatch(
				['rect', 0, c.h * 0.62, c.w, c.h * 0.12],
				[mesa],
				[mesa, sand, OUTLINE, rib ?? plant],
				'anti'
			);
			d.hatch(['rect', 0, c.h * 0.84, c.w, c.h], [sand], [null, plant, mesa, bloom], 'dots');
			d.specks([OUTLINE], [sky], d.n(1, 6));
			d.specks([plant, mesa], [sand], d.n(1, 6));
		});
		return `${cap(c.nameOf(bloom))} Cactus`;
	},
	sunflower(c) {
		const sky = c.color(['sky', 'blue', 'mint', 'cream', 'dusk'], true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.84, c.w, c.h]);
		const stem = c.color(['green', 'forest', 'lime']);
		const petal = c.color(['yellow', 'amber', 'orange']);
		const seeds = c.color(['brown', 'plum', 'night']);
		const cx = c.w * 0.5 + c.r(-2, 2);
		const cy = c.h * 0.34;
		const R = c.w * 0.15;
		c.add(stem, ['rect', cx - 1.4, cy, 2.8, c.h]);
		c.add(stem, ['ellipse', cx + 5, c.h * 0.66, 5, 2]);
		c.add(stem, ['ellipse', cx - 5, c.h * 0.56, 5, 2]);
		c.add(petal, star(cx, cy, R * 1.9, R * 1.15, 14, c.r(0, 1)));
		const middle: Shape = ['circle', cx, cy, R];
		c.add(seeds, middle);
		const sx = cx < c.w / 2 ? c.w * 0.82 : c.w * 0.18;
		c.add(stem, ['rect', sx - 1, c.h * 0.6, 2, c.h]);
		c.add(petal, star(sx, c.h * 0.6, R * 1.1, R * 0.7, 10));
		c.add(seeds, ['circle', sx, c.h * 0.6, R * 0.55]);
		// New colors: shaded petals, a lighter ring of seeds, leaf shade, a cloud, a fence.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(petal, 'lr', 0.3)));
		let rim: string | undefined;
		c.more((e) => (rim = e.part(seeds, ring(cx, cy, R + 0.5, R * 0.62), [seeds], 4, 1)));
		c.more((e) => e.shade(stem, 'r', 0.4, -1, 6));
		c.more((e) => {
			const x = c.w * e.r(0.1, 0.3);
			e.part(
				LIGHTS,
				any(['ellipse', x, c.h * 0.1, 4, 1.5], ['circle', x + 1, c.h * 0.1 - 1, 1.7]),
				[sky],
				5
			);
		});
		c.more((e) =>
			e.part(
				BROWNS.concat(['beige', 'stone']),
				(x, y) => (y === Math.floor(c.h * 0.78) || x % 4 === 0) && y > c.h * 0.74 && y < c.h * 0.84,
				[sky],
				6
			)
		);
		c.more((e) => e.part(ground, ['rect', 0, c.h * 0.94, c.w, c.h], [ground], 6, -1));
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.06], [sky], 6));
		c.later((d) => {
			// Seeds in a spiral-ish weave, bees in the sky, grass and clover.
			d.hatch(['circle', cx, cy, R * 0.8], [seeds], [seeds, OUTLINE, petal, rim ?? stem], 'diag');
			d.specks([seeds, shadow], [petal], d.n(2, 8));
			d.specks([sky], [stem], d.n(0, 4));
			d.hatch(['rect', 0, c.h * 0.84, c.w, 3], [ground], [ground, stem, petal, seeds], 'zig');
			d.specks([petal, seeds], [ground], d.n(1, 8));
			d.specks([petal, OUTLINE], [sky], d.n(1, 8));
		});
		return `${cap(c.nameOf(petal))} Sunflower`;
	},
	teapot(c) {
		const wall = c.color(['cream', 'mint', 'sky', 'rose', 'lilac', 'sand'], true);
		const table = c.color(['brown', 'tan', 'red', 'blue', 'teal', 'plum'], true);
		c.fill(wall);
		c.add(table, ['rect', 0, c.h * 0.78, c.w, c.h]);
		const pot = c.color(['blue', 'teal', 'red', 'white', 'violet', 'green', 'pink']);
		const trim = c.color(['yellow', 'amber', 'white', 'navy', 'plum', 'cream']);
		const cx = c.w * 0.46;
		const bodyShape: Shape = [
			'and',
			['ellipse', cx, c.h * 0.6, c.w * 0.27, c.h * 0.21],
			['rect', 0, 0, c.w, c.h * 0.79]
		];
		c.add(pot, [
			'and',
			ring(cx - c.w * 0.27, c.h * 0.58, c.h * 0.13, c.h * 0.13 - 3.4),
			['rect', 0, 0, cx - c.w * 0.24, c.h]
		]);
		c.add(pot, [
			'poly',
			[
				[cx + c.w * 0.18, c.h * 0.54],
				[cx + c.w * 0.2, c.h * 0.7],
				[cx + c.w * 0.45, c.h * 0.42],
				[cx + c.w * 0.45, c.h * 0.37],
				[cx + c.w * 0.38, c.h * 0.39]
			]
		]);
		c.add(pot, bodyShape);
		const band: Shape = ['and', bodyShape, ['rect', 0, c.h * 0.58, c.w, 3]];
		c.add(trim, band);
		c.add(trim, [
			'and',
			['ellipse', cx, c.h * 0.42, c.w * 0.16, c.h * 0.07],
			['rect', 0, 0, c.w, c.h * 0.43]
		]);
		c.add(trim, ['circle', cx, c.h * 0.33, 1.8]);
		// New colors: steam, a shaded pot, a table edge, wallpaper stripes, a cup.
		c.more((e) =>
			e.part(
				['ivory', 'ice', 'ash', 'lavender', 'white'],
				path(
					[
						[cx + c.w * 0.45, c.h * 0.33],
						[cx + c.w * 0.42, c.h * 0.24],
						[cx + c.w * 0.47, c.h * 0.15],
						[cx + c.w * 0.43, c.h * 0.06]
					],
					1.5
				),
				[wall],
				3
			)
		);
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(pot, 'lr', 0.3)));
		c.more((e) => e.part(table, ['rect', 0, c.h * 0.78, c.w, 1.5], [table], 6, 1));
		c.more((e) => e.part(wall, (x, y) => x % 5 === 2 && e.at(x, y) === wall, [wall], 8));
		c.more((e) => e.glint(pot, 'ul', 0.12, 10));
		c.more((e) =>
			e.part(
				BRIGHTS,
				[
					'and',
					['rect', c.w * 0.04, c.h * 0.68, c.w * 0.14, c.h * 0.1],
					['not', ['rect', 0, 0, c.w, c.h * 0.68]]
				],
				[wall],
				6
			)
		);
		c.later((d) => {
			// A painted band, polka dots on the pot, a checked tablecloth.
			d.hatch(band, [trim], [trim, pot, OUTLINE, shadow ?? table], 'zig');
			d.specks([trim, wall], [pot], d.n(3, 10), bodyShape);
			d.hatch(['rect', 0, c.h * 0.81, c.w, c.h], [table], [table, wall, pot, trim], 'diag');
			d.specks([pot, trim], [wall], d.n(1, 8));
		});
		return `${cap(c.nameOf(pot))} Teapot`;
	},
	guitar(c) {
		const bg = c.color(['cream', 'mint', 'sky', 'rose', 'lilac', 'dusk'], true);
		c.fill(bg);
		const wood = c.color(['amber', 'orange', 'brown', 'red', 'tan', 'coral']);
		const neck = c.color(['brown', 'plum', 'night', 'tan']);
		const guard = c.color(['night', 'white', 'cream', 'red', 'navy']);
		const cx = c.w / 2;
		const lower: Shape = ['circle', cx, c.h * 0.71, c.w * 0.24];
		const upper: Shape = ['circle', cx, c.h * 0.49, c.w * 0.18];
		c.add(neck, ['rect', cx - 2, c.h * 0.08, 4, c.h * 0.4]);
		c.add(neck, roundRect(cx - 3.2, c.h * 0.015, 6.4, c.h * 0.1, 1.5));
		c.add(wood, lower);
		c.add(wood, upper);
		c.add(wood, ['rect', cx - c.w * 0.15, c.h * 0.5, c.w * 0.3, c.h * 0.2]);
		c.add(guard, ['ellipse', cx + c.w * 0.1, c.h * 0.66, c.w * 0.07, c.h * 0.07]);
		c.add(neck, ['circle', cx, c.h * 0.56, c.w * 0.075]);
		const bridge: Shape = ['rect', cx - 4, c.h * 0.8, 8, 1.6];
		c.add(neck, bridge);
		// New colors: a rosette, shaded wood, a rug, wallpaper, notes in the air.
		let rosette: string | undefined;
		c.more(
			(e) =>
				(rosette = e.part(BRIGHTS, ring(cx, c.h * 0.56, c.w * 0.075 + 2, c.w * 0.075), [wood], 4))
		);
		c.more((e) => e.shade(wood, 'lr', 0.3));
		c.more((e) =>
			e.part(BROWNS.concat(['denim', 'wine', 'grape']), ['rect', 0, c.h * 0.92, c.w, c.h], [bg], 6)
		);
		c.more((e) => e.part(bg, (x, y) => (x + 2 * y) % 7 === 0, [bg], 8));
		c.more((e) => e.shade(neck, 'r', 0.4, -1, 4));
		c.more((e) => e.glint(wood, 'ul', 0.1, 12));
		c.more((e) => e.sprinkle(['ink', 'charcoal', 'grape', 'cobalt', 'crimson'], 6, [bg]));
		c.later((d) => {
			// Frets and pegs, an inlaid rosette, grain, strings over the hole, notes.
			for (let y = Math.floor(c.h * 0.12); y < c.h * 0.46; y += 3)
				d.paint(guard, ['rect', cx - 2, y, 4, 1], [neck]);
			d.hatch(
				ring(cx, c.h * 0.56, c.w * 0.075 + 2, c.w * 0.075),
				[rosette ?? wood],
				[rosette ?? wood, wood, OUTLINE, guard],
				'diag'
			);
			d.specks([neck, OUTLINE, guard], [wood], d.n(2, 10));
			d.specks([guard, wood], [neck], d.n(1, 4), ['circle', cx, c.h * 0.56, c.w * 0.075]);
			d.specks([wood, neck, guard], [bg], d.n(2, 12));
		});
		return `${cap(c.nameOf(wood))} Guitar`;
	},
	bicycle(c) {
		const sky = c.color(SKY, true);
		const road = c.color(['grey', 'sand', 'tan', 'green', 'lime'], true);
		c.fill(sky);
		c.add(road, ['rect', 0, c.h * 0.8, c.w, c.h]);
		const tire = c.color(['night', 'navy', 'brown', 'plum']);
		const frame = c.color(['red', 'teal', 'blue', 'orange', 'magenta', 'violet', 'lime']);
		const seat = c.color(['brown', 'tan', 'cream', 'yellow', 'white']);
		const R = Math.min(c.w * 0.21, c.h * 0.22);
		const wy = c.h * 0.8 - R + 1;
		const x0 = c.w * 0.25;
		const x1 = c.w * 0.75;
		const hubs: [number, number][] = [
			[x0, wy],
			[x1, wy]
		];
		for (const [hx] of hubs) {
			for (let k = 0; k < 4; k++) {
				const t = (k / 4) * Math.PI + 0.4;
				c.add(
					tire,
					segment(
						hx - Math.cos(t) * R,
						wy - Math.sin(t) * R,
						hx + Math.cos(t) * R,
						wy + Math.sin(t) * R,
						0.9
					)
				);
			}
			c.add(tire, ring(hx, wy, R, R - 3.8));
			c.add(seat, ['circle', hx, wy, 1.6]);
		}
		const bb: [number, number] = [c.w * 0.47, wy];
		const st: [number, number] = [c.w * 0.42, wy - R * 1.15];
		const hd: [number, number] = [c.w * 0.68, wy - R * 1.1];
		const bar = 2.8;
		c.add(frame, path([[x0, wy], st, bb, [x0, wy]], bar));
		c.add(frame, path([st, hd, bb], bar));
		c.add(frame, path([hd, [x1, wy]], bar * 0.9));
		c.add(frame, path([hd, [hd[0] - 1, hd[1] - R * 0.45], [hd[0] - 4, hd[1] - R * 0.45]], 2.2));
		c.add(seat, roundRect(st[0] - 3, st[1] - 2.5, 6.5, 2.6, 1));
		// New colors: a shaded frame, a curb, a cloud, sky, flowers, a bell.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(frame, 'b', 0.3, -1, 6)));
		c.more((e) => e.part(road, ['rect', 0, c.h * 0.93, c.w, c.h], [road], 6, -1));
		c.more((e) => {
			const x = c.w * e.r(0.3, 0.7);
			e.part(
				LIGHTS,
				any(['ellipse', x, c.h * 0.12, 4.5, 1.6], ['circle', x + 1, c.h * 0.12 - 1, 1.8]),
				[sky],
				5
			);
		});
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.07], [sky], 6));
		c.more((e) =>
			e.part(
				GREENS_ALL,
				(x, y) => y > c.h * 0.74 && y < c.h * 0.8 && x % 6 < 2 && e.at(x, y) === sky,
				[sky],
				4
			)
		);
		c.more((e) => e.shade(seat, 'b', 0.4, -1, 3));
		c.more((e) => e.sprinkle(BLOOMS_ALL, 5, [road]));
		c.later((d) => {
			// Reflectors, sky through the spokes, a dashed road, birds.
			d.specks([seat, OUTLINE], [frame], d.n(2, 8));
			for (const [hx] of hubs)
				d.specks([frame, seat, road], [sky], d.n(1, 4), ['circle', hx, wy, R - 4]);
			d.hatch(['rect', 0, c.h * 0.86, c.w, 2], [road], [road, seat, frame, shadow ?? tire], 'zig');
			d.specks([frame, tire], [road], d.n(1, 8));
			d.specks([OUTLINE, frame], [sky], d.n(1, 8), ['rect', 0, 0, c.w, c.h * 0.4]);
		});
		return `${cap(c.nameOf(frame))} Bicycle`;
	},
	umbrella(c) {
		const sky = c.color(['grey', 'dusk', 'lilac', 'sky', 'navy'], true);
		const ground = c.color(['grey', 'teal', 'blue', 'tan', 'forest', 'brown'], true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.86, c.w, c.h]);
		const canopy = c.color(WARM.concat(['violet', 'teal', 'blue', 'lime']));
		const panel = c.color(WARM.concat(COOL, ['white', 'cream']));
		const handle = c.color(['brown', 'night', 'tan', 'plum']);
		const cx = c.w / 2;
		const cy = c.h * 0.44;
		const R = c.w * 0.42;
		const H = c.h * 0.3;
		const n = c.ri(5, 7);
		const scallops: Shape[] = Array.from({ length: n }, (_, k): Shape => [
			'not',
			['circle', cx - R + ((k + 0.5) * 2 * R) / n, cy + (R / n) * 0.55, R / n]
		]);
		const dome: Shape = ['and', ['ellipse', cx, cy, R, H], ['rect', 0, 0, c.w, cy], ...scallops];
		c.add(handle, ['rect', cx - 1.5, cy - H - 2, 3, c.h * 0.42 + H]);
		c.add(handle, [
			'and',
			ring(cx + 3, cy + c.h * 0.4, 4.6, 1.6),
			['rect', 0, cy + c.h * 0.4, c.w, c.h]
		]);
		c.add(canopy, dome);
		for (let k = 1; k < n; k += 2) {
			const xa = cx - R + (k * 2 * R) / n;
			const xb = cx - R + ((k + 1) * 2 * R) / n;
			c.add(panel, [
				'and',
				dome,
				[
					'poly',
					[
						[cx, cy - H - 1],
						[xa, cy + 2],
						[xb, cy + 2]
					]
				]
			]);
		}
		// New colors: rain, a shaded canopy, a puddle, a curb, a lighter tip.
		c.more((e) =>
			e.part(
				['ice', 'aqua', 'periwinkle', 'seafoam', 'azure'],
				(x, y) => y < c.h * 0.84 && mod(x - Math.floor(y / 2), 7) === 0 && mod(y, 5) !== 4,
				[sky],
				6
			)
		);
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(canopy, 'lr', 0.3)));
		c.more((e) =>
			e.part(
				['ice', 'steel', 'periwinkle', 'slate', 'denim'],
				['ellipse', c.w * 0.62, c.h * 0.94, c.w * 0.26, c.h * 0.04],
				[ground],
				6
			)
		);
		c.more((e) => e.shade(panel, 'lr', 0.3, -1, 6));
		c.more((e) => e.part(ground, ['rect', 0, c.h * 0.86, c.w, 1.5], [ground], 6, 1));
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.1], [sky], 6, -1));
		c.later((d) => {
			// A trimmed edge, polka dots, splashes in the puddle and on the street.
			d.hatch(
				['and', dome, ['rect', 0, cy - 2.5, c.w, 2.5]],
				[canopy, panel],
				[canopy, panel, handle, shadow ?? OUTLINE],
				'zig'
			);
			d.specks([panel, sky], [canopy], d.n(2, 10), dome);
			d.specks([canopy, sky], [panel], d.n(1, 6), dome);
			d.hatch(['rect', 0, c.h * 0.9, c.w, c.h], [ground], [null, sky, canopy, panel], 'dots');
			d.specks([ground, panel], [sky], d.n(2, 10));
		});
		return `${cap(c.nameOf(canopy))} Umbrella`;
	},
	airballoon(c) {
		const sky = c.color(['sky', 'cream', 'mint', 'rose', 'lilac', 'dusk'], true);
		const hills = c.color(['green', 'forest', 'lime', 'teal'], true);
		c.fill(sky);
		c.add(hills, ['ellipse', c.w * 0.25, c.h * 1.05, c.w * 0.55, c.h * 0.2]);
		c.add(hills, ['ellipse', c.w * 0.85, c.h * 1.08, c.w * 0.45, c.h * 0.18]);
		const a = c.color(WARM);
		const b = c.color(COOL.concat(['white', 'cream', 'yellow']));
		const basket = c.color(['brown', 'tan', 'sand']);
		const cx = c.w * 0.5 + c.r(-2, 2);
		const cy = c.h * 0.33;
		const R = c.w * 0.27;
		const envelope: Shape = or(
			['circle', cx, cy, R],
			[
				'poly',
				[
					[cx - R * 0.93, cy + R * 0.35],
					[cx + R * 0.93, cy + R * 0.35],
					[cx + R * 0.3, cy + R * 1.35],
					[cx - R * 0.3, cy + R * 1.35]
				]
			]
		);
		c.add(a, envelope);
		c.add(b, ['and', envelope, ['ellipse', cx, cy + R * 0.2, R * 0.7, R * 2]]);
		c.add(a, ['and', envelope, ['ellipse', cx, cy + R * 0.2, R * 0.32, R * 2]]);
		const by = cy + R * 1.65;
		c.add(basket, segment(cx - R * 0.3, cy + R * 1.3, cx - R * 0.22, by, 0.8));
		c.add(basket, segment(cx + R * 0.3, cy + R * 1.3, cx + R * 0.22, by, 0.8));
		const box: Shape = ['rect', cx - R * 0.28, by, R * 0.56, R * 0.45];
		c.add(basket, box);
		const fx = cx < c.w / 2 ? c.w * 0.85 : c.w * 0.15;
		c.add(b, ['circle', fx, c.h * 0.22, 2.4]);
		c.add(basket, ['rect', fx - 0.8, c.h * 0.22 + 2.6, 1.6, 1.6]);
		// New colors: a band round the middle, shading, hills, clouds, birds.
		let band: string | undefined;
		c.more(
			(e) =>
				(band = e.part(BRIGHTS, ['and', envelope, ['rect', 0, cy + R * 0.25, c.w, 2.5]], [a, b], 6))
		);
		c.more((e) => e.shade(a, 'lr', 0.3));
		c.more((e) => e.shade(b, 'lr', 0.3, -1, 6));
		c.more((e) => e.part(hills, ['rect', 0, c.h * 0.94, c.w, c.h], [hills], 6, -1));
		c.more((e) => {
			const x = c.w * e.r(0.1, 0.3);
			e.part(
				LIGHTS,
				any(['ellipse', x, c.h * 0.7, 4.5, 1.6], ['circle', x + 1, c.h * 0.7 - 1, 1.8]),
				[sky],
				5
			);
		});
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.08], [sky], 6));
		c.more((e) => e.shade(basket, 'b', 0.4, -1, 3));
		c.later((d) => {
			// A patterned band, a woven basket, patches on the gores, birds and specks.
			d.hatch(
				['and', envelope, ['rect', 0, cy + R * 0.25, c.w, 2.5]],
				[band ?? a],
				[band ?? a, a, b, OUTLINE],
				'zig'
			);
			d.hatch(box, [basket], [basket, OUTLINE, a, b], 'diag');
			d.specks([b, OUTLINE], [a], d.n(2, 10), envelope);
			d.specks([a, basket], [b], d.n(1, 8), envelope);
			d.hatch(['rect', 0, c.h * 0.92, c.w, 2], [hills], [hills, a, b, basket], 'zig');
			d.specks([OUTLINE, a], [sky], d.n(2, 10));
		});
		return `${cap(c.nameOf(a))} Air Balloon`;
	},
	castle(c) {
		const sky = c.color(SKY, true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.83, c.w, c.h]);
		const wall = c.color(['grey', 'sand', 'tan', 'cream', 'lilac']);
		const roof = c.color(['red', 'navy', 'blue', 'plum', 'violet', 'teal']);
		const gate = c.color(['brown', 'night', 'plum']);
		const flag = c.color(WARM.concat(['lime', 'sky', 'yellow']));
		const cx = c.w / 2;
		const x0 = c.w * 0.2;
		const x1 = c.w * 0.8;
		const top = c.h * 0.52;
		const base = c.h * 0.85;
		const wallShape: Shape = ['rect', x0, top, x1 - x0, base - top];
		c.add(wall, wallShape);
		for (let x = x0; x < x1 - 1; x += 4) c.add(wall, ['rect', x, top - 2, 2.2, 2.1]);
		const towers = [x0, x1, cx];
		const roofs: Shape[] = [];
		towers.forEach((tx, k) => {
			const tw = k === 2 ? 4.2 : 3.6;
			const tt = k === 2 ? c.h * 0.3 : c.h * 0.38;
			c.add(wall, ['rect', tx - tw, tt, tw * 2, base - tt]);
			const rs: Shape = [
				'poly',
				[
					[tx - tw - 1, tt + 0.5],
					[tx + tw + 1, tt + 0.5],
					[tx, tt - c.h * 0.17]
				]
			];
			roofs.push(rs);
			c.add(roof, rs);
			c.add(gate, ['rect', tx - 1, tt + 3, 2, 3]);
			c.add(gate, ['rect', tx - 0.4, tt - c.h * 0.24, 0.8, c.h * 0.08]);
			c.add(flag, [
				'poly',
				[
					[tx + 0.3, tt - c.h * 0.24],
					[tx + 4, tt - c.h * 0.215],
					[tx + 0.3, tt - c.h * 0.19]
				]
			]);
		});
		const arch: Shape = or(['rect', cx - 3, base - 6, 6, 6], ['circle', cx, base - 6, 3]);
		c.add(gate, arch);
		// New colors: a moat, a shaded wall, a shaded roof, a road, a cloud, banners.
		c.more((e) =>
			e.part(
				['azure', 'cerulean', 'cyan', 'cobalt', 'aqua'],
				['rect', 0, c.h * 0.88, c.w, 2.5],
				[ground],
				6
			)
		);
		let side: string | undefined;
		c.more((e) => (side = e.shade(wall, 'r', 0.25)));
		c.more((e) => e.shade(roof, 'r', 0.4, -1, 4));
		c.more((e) =>
			e.part(
				['stone', 'beige', 'khaki', 'ash', 'sand'],
				[
					'poly',
					[
						[cx - 3, base],
						[cx + 3, base],
						[cx + 6, c.h],
						[cx - 6, c.h]
					]
				],
				[ground],
				4
			)
		);
		c.more((e) => {
			const x = c.w * e.r(0.1, 0.9);
			e.part(
				LIGHTS,
				any(['ellipse', x, c.h * 0.08, 4, 1.4], ['circle', x + 1, c.h * 0.08 - 1, 1.6]),
				[sky],
				5
			);
		});
		c.more((e) =>
			e.part(
				BRIGHTS,
				any(['rect', x0 + 4, top + 2, 2.5, 5], ['rect', x1 - 6.5, top + 2, 2.5, 5]),
				[wall],
				4
			)
		);
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.08], [sky], 6));
		c.later((d) => {
			// Stonework, tiled roofs, a portcullis, flowers, birds.
			d.hatch(wallShape, [wall], [null, OUTLINE, roof, gate], 'dots');
			d.hatch(roofs[2], [roof], [roof, wall, flag, side ?? OUTLINE], 'zig');
			for (let x = Math.floor(cx - 3); x < cx + 3; x += 2)
				d.paint(OUTLINE, ['rect', x, 0, 1, c.h], [gate]);
			d.specks([flag, roof, wall], [ground], d.n(2, 10));
			d.specks([OUTLINE], [sky], d.n(1, 6));
		});
		return `${cap(c.nameOf(roof))} Castle`;
	},
	windmill(c) {
		const sky = c.color(SKY, true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.78, c.w, c.h]);
		const tower = c.color(['white', 'cream', 'tan', 'sand', 'grey', 'red']);
		const capk = c.color(['red', 'brown', 'navy', 'plum', 'green']);
		const sail = c.color(['cream', 'white', 'sand', 'tan', 'yellow']);
		const door = c.color(['brown', 'blue', 'green', 'navy']);
		const cx = c.w * 0.5 + c.r(-1.5, 1.5);
		const hy = c.h * 0.33;
		const towerShape: Shape = [
			'poly',
			[
				[cx - c.w * 0.15, c.h * 0.8],
				[cx + c.w * 0.15, c.h * 0.8],
				[cx + c.w * 0.085, hy],
				[cx - c.w * 0.085, hy]
			]
		];
		c.add(tower, towerShape);
		c.add(capk, [
			'and',
			['ellipse', cx, hy + 1, c.w * 0.12, c.h * 0.1],
			['rect', 0, 0, c.w, hy + 1.5]
		]);
		const L = Math.min(c.w, c.h) * 0.43;
		const turn = c.r(0, Math.PI / 2);
		const blades: Shape[] = [];
		for (let k = 0; k < 4; k++) {
			const t = turn + (k * Math.PI) / 2;
			const blade = segment(
				cx + Math.cos(t) * 2.5,
				hy + Math.sin(t) * 2.5,
				cx + Math.cos(t) * L,
				hy + Math.sin(t) * L,
				4.4
			);
			blades.push(blade);
			c.add(sail, blade);
		}
		c.add(capk, ['circle', cx, hy, 1.8]);
		c.add(door, or(['rect', cx - 2, c.h * 0.71, 4, c.h * 0.1], ['circle', cx, c.h * 0.71, 2]));
		c.add(door, ['circle', cx, c.h * 0.55, 1.6]);
		// New colors: fields in stripes, a shaded tower, a shaded cap, a cloud, tulips.
		c.more((e) =>
			e.part(
				['khaki', 'ochre', 'gold', 'chartreuse', 'mustard', 'sage'],
				(x, y) => y > c.h * 0.8 && Math.floor((x + y * 0.8) / 5) % 2 === 0,
				[ground],
				8
			)
		);
		let side: string | undefined;
		c.more((e) => (side = e.part(tower, ['rect', cx + c.w * 0.03, 0, c.w, c.h], [tower], 4, -1)));
		c.more((e) => e.shade(capk, 'r', 0.4, -1, 4));
		c.more((e) => {
			const x = c.w * e.r(0.1, 0.9);
			e.part(
				LIGHTS,
				any(['ellipse', x, c.h * 0.08, 4, 1.4], ['circle', x + 1, c.h * 0.08 - 1, 1.6]),
				[sky],
				5
			);
		});
		c.more((e) => e.shade(sail, 'b', 0.3, -1, 6));
		c.more((e) => e.part(sky, ['rect', 0, c.h * 0.66, c.w, c.h * 0.12], [sky], 6));
		c.more((e) => e.sprinkle(BLOOMS, 6, [ground]));
		c.later((d) => {
			// Latticed sails, bricks, a window cross, tulips in rows, birds.
			for (const b of blades) d.hatch(b, [sail], [sail, OUTLINE, capk, side ?? door], 'zig');
			d.hatch(towerShape, [tower], [null, OUTLINE, capk, door], 'dots');
			d.specks([capk, sail, door], [ground], d.n(2, 12));
			d.specks([OUTLINE], [sky], d.n(1, 6));
		});
		return `${cap(c.nameOf(capk))} Windmill`;
	},
	train(c) {
		const sky = c.color(SKY, true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.8, c.w, c.h]);
		const engine = c.color(['red', 'green', 'blue', 'navy', 'forest', 'plum', 'teal']);
		const trim = c.color(['yellow', 'amber', 'sand', 'cream', 'white']);
		const wheel = c.color(['night', 'brown', 'grey', 'navy']);
		const smoke = c.color(['white', 'grey', 'cream', 'lilac']);
		const boiler: Shape = ['rect', c.w * 0.1, c.h * 0.5, c.w * 0.44, c.h * 0.21];
		c.add(engine, boiler);
		c.add(engine, ['circle', c.w * 0.1, c.h * 0.605, c.h * 0.105]);
		c.add(engine, ['rect', c.w * 0.5, c.h * 0.33, c.w * 0.22, c.h * 0.38]);
		c.add(trim, ['rect', c.w * 0.48, c.h * 0.3, c.w * 0.26, 2.4]);
		const win: Shape = ['rect', c.w * 0.55, c.h * 0.38, c.w * 0.12, c.h * 0.1];
		c.add(trim, win);
		c.add(engine, ['rect', c.w * 0.17, c.h * 0.36, 3.6, c.h * 0.15]);
		c.add(trim, ['rect', c.w * 0.17 - 1, c.h * 0.33, 5.6, 2.2]);
		c.add(trim, [
			'poly',
			[
				[c.w * 0.08, c.h * 0.7],
				[c.w * 0.02, c.h * 0.79],
				[c.w * 0.16, c.h * 0.79]
			]
		]);
		const car: Shape = ['rect', c.w * 0.76, c.h * 0.45, c.w * 0.22, c.h * 0.26];
		c.add(trim, ['rect', c.w * 0.72, c.h * 0.66, c.w * 0.06, 1.6]);
		c.add(engine, car);
		const r = c.h * 0.07;
		const wheels = [0.2, 0.33, 0.46, 0.62, 0.81, 0.92];
		for (const x of wheels)
			c.add(wheel, ['circle', c.w * x, c.h * 0.75, x === 0.46 || x === 0.33 ? r * 1.25 : r]);
		const puffs: Shape[] = [
			['circle', c.w * 0.21, c.h * 0.27, 2.6],
			['circle', c.w * 0.28, c.h * 0.19, 3.2],
			['circle', c.w * 0.38, c.h * 0.12, 3.6]
		];
		for (const p of puffs) c.add(smoke, p);
		// New colors: rails, a shaded engine, shaded smoke, lit windows, sky, flowers.
		c.more((e) => e.part(GREYS.concat(BROWNS), ['rect', 0, c.h * 0.8, c.w, 2], [ground], 6));
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(engine, 'b', 0.25)));
		c.more((e) => e.shade(smoke, 'lr', 0.35, -1, 6));
		c.more((e) => e.part(['lemon', 'gold', 'ice', 'apricot', 'ivory'], win, [trim], 4));
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.06], [sky], 6));
		c.more((e) => e.part(BRIGHTS, ['rect', c.w * 0.1, c.h * 0.6, c.w * 0.44, 1.5], [engine], 4));
		c.more((e) => e.sprinkle(BLOOMS_ALL, 5, [ground], ['rect', 0, c.h * 0.84, c.w, c.h]));
		c.later((d) => {
			// Rivets, a lined boiler, hubs, a puffy cloud of smoke, sleepers, birds.
			d.hatch(
				['rect', c.w * 0.12, c.h * 0.52, c.w * 0.38, 3],
				[engine],
				[engine, trim, OUTLINE, shadow ?? wheel],
				'zig'
			);
			d.specks([trim, OUTLINE], [engine], d.n(2, 10));
			d.specks([trim], [wheel], wheels.length);
			for (const p of puffs) d.hatch(p, [smoke], [null, sky, wheel, trim], 'dots');
			d.hatch(['rect', 0, c.h * 0.84, c.w, 2], [ground], [ground, wheel, trim, engine], 'zig');
			d.specks([OUTLINE], [sky], d.n(1, 6));
		});
		return `${cap(c.nameOf(engine))} Train`;
	},
	crab(c) {
		const sand = c.color(['sand', 'tan', 'cream', 'rose'], true);
		const sea = c.color(['blue', 'teal', 'sky', 'navy'], true);
		c.fill(sand);
		c.add(sea, ['rect', 0, 0, c.w, c.h * 0.2]);
		const shell = c.color(['red', 'orange', 'coral', 'magenta', 'violet']);
		const eye = c.color(['white', 'cream', 'yellow']);
		const star2 = c.color(['pink', 'violet', 'yellow', 'coral', 'lime']);
		const cx = c.w / 2;
		const cy = c.h * 0.58;
		const rx = c.w * 0.24;
		const ry = c.h * 0.15;
		for (const sx of [-1, 1]) {
			for (const k of [0, 1, 2]) {
				c.add(
					shell,
					path(
						[
							[cx + sx * rx * 0.7, cy + ry * (k * 0.4 - 0.1)],
							[cx + sx * rx * 1.4, cy + ry * (k * 0.5 + 0.1)],
							[cx + sx * rx * 1.55, cy + ry * (k * 0.6 + 0.8)]
						],
						2.2
					)
				);
			}
			c.add(
				shell,
				path(
					[
						[cx + sx * rx * 0.6, cy - ry * 0.5],
						[cx + sx * rx * 1.05, cy - ry * 1.4],
						[cx + sx * rx * 1.2, cy - ry * 1.8]
					],
					2.4
				)
			);
			const clawX = cx + sx * rx * 1.2;
			const clawY = cy - ry * 2.3;
			c.add(shell, [
				'and',
				['circle', clawX, clawY, c.w * 0.1],
				[
					'not',
					[
						'poly',
						[
							[clawX, clawY + 0.5],
							[clawX - sx * c.w * 0.04, clawY - c.w * 0.12],
							[clawX + sx * c.w * 0.08, clawY - c.w * 0.12]
						]
					]
				]
			]);
			c.add(shell, ['rect', cx + sx * rx * 0.3 - 0.6, cy - ry * 1.6, 1.2, ry]);
			c.add(eye, ['circle', cx + sx * rx * 0.3, cy - ry * 1.6, 1.9]);
		}
		const back: Shape = ['ellipse', cx, cy, rx, ry];
		c.add(shell, back);
		const sx2 = c.rng() < 0.5 ? c.w * 0.12 : c.w * 0.88;
		c.add(star2, star(sx2, c.h * 0.9, 3.4, 1.4, 5));
		// New colors: a shaded shell, foam, deeper sea, wet sand, shells, pebbles.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(shell, 'b', 0.3)));
		c.more((e) =>
			e.part(
				['ivory', 'ice', 'white', 'seafoam'],
				(x, y) => y === Math.floor(c.h * 0.2) + (x % 4 < 2 ? 0 : 1),
				[sand],
				6
			)
		);
		c.more((e) => e.part(sea, ['rect', 0, 0, c.w, c.h * 0.08], [sea], 6, -1));
		c.more((e) => e.part(sand, ['rect', 0, c.h * 0.2, c.w, c.h * 0.1], [sand], 6, -1));
		c.more((e) => e.shade(star2, 'lr', 0.4, -1, 4));
		c.more((e) => e.sprinkle(GREYS.concat(['peach', 'blush', 'beige']), 6, [sand]));
		c.later((d) => {
			// Pupils, a speckled back, a mottled tide line, shells and holes in the sand.
			d.specks([OUTLINE], [eye], 2);
			d.hatch(
				['ellipse', cx, cy - ry * 0.15, rx * 0.65, ry * 0.55],
				[shell],
				[null, OUTLINE, eye, shadow ?? star2],
				'dots'
			);
			d.specks([eye, OUTLINE], [shell], d.n(2, 8), ['rect', 0, cy - ry * 3, c.w, ry * 2.2]);
			d.hatch(['rect', 0, c.h * 0.21, c.w, 2.5], [sand], [sand, sea, eye, shell], 'zig');
			d.specks([shell, star2, OUTLINE], [sand], d.n(2, 12));
			d.specks([eye], [sea], d.n(1, 6));
		});
		return `${cap(c.nameOf(shell))} Crab`;
	},
	octopus(c) {
		const sea = c.color(['blue', 'navy', 'teal', 'dusk', 'indigo'], true);
		const floor = c.color(['sand', 'tan', 'cream', 'rose'], true);
		c.fill(sea);
		c.add(floor, ['ellipse', c.w / 2, c.h * 1.05, c.w * 0.75, c.h * 0.16]);
		const body = c.color(['violet', 'pink', 'red', 'coral', 'orange', 'magenta']);
		const eye = c.color(['white', 'cream', 'yellow']);
		const coral = c.color(['coral', 'orange', 'lime', 'yellow', 'pink', 'red']);
		const cx = c.w / 2;
		const hy = c.h * 0.3;
		const cxl = c.w * 0.12;
		c.add(
			coral,
			path(
				[
					[cxl, c.h],
					[cxl, c.h * 0.78],
					[cxl - 2.5, c.h * 0.68]
				],
				2
			)
		);
		c.add(
			coral,
			path(
				[
					[cxl, c.h * 0.82],
					[cxl + 3, c.h * 0.7],
					[cxl + 3, c.h * 0.63]
				],
				2
			)
		);
		// Arms fan out from under the head and curl up at the tips.
		const arms = 6;
		for (let k = 0; k < arms; k++) {
			const f = (k - (arms - 1) / 2) / ((arms - 1) / 2);
			const x0 = cx + f * c.w * 0.14;
			const pts: [number, number][] = [];
			for (let j = 0; j <= 6; j++) {
				const t = j / 6;
				pts.push([
					x0 + f * c.w * 0.26 * t ** 1.3 + Math.sin(t * 6 + k) * 1.2,
					hy + c.h * 0.1 + t * c.h * (0.42 - 0.12 * Math.abs(f))
				]);
			}
			const [ex, ey] = pts[6];
			const out = f === 0 ? 1 : Math.sign(f);
			pts.push([ex + out * 2.2, ey + 1], [ex + out * 3.6, ey - 1.6]);
			c.add(body, path(pts.slice(0, 5), 3.6));
			c.add(body, path(pts.slice(4), 2.8));
		}
		const head: Shape = ['ellipse', cx, hy, c.w * 0.2, c.h * 0.2];
		c.add(body, head);
		for (const sx of [-1, 1]) c.add(eye, ['circle', cx + sx * c.w * 0.08, hy + c.h * 0.05, 2.3]);
		// New colors: a shaded body, a glint, seaweed, light from above, bubbles.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(body, 'lr', 0.25)));
		c.more((e) => e.glint(body, 'ul', 0.08, 20));
		c.more((e) =>
			e.part(
				GREENS_ALL,
				(x, y) => y > c.h * 0.55 && Math.abs(x - c.w * 0.86 - Math.sin(y * 0.6) * 1.2) < 1.2,
				[sea],
				4
			)
		);
		c.more((e) => e.part(sea, ['rect', 0, 0, c.w, c.h * 0.1], [sea], 6, 1));
		c.more((e) => e.shade(coral, 'r', 0.4, -1, 4));
		c.more((e) => e.part(floor, ['rect', 0, c.h * 0.96, c.w, c.h], [floor], 4, -1));
		c.more((e) => e.sprinkle(['ice', 'seafoam', 'ivory', 'aqua', 'lemon'], 6, [sea]));
		c.later((d) => {
			// Pupils, suckers down the arms, spots on the head, bubbles, a pebbly floor.
			d.specks([OUTLINE], [eye], 2);
			d.specks([eye, coral, OUTLINE], [body], d.n(4, 16), ['rect', 0, hy + c.h * 0.2, c.w, c.h]);
			d.hatch(
				['ellipse', cx, hy - c.h * 0.06, c.w * 0.13, c.h * 0.09],
				[body],
				[null, eye, coral, shadow ?? OUTLINE],
				'dots'
			);
			d.specks([eye, coral], [sea], d.n(2, 12));
			d.hatch(['rect', 0, c.h * 0.92, c.w, c.h], [floor], [floor, coral, body, eye], 'zig');
		});
		return `${cap(c.nameOf(body))} Octopus`;
	},
	penguin(c) {
		const sky = c.color(['sky', 'dusk', 'navy', 'night', 'lilac', 'mint'], true);
		const ice = c.color(['white', 'cream', 'mint', 'sky', 'lilac', 'grey'], true);
		c.fill(sky);
		c.add(ice, ['rect', 0, c.h * 0.82, c.w, c.h]);
		const berg = c.color(['white', 'sky', 'mint', 'lilac', 'cream', 'grey']);
		const coat = c.color(['night', 'navy', 'plum', 'indigo', 'grey', 'dusk']);
		const belly = c.color(['white', 'cream']);
		const beak = c.color(['orange', 'amber', 'yellow', 'coral']);
		const left = c.rng() < 0.5;
		const bx = left ? c.w * 0.6 : c.w * 0.04;
		c.add(berg, [
			'poly',
			[
				[bx, c.h * 0.83],
				[bx + c.w * 0.05, c.h * 0.62],
				[bx + c.w * 0.12, c.h * 0.58],
				[bx + c.w * 0.2, c.h * 0.4],
				[bx + c.w * 0.3, c.h * 0.6],
				[bx + c.w * 0.36, c.h * 0.83]
			]
		]);
		const cx = left ? c.w * 0.36 : c.w * 0.64;
		for (const sx of [-1, 1]) {
			c.add(beak, ['ellipse', cx + sx * c.w * 0.07, c.h * 0.85, c.w * 0.07, c.h * 0.03]);
			c.add(coat, [
				'poly',
				[
					[cx + sx * c.w * 0.15, c.h * 0.42],
					[cx + sx * c.w * 0.27, c.h * 0.68],
					[cx + sx * c.w * 0.17, c.h * 0.66]
				]
			]);
		}
		c.add(coat, ['ellipse', cx, c.h * 0.58, c.w * 0.19, c.h * 0.27]);
		c.add(coat, ['circle', cx, c.h * 0.28, c.w * 0.13]);
		const front: Shape = ['ellipse', cx, c.h * 0.62, c.w * 0.12, c.h * 0.21];
		c.add(belly, front);
		c.add(belly, ['ellipse', cx, c.h * 0.31, c.w * 0.085, c.h * 0.055]);
		c.add(beak, [
			'poly',
			[
				[cx - 1.6, c.h * 0.33],
				[cx + 1.6, c.h * 0.33],
				[cx, c.h * 0.39]
			]
		]);
		// New colors: a shaded coat, an aurora, a shaded berg, snow, cracks in the ice.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(belly, 'r', 0.3)));
		c.more((e) =>
			e.part(
				['seafoam', 'chartreuse', 'aqua', 'orchid', 'lavender', 'emerald'],
				(x, y) => Math.abs(y - c.h * (0.14 + 0.05 * Math.sin(x * 0.35))) < 1.3,
				[sky],
				6
			)
		);
		c.more((e) => e.shade(berg, 'r', 0.4, -1, 6));
		c.more((e) => e.shade(coat, 'lr', 0.25, 1));
		c.more((e) => e.part(ice, ['rect', 0, c.h * 0.93, c.w, c.h], [ice], 6, -1));
		c.more((e) => e.shade(beak, 'b', 0.4, -1, 3));
		c.more((e) => e.sprinkle(['ice', 'ivory', 'lemon', 'periwinkle'], 6, [sky]));
		c.later((d) => {
			// Eyes, a feathered front, snowflakes, frost on the berg and the ice.
			d.specks([OUTLINE], [belly], 2, [
				'rect',
				cx - c.w * 0.07,
				c.h * 0.28,
				c.w * 0.14,
				c.h * 0.04
			]);
			d.hatch(
				['ellipse', cx, c.h * 0.66, c.w * 0.08, c.h * 0.12],
				[belly],
				[belly, shadow ?? sky, coat, beak],
				'zig'
			);
			d.specks([belly, berg, beak], [sky], d.n(3, 14));
			d.specks([sky, coat], [berg], d.n(1, 8));
			d.hatch(['rect', 0, c.h * 0.86, c.w, c.h], [ice], [null, sky, coat, beak], 'dots');
		});
		return `${cap(c.nameOf(coat))} Penguin`;
	},
	frog(c) {
		const water = c.color(['blue', 'teal', 'navy', 'mint', 'sky', 'dusk'], true);
		c.fill(water);
		const pad = c.color(['green', 'forest', 'lime', 'teal']);
		const frog = c.color(['lime', 'green', 'teal', 'yellow', 'orange', 'red']);
		const eyeW = c.color(['white', 'cream', 'yellow']);
		const flower = c.color(['pink', 'rose', 'white', 'magenta', 'lilac']);
		const cx = c.w / 2;
		const py = c.h * 0.72;
		c.add(pad, [
			'and',
			['ellipse', cx, py, c.w * 0.44, c.h * 0.17],
			[
				'not',
				[
					'poly',
					[
						[cx, py],
						[cx + c.w * 0.5, py - c.h * 0.06],
						[cx + c.w * 0.5, py + c.h * 0.03]
					]
				]
			]
		]);
		for (const sx of [-1, 1]) {
			c.add(frog, ['ellipse', cx + sx * c.w * 0.2, c.h * 0.65, c.w * 0.1, c.h * 0.075]);
			c.add(frog, ['ellipse', cx + sx * c.w * 0.1, c.h * 0.71, c.w * 0.05, c.h * 0.035]);
		}
		c.add(frog, ['ellipse', cx, c.h * 0.57, c.w * 0.22, c.h * 0.15]);
		const face: Shape = ['ellipse', cx, c.h * 0.42, c.w * 0.21, c.h * 0.12];
		c.add(frog, face);
		for (const sx of [-1, 1]) {
			c.add(frog, ['circle', cx + sx * c.w * 0.12, c.h * 0.32, c.w * 0.075]);
			c.add(eyeW, ['circle', cx + sx * c.w * 0.12, c.h * 0.32, c.w * 0.045]);
		}
		const fx = c.rng() < 0.5 ? c.w * 0.14 : c.w * 0.86;
		c.add(pad, ['ellipse', fx, c.h * 0.24, c.w * 0.1, c.h * 0.05]);
		c.add(flower, star(fx, c.h * 0.21, 3.6, 1.6, 6));
		// New colors: a pale belly, a shaded frog, a darker pad, reeds, ripples, a fly.
		c.more((e) => e.part(frog, ['ellipse', cx, c.h * 0.6, c.w * 0.12, c.h * 0.09], [frog], 4, 1));
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(frog, 'lr', 0.22)));
		c.more((e) => e.shade(pad, 'b', 0.35, -1, 8));
		c.more((e) =>
			e.part(
				['olive', 'moss', 'khaki', 'sage', 'pine'],
				(x, y) =>
					y > c.h * 0.3 && (x === 1 || x === 3 || x === c.w - 2) && y > c.h * 0.3 + ((x * 7) % 5),
				[water],
				4
			)
		);
		c.more((e) => e.part(water, ring(c.w * 0.25, c.h * 0.12, 4, 2.8), [water], 4, 1));
		c.more((e) => e.part(water, ['rect', 0, c.h * 0.9, c.w, c.h], [water], 6, -1));
		c.more((e) => e.shade(flower, 'lr', 0.35, -1, 4));
		c.later((d) => {
			// Pupils, a smile, a spotted back, dew on the pad, ripples, gnats.
			d.specks([OUTLINE], [eyeW], 2);
			d.paint(OUTLINE, ['rect', cx - c.w * 0.1, c.h * 0.46, c.w * 0.2, 0.6], [frog]);
			d.hatch(
				['ellipse', cx, c.h * 0.55, c.w * 0.16, c.h * 0.06],
				[frog],
				[null, pad, flower, shadow ?? OUTLINE],
				'dots'
			);
			d.specks([frog, water, eyeW], [pad], d.n(2, 10));
			d.hatch(['rect', 0, c.h * 0.88, c.w, 2], [water], [water, pad, eyeW, flower], 'zig');
			d.specks([eyeW, pad, flower], [water], d.n(2, 12));
		});
		return `${cap(c.nameOf(frog))} Frog`;
	},
	toadstool(c) {
		const sky = c.color(SKY, true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.84, c.w, c.h]);
		const capk = c.color(['red', 'orange', 'violet', 'magenta', 'blue', 'coral']);
		const spot = c.color(['white', 'cream', 'yellow']);
		const wall = c.color(['cream', 'tan', 'sand', 'white']);
		const door = c.color(['brown', 'green', 'blue', 'navy', 'plum']);
		const glass = c.color(['yellow', 'amber', 'sky', 'orange']);
		const cx = c.w / 2;
		const stalk = roundRect(cx - c.w * 0.21, c.h * 0.44, c.w * 0.42, c.h * 0.43, 3);
		c.add(wall, stalk);
		c.add(door, ['rect', cx + c.w * 0.18, c.h * 0.08, 3.4, c.h * 0.16]);
		const dome: Shape = [
			'and',
			['ellipse', cx, c.h * 0.46, c.w * 0.46, c.h * 0.32],
			['rect', 0, 0, c.w, c.h * 0.48]
		];
		c.add(capk, dome);
		const spots = c.ri(4, 6);
		for (let k = 0; k < spots; k++) {
			c.add(spot, [
				'circle',
				cx + c.w * 0.34 * Math.cos((Math.PI * (k + 0.5)) / spots),
				c.h * 0.42 - c.h * 0.22 * Math.sin((Math.PI * (k + 0.5)) / spots),
				c.r(1.6, 2.6)
			]);
		}
		const arch: Shape = or(
			['rect', cx - 2.6, c.h * 0.68, 5.2, c.h * 0.19],
			['circle', cx, c.h * 0.68, 2.6]
		);
		c.add(door, arch);
		const wins: Shape[] = [
			['circle', cx - c.w * 0.12, c.h * 0.58, 2.4],
			['circle', cx + c.w * 0.12, c.h * 0.58, 2.4]
		];
		for (const w of wins) c.add(glass, w);
		// New colors: a path, a shaded cap, shaded walls, smoke, a cloud, flowers.
		c.more((e) =>
			e.part(
				['stone', 'ash', 'beige', 'khaki', 'terracotta'],
				[
					'poly',
					[
						[cx - 2.6, c.h * 0.86],
						[cx + 2.6, c.h * 0.86],
						[cx + 6, c.h],
						[cx - 6, c.h]
					]
				],
				[ground],
				4
			)
		);
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(capk, 'lr', 0.3)));
		c.more((e) => e.part(wall, ['rect', cx + c.w * 0.1, 0, c.w, c.h], [wall], 4, -1));
		c.more((e) =>
			e.part(
				['ash', 'ivory', 'lavender', 'stone'],
				path(
					[
						[cx + c.w * 0.2, c.h * 0.06],
						[cx + c.w * 0.25, 1.5],
						[cx + c.w * 0.33, 1]
					],
					1.4
				),
				[sky],
				2
			)
		);
		c.more((e) => {
			const x = c.w * e.r(0.05, 0.25);
			e.part(
				LIGHTS,
				any(['ellipse', x, c.h * 0.08, 3.5, 1.3], ['circle', x + 1, c.h * 0.08 - 1, 1.5]),
				[sky],
				4
			);
		});
		c.more((e) => e.shade(door, 'r', 0.4, -1, 6));
		c.more((e) => e.sprinkle(BLOOMS_ALL, 5, [ground]));
		c.later((d) => {
			// Window bars, a door knob, a stone wall, a scalloped cap rim, flowers.
			for (const [, x, y] of wins as ['circle', number, number, number][]) {
				d.paint(OUTLINE, ['rect', Math.floor(x) - 0.01, 0, 1, c.h], [glass]);
				d.paint(OUTLINE, ['rect', 0, Math.floor(y) - 0.01, c.w, 1], [glass]);
			}
			d.specks([glass], [door], 1, arch);
			d.hatch(stalk, [wall], [null, OUTLINE, capk, door], 'dots');
			d.hatch(
				['and', dome, ['rect', 0, c.h * 0.42, c.w, 2.5]],
				[capk],
				[capk, spot, door, shadow ?? OUTLINE],
				'zig'
			);
			d.specks([spot, wall], [capk], d.n(2, 10), dome);
			d.specks([capk, spot, glass], [ground], d.n(2, 10));
		});
		return `${cap(c.nameOf(capk))} Mushroom House`;
	},
	kite(c) {
		const sky = c.color(['sky', 'cream', 'mint', 'rose', 'lilac'], true);
		const hill = c.color(['green', 'forest', 'lime', 'teal'], true);
		c.fill(sky);
		c.add(hill, ['ellipse', c.w * 0.3, c.h * 1.08, c.w * 0.65, c.h * 0.25]);
		const a = c.color(WARM);
		const b = c.color(COOL.concat(['yellow', 'white']));
		const bow = c.color(ANY);
		const kx = c.w * 0.62;
		const ky = c.h * 0.3;
		const hw = c.w * 0.27;
		const top: [number, number] = [kx, ky - c.h * 0.26];
		const rt: [number, number] = [kx + hw, ky];
		const bot: [number, number] = [kx, ky + c.h * 0.34];
		const lt: [number, number] = [kx - hw, ky];
		const ctr: [number, number] = [kx, ky];
		const diamond: Shape = ['poly', [top, rt, bot, lt]];
		const tail: [number, number][] = [
			bot,
			[kx - c.w * 0.08, c.h * 0.66],
			[kx - c.w * 0.2, c.h * 0.7],
			[kx - c.w * 0.32, c.h * 0.8],
			[c.w * 0.12, c.h * 0.86]
		];
		c.add(bow, path(tail, 0.8));
		for (let k = 1; k < tail.length; k++) {
			const [x, y] = tail[k];
			c.add(bow, [
				'poly',
				[
					[x, y],
					[x - 2.6, y - 1.8],
					[x - 2.6, y + 1.8]
				]
			]);
			c.add(bow, [
				'poly',
				[
					[x, y],
					[x + 2.6, y - 1.8],
					[x + 2.6, y + 1.8]
				]
			]);
		}
		c.add(a, ['poly', [top, rt, ctr]]);
		c.add(b, ['poly', [rt, bot, ctr]]);
		c.add(a, ['poly', [bot, lt, ctr]]);
		c.add(b, ['poly', [lt, top, ctr]]);
		const sun = c.color(['yellow', 'orange', 'white']);
		c.add(sun, ['circle', c.w * 0.14, c.h * 0.14, 3]);
		// New colors: shaded halves, clouds, a darker hill, sky, flowers.
		c.more((e) => e.shade(a, 'lr', 0.3, -1, 6));
		c.more((e) => e.shade(b, 'lr', 0.3, -1, 6));
		c.more((e) => {
			const x = c.w * e.r(0.15, 0.4);
			e.part(
				LIGHTS,
				any(['ellipse', x, c.h * 0.42, 4.5, 1.6], ['circle', x + 1, c.h * 0.42 - 1, 1.8]),
				[sky],
				5
			);
		});
		c.more((e) => e.part(hill, ['rect', 0, c.h * 0.94, c.w, c.h], [hill], 6, -1));
		c.more((e) => e.part(sky, ['rect', 0, 0, c.w, c.h * 0.08], [sky], 6));
		c.more((e) => e.shade(sun, 'lr', 0.35, -1, 6));
		c.more((e) => e.sprinkle(BLOOMS_ALL, 5, [hill]));
		c.later((d) => {
			// A patterned middle, flecks on the panels, birds, grass.
			d.hatch(['and', diamond, ['circle', kx, ky, hw * 0.5]], [a, b], [a, b, bow, OUTLINE], 'zig');
			d.specks([b, bow], [a], d.n(2, 8), diamond);
			d.specks([a, bow], [b], d.n(2, 8), diamond);
			d.specks([OUTLINE, a], [sky], d.n(2, 10));
			d.hatch(['rect', 0, c.h * 0.9, c.w, 2], [hill], [hill, a, b, sun], 'zig');
		});
		return `${cap(c.nameOf(a))} Kite`;
	},
	robot(c) {
		const wall = c.color(['cream', 'mint', 'sky', 'lilac', 'rose', 'night', 'navy'], true);
		const floor = c.color(['grey', 'tan', 'teal', 'blue', 'brown', 'plum'], true);
		c.fill(wall);
		c.add(floor, ['rect', 0, c.h * 0.86, c.w, c.h]);
		const metal = c.color(['grey', 'sky', 'teal', 'white', 'lilac', 'sand']);
		const accent = c.color(['red', 'orange', 'yellow', 'lime', 'magenta', 'blue']);
		const glow = c.color(['yellow', 'lime', 'sky', 'mint', 'pink']);
		const dark = c.color(['night', 'navy', 'plum', 'indigo', 'brown']);
		const cx = c.w / 2;
		c.add(accent, ['circle', cx, c.h * 0.05, 1.8]);
		c.add(dark, ['rect', cx - 0.6, c.h * 0.05, 1.2, c.h * 0.1]);
		for (const sx of [-1, 1]) {
			c.add(accent, ['rect', cx + sx * c.w * 0.17 - 1.2, c.h * 0.18, 2.4, c.h * 0.09]);
			c.add(metal, ['rect', cx + sx * c.w * 0.27 - 2, c.h * 0.42, 4, c.h * 0.24]);
			c.add(accent, ['circle', cx + sx * c.w * 0.27, c.h * 0.68, 2.6]);
			c.add(metal, ['rect', cx + sx * c.w * 0.1 - 2.2, c.h * 0.68, 4.4, c.h * 0.13]);
			c.add(dark, ['rect', cx + sx * c.w * 0.1 - 3.2, c.h * 0.8, 6.4, c.h * 0.06]);
		}
		c.add(metal, roundRect(cx - c.w * 0.16, c.h * 0.13, c.w * 0.32, c.h * 0.21, 2));
		c.add(dark, ['rect', cx - 2, c.h * 0.33, 4, c.h * 0.06]);
		const bodyShape = roundRect(cx - c.w * 0.21, c.h * 0.38, c.w * 0.42, c.h * 0.32, 2);
		c.add(metal, bodyShape);
		for (const sx of [-1, 1]) c.add(glow, ['circle', cx + sx * c.w * 0.075, c.h * 0.22, 2.3]);
		const mouth: Shape = ['rect', cx - c.w * 0.08, c.h * 0.28, c.w * 0.16, 2.2];
		c.add(dark, mouth);
		const panel: Shape = ['rect', cx - c.w * 0.12, c.h * 0.44, c.w * 0.24, c.h * 0.14];
		c.add(dark, panel);
		c.add(accent, ['circle', cx, c.h * 0.63, 1.8]);
		// New colors: shaded metal, a shine, floor tiles, a shaded accent, wall panels.
		let side: string | undefined;
		c.more((e) => (side = e.part(metal, ['rect', cx + c.w * 0.06, 0, c.w, c.h], [metal], 6, -1)));
		c.more((e) => e.glint(metal, 'ul', 0.12, 12));
		c.more((e) =>
			e.part(
				floor,
				(x, y) => y > c.h * 0.86 && (Math.floor(x / 4) + Math.floor(y / 2)) % 2 === 0,
				[floor],
				6,
				1
			)
		);
		c.more((e) => e.shade(accent, 'b', 0.4, -1, 3));
		c.more((e) =>
			e.part(wall, (x, y) => y < c.h * 0.86 && (x % 8 === 0 || y % 8 === 0), [wall], 8)
		);
		c.more((e) => e.shade(glow, 'b', 0.4, -1, 3));
		c.later((d) => {
			// Blinking lights, a grille, rivets, bolts on the wall.
			d.hatch(panel, [dark], [dark, accent, glow, side ?? metal], 'diag');
			for (let x = Math.floor(cx - c.w * 0.08) + 1; x < cx + c.w * 0.08; x += 2)
				d.paint(metal, ['rect', x, 0, 1, c.h], [dark]);
			d.specks([dark, OUTLINE], [metal], d.n(3, 12));
			d.specks([accent, metal], [wall], d.n(1, 8));
			d.specks([metal, dark], [floor], d.n(1, 6));
		});
		return `${cap(c.nameOf(accent))} Robot`;
	},
	lantern(c) {
		const bg = c.color(['night', 'navy', 'plum', 'dusk', 'indigo'], true);
		c.fill(bg);
		const paper = c.color(['red', 'orange', 'amber', 'yellow', 'pink', 'magenta']);
		const capk = c.color(['brown', 'yellow', 'tan', 'amber', 'forest']);
		const tassel = c.color(['yellow', 'amber', 'red', 'sand', 'cream']);
		const cx = c.w * 0.42;
		const cy = c.h * 0.5;
		const rx = c.w * 0.28;
		const ry = c.h * 0.24;
		c.add(capk, ['rect', cx - 0.6, 0, 1.2, cy - ry]);
		const main: Shape = ['ellipse', cx, cy, rx, ry];
		c.add(paper, main);
		for (const f of [0.35, 0.7]) {
			c.add(capk, [
				'and',
				main,
				['ellipse', cx, cy, rx * f + 0.9, ry],
				['not', ['ellipse', cx, cy, rx * f - 0.2, ry]]
			]);
		}
		c.add(capk, ['rect', cx - rx * 0.45, cy - ry - 1.5, rx * 0.9, 3]);
		c.add(capk, ['rect', cx - rx * 0.45, cy + ry - 1.5, rx * 0.9, 3]);
		c.add(tassel, ['rect', cx - 1.2, cy + ry + 1.5, 2.4, 3]);
		c.add(tassel, [
			'poly',
			[
				[cx - 1.2, cy + ry + 4],
				[cx + 1.2, cy + ry + 4],
				[cx + 2.6, cy + ry + 9],
				[cx - 2.6, cy + ry + 9]
			]
		]);
		const sx = c.w * 0.84;
		const sy = c.h * 0.3;
		c.add(capk, ['rect', sx - 0.6, 0, 1.2, sy]);
		c.add(paper, ['ellipse', sx, sy, c.w * 0.1, c.h * 0.09]);
		c.add(capk, ['rect', sx - 2.5, sy - c.h * 0.09 - 1, 5, 2]);
		c.add(tassel, ['rect', sx - 0.9, sy + c.h * 0.09, 1.8, 4]);
		const moon = c.color(['cream', 'white', 'yellow', 'grey']);
		c.add(moon, ['circle', c.w * 0.85, c.h * 0.8, 2.8]);
		// New colors: a glow, shaded paper, an emblem, stars, a shaded tassel.
		c.more((e) => e.part(bg, ['circle', cx, cy, rx + 4], [bg], 6, 1));
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(paper, 'lr', 0.25)));
		c.more((e) =>
			e.part(
				BRIGHTS.concat(LIGHTS),
				regular(cx, cy, Math.min(rx, ry) * 0.3, 4, Math.PI / 4),
				[paper],
				4
			)
		);
		c.more((e) => e.shade(tassel, 'r', 0.4, -1, 3));
		c.more((e) => e.shade(moon, 'lr', 0.4, -1, 6));
		c.more((e) => e.sprinkle(['lemon', 'ivory', 'ice', 'lavender', 'peach'], 7, [bg]));
		c.later((d) => {
			// A painted band, flecks on the paper, a frayed tassel, stars and fireflies.
			d.hatch(
				['and', main, ['rect', 0, cy + ry * 0.35, c.w, 2.5]],
				[paper],
				[paper, capk, tassel, shadow ?? OUTLINE],
				'zig'
			);
			d.specks([tassel, capk], [paper], d.n(2, 10));
			d.specks([OUTLINE, paper], [tassel], d.n(1, 3));
			d.specks([tassel, paper, moon], [bg], d.n(3, 16));
		});
		return `${cap(c.nameOf(paper))} Lantern`;
	},
	anchor(c) {
		const sea = c.color(['blue', 'navy', 'teal', 'dusk', 'indigo'], true);
		const bed = c.color(['sand', 'tan', 'cream', 'rose'], true);
		c.fill(sea);
		c.add(bed, ['rect', 0, c.h * 0.86, c.w, c.h]);
		const iron = c.color(['grey', 'navy', 'brown', 'night', 'plum', 'teal']);
		const rope = c.color(['tan', 'sand', 'amber', 'cream', 'yellow']);
		const weed = c.color(['green', 'lime', 'forest', 'teal']);
		const cx = c.w / 2;
		for (const wx of [c.w * 0.08, c.w * 0.92]) {
			const pts: [number, number][] = [];
			for (let j = 0; j <= 5; j++)
				pts.push([wx + Math.sin(j * 1.3) * 1.4, c.h * 0.9 - j * c.h * 0.08]);
			c.add(weed, path(pts, 2.2));
		}
		c.add(iron, ring(cx, c.h * 0.11, 3.6, 1.4));
		c.add(iron, ['rect', cx - 2, c.h * 0.15, 4, c.h * 0.62]);
		c.add(iron, ['rect', cx - c.w * 0.2, c.h * 0.24, c.w * 0.4, 3.2]);
		const R = c.w * 0.31;
		const ay = c.h * 0.5;
		c.add(iron, ['and', ring(cx, ay, R, R - 3.6), ['rect', 0, ay, c.w, c.h]]);
		for (const sx of [-1, 1]) {
			c.add(iron, [
				'poly',
				[
					[cx + sx * (R + 1.8), ay + 2],
					[cx + sx * (R - 5.4), ay + 2],
					[cx + sx * (R - 1.8), ay - 5]
				]
			]);
		}
		c.add(iron, ['circle', cx, ay + R - 1.5, 3]);
		const ropePts: [number, number][] = [[cx + 2, c.h * 0.12]];
		for (let j = 1; j <= 6; j++) ropePts.push([cx + (j % 2 ? -3 : 3), c.h * 0.12 + j * c.h * 0.07]);
		c.add(rope, path(ropePts, 1.8));
		const fishK = c.color(WARM.concat(['lime', 'yellow']));
		const fx = c.w * 0.78;
		c.add(fishK, ['ellipse', fx, c.h * 0.22, 2.6, 1.6]);
		c.add(fishK, [
			'poly',
			[
				[fx + 2, c.h * 0.22],
				[fx + 4.5, c.h * 0.22 - 1.8],
				[fx + 4.5, c.h * 0.22 + 1.8]
			]
		]);
		// New colors: shaded iron, rust, light from above, a deeper bed, bubbles.
		let shade: string | undefined;
		c.more((e) => (shade = e.shade(iron, 'r', 0.3)));
		c.more((e) =>
			e.part(
				['rust', 'copper', 'ochre', 'terracotta'],
				['circle', cx - c.w * 0.14, ay + R * 0.55, 3.5],
				[iron],
				3
			)
		);
		c.more((e) =>
			e.part(sea, (x, y) => y < c.h * 0.4 && mod(x - Math.floor(y / 2), 9) < 2, [sea], 8, 1)
		);
		c.more((e) => e.part(bed, ['rect', 0, c.h * 0.95, c.w, c.h], [bed], 4, -1));
		c.more((e) => e.shade(rope, 'b', 0.3, -1, 4));
		c.more((e) => e.shade(weed, 'r', 0.4, -1, 4));
		c.more((e) => e.sprinkle(['ice', 'seafoam', 'ivory', 'aqua'], 6, [sea]));
		c.later((d) => {
			// Barnacles, a twisted rope, shells in the sand, bubbles.
			d.specks([rope, weed, OUTLINE], [iron], d.n(3, 12));
			d.hatch(['rect', 0, 0, c.w, c.h], [rope], [rope, OUTLINE, shade ?? iron], 'diag');
			d.hatch(['rect', 0, c.h * 0.88, c.w, c.h], [bed], [null, weed, rope, iron], 'dots');
			d.specks([rope, fishK], [sea], d.n(2, 12));
		});
		return `${cap(c.nameOf(iron))} Anchor`;
	},
	apple(c) {
		const wall = c.color(['cream', 'mint', 'sky', 'rose', 'lilac', 'sand'], true);
		const table = c.color(['brown', 'tan', 'blue', 'teal', 'red', 'plum'], true);
		c.fill(wall);
		c.add(table, ['rect', 0, c.h * 0.8, c.w, c.h]);
		const skin = c.color(['red', 'lime', 'green', 'yellow', 'coral']);
		const leaf = c.color(['green', 'forest', 'lime', 'teal']);
		const stem = c.color(['brown', 'night', 'plum']);
		const flesh = c.color(['cream', 'white', 'sand']);
		const cx = c.w * 0.42;
		const cy = c.h * 0.54;
		const r = c.w * 0.27;
		const fruit: Shape = [
			'and',
			or(
				['circle', cx - r * 0.4, cy, r * 0.78],
				['circle', cx + r * 0.4, cy, r * 0.78],
				['ellipse', cx, cy + r * 0.25, r * 0.9, r * 0.75]
			),
			['not', ['circle', cx, cy - r * 0.95, r * 0.22]]
		];
		c.add(stem, segment(cx, cy - r * 0.5, cx + 1.5, cy - r * 1.2, 2));
		c.add(leaf, ['ellipse', cx + r * 0.55, cy - r * 1.02, r * 0.38, r * 0.15]);
		c.add(skin, fruit);
		const hx = c.w * 0.8;
		const hy = c.h * 0.74;
		const hr = c.w * 0.13;
		c.add(skin, ['and', ['circle', hx, hy, hr], ['rect', 0, 0, c.w, hy]]);
		const half: Shape = ['and', ['circle', hx, hy, hr - 1.2], ['rect', 0, 0, c.w, hy]];
		c.add(flesh, half);
		c.add(stem, ['ellipse', hx, hy - hr * 0.4, 1.4, 1]);
		// New colors: shading, a shine, a leaf vein, a table edge, wallpaper, cut flesh.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(skin, 'lr', 0.3)));
		c.more((e) => e.glint(skin, 'ul', 0.08, 20));
		c.more((e) =>
			e.part(
				leaf,
				segment(cx + r * 0.2, cy - r * 1.02, cx + r * 0.9, cy - r * 1.02, 1),
				[leaf],
				2,
				-1
			)
		);
		c.more((e) => e.part(table, ['rect', 0, c.h * 0.8, c.w, 1.5], [table], 6, 1));
		c.more((e) => e.part(wall, (x, y) => (x + y) % 6 === 0, [wall], 8));
		c.more((e) => e.shade(flesh, 'b', 0.3, -1, 4));
		c.later((d) => {
			// Freckles on the skin, seeds in the cut half, a checked cloth, flecks on the wall.
			d.hatch(
				['ellipse', cx, cy + r * 0.1, r * 0.7, r * 0.6],
				[skin],
				[null, flesh, leaf, shadow ?? OUTLINE],
				'dots'
			);
			d.specks([stem, OUTLINE], [flesh], d.n(2, 4), half);
			d.hatch(['rect', 0, c.h * 0.83, c.w, c.h], [table], [table, wall, skin, leaf], 'diag');
			d.specks([skin, leaf], [wall], d.n(1, 10));
		});
		return `${cap(c.nameOf(skin))} Apple`;
	},
	pear(c) {
		const bg = c.color(['cream', 'mint', 'sky', 'rose', 'lilac', 'dusk', 'navy'], true);
		c.fill(bg);
		const plate = c.color(['white', 'grey', 'sky', 'teal', 'blue']);
		const skin = c.color(['lime', 'yellow', 'green', 'amber', 'tan']);
		const skin2 = c.color(['red', 'orange', 'coral', 'brown', 'pink']);
		const stem = c.color(['brown', 'night', 'plum', 'forest']);
		const plateShape: Shape = ['ellipse', c.w / 2, c.h * 0.86, c.w * 0.45, c.h * 0.08];
		c.add(plate, plateShape);
		const pears: [number, number, number, string][] = [
			[c.w * 0.38, c.h * 0.56, c.w * 0.2, skin],
			[c.w * 0.72, c.h * 0.66, c.w * 0.14, skin2]
		];
		const bodies: Shape[] = [];
		for (const [px, py, r, k] of pears) {
			const body: Shape = or(
				['circle', px, py + r * 0.35, r],
				['circle', px, py - r * 0.75, r * 0.6],
				[
					'poly',
					[
						[px - r * 0.95, py + r * 0.2],
						[px - r * 0.55, py - r * 0.8],
						[px + r * 0.55, py - r * 0.8],
						[px + r * 0.95, py + r * 0.2]
					]
				]
			);
			c.add(stem, segment(px, py - r * 1.2, px + 1.5, py - r * 1.8, 1.8));
			c.add(k, body);
			bodies.push(body);
		}
		const leafK = c.color(['green', 'forest', 'teal', 'lime']);
		c.add(leafK, [
			'ellipse',
			pears[0][0] - pears[0][2] * 0.65,
			pears[0][1] - pears[0][2] * 1.65,
			pears[0][2] * 0.5,
			pears[0][2] * 0.18
		]);
		// New colors: shading, a blush, a shine, a shaded plate, a table, a leaf vein.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(skin, 'lr', 0.3)));
		c.more((e) =>
			e.part(
				['salmon', 'blush', 'apricot', 'rust', 'terracotta'],
				[
					'circle',
					pears[0][0] + pears[0][2] * 0.45,
					pears[0][1] + pears[0][2] * 0.1,
					pears[0][2] * 0.35
				],
				[skin],
				3
			)
		);
		c.more((e) => e.shade(skin2, 'lr', 0.3, -1, 6));
		c.more((e) => e.glint(skin, 'ul', 0.08, 16));
		c.more((e) => e.shade(plate, 'b', 0.35, -1, 6));
		c.more((e) =>
			e.part(BROWNS.concat(['denim', 'slate', 'wine']), ['rect', 0, c.h * 0.9, c.w, c.h], [bg], 6)
		);
		c.more((e) => e.part(bg, (x, y) => x % 5 === 3 && y < c.h * 0.85, [bg], 8));
		c.later((d) => {
			// Russet freckles, a patterned plate rim, flecks in the air.
			d.hatch(
				[
					'ellipse',
					pears[0][0],
					pears[0][1] + pears[0][2] * 0.3,
					pears[0][2] * 0.75,
					pears[0][2] * 0.6
				],
				[skin],
				[null, stem, skin2, shadow ?? OUTLINE],
				'dots'
			);
			d.specks([skin, stem], [skin2], d.n(2, 8), bodies[1]);
			d.hatch(
				['and', plateShape, ['not', ['ellipse', c.w / 2, c.h * 0.86, c.w * 0.36, c.h * 0.05]]],
				[plate],
				[plate, skin, skin2, OUTLINE],
				'zig'
			);
			d.specks([skin, skin2, leafK], [bg], d.n(2, 10));
		});
		return `${cap(c.nameOf(skin))} Pear`;
	},
	cherries(c) {
		const bg = c.color(['cream', 'mint', 'sky', 'rose', 'lilac', 'sand'], true);
		c.fill(bg);
		const fruit = c.color(['red', 'magenta', 'plum', 'coral']);
		const stem = c.color(['green', 'forest', 'brown', 'lime']);
		const leaf = c.color(['green', 'lime', 'forest', 'teal']);
		const bowl = c.color(['white', 'sky', 'blue', 'teal', 'yellow', 'violet']);
		const cx = c.w / 2;
		const bowlShape: Shape = [
			'and',
			['ellipse', cx, c.h * 0.72, c.w * 0.44, c.h * 0.24],
			['rect', 0, c.h * 0.72, c.w, c.h]
		];
		const r = c.w * 0.13;
		const joint: [number, number] = [cx + 2, c.h * 0.12];
		const fruits: [number, number][] = [
			[cx - c.w * 0.18, c.h * 0.6],
			[cx + c.w * 0.17, c.h * 0.62],
			[cx, c.h * 0.66]
		];
		for (const [x, y] of fruits)
			c.add(
				stem,
				path(
					[[x, y - r * 0.8], [(x + joint[0]) / 2 + (x < cx ? -2 : 2), (y + joint[1]) / 2], joint],
					1.6
				)
			);
		c.add(leaf, ['ellipse', joint[0] + 4.5, joint[1] + 1, 4.5, 1.8]);
		for (const [x, y] of fruits) c.add(fruit, ['circle', x, y, r]);
		c.add(bowl, bowlShape);
		// New colors: shaded fruit, a shine, a leaf vein, a shaded bowl, a table, a stripe.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(fruit, 'lr', 0.3)));
		c.more((e) => e.glint(fruit, 'ul', 0.12, 8));
		c.more((e) =>
			e.part(
				leaf,
				segment(joint[0] + 1, joint[1] + 1, joint[0] + 8, joint[1] + 1, 1),
				[leaf],
				2,
				-1
			)
		);
		c.more((e) => e.shade(bowl, 'b', 0.3, -1, 6));
		c.more((e) =>
			e.part(BRIGHTS, ['and', bowlShape, ['rect', 0, c.h * 0.78, c.w, 1.6]], [bowl], 4)
		);
		c.more((e) =>
			e.part(BROWNS.concat(['denim', 'slate']), ['rect', 0, c.h * 0.95, c.w, c.h], [bg], 6)
		);
		c.more((e) => e.part(bg, (x, y) => (x + 2 * y) % 8 === 0, [bg], 8));
		c.later((d) => {
			// Flecks on the fruit, a painted bowl, crumbs and flecks on the cloth.
			d.specks([shadow, leaf, bg], [fruit], d.n(2, 8));
			d.hatch(
				['and', bowlShape, ['rect', 0, c.h * 0.82, c.w, 3]],
				[bowl],
				[bowl, fruit, leaf, OUTLINE],
				'zig'
			);
			d.specks([fruit, stem], [bowl], d.n(1, 8), bowlShape);
			d.specks([fruit, leaf, bowl], [bg], d.n(2, 12));
		});
		return `${cap(c.nameOf(fruit))} Cherries`;
	},
	strawberry(c) {
		const bg = c.color(['cream', 'mint', 'sky', 'lilac', 'sand', 'dusk'], true);
		c.fill(bg);
		const berry = c.color(['red', 'coral', 'magenta', 'pink']);
		const seed = c.color(['yellow', 'cream', 'white', 'sand']);
		const crown = c.color(['green', 'lime', 'forest']);
		const cx = c.w * 0.45;
		const cy = c.h * 0.48;
		const R = c.w * 0.27;
		const body: Shape = or(
			[
				'poly',
				[
					[cx - R * 0.95, cy - R * 0.3],
					[cx + R * 0.95, cy - R * 0.3],
					[cx, cy + R * 1.3]
				]
			],
			['circle', cx - R * 0.45, cy - R * 0.25, R * 0.6],
			['circle', cx + R * 0.45, cy - R * 0.25, R * 0.6],
			['ellipse', cx, cy + R * 0.2, R * 0.9, R * 0.7]
		);
		c.add(berry, body);
		c.add(crown, ['rect', cx - 0.8, cy - R * 1.25, 1.8, R * 0.5]);
		c.add(crown, star(cx, cy - R * 0.75, R * 0.65, R * 0.22, 6, 0));
		const fx = c.w * 0.82;
		const fy = c.h * 0.8;
		const blossom = c.color(['white', 'pink', 'cream', 'rose']);
		c.add(crown, ['rect', fx - 0.7, fy, 1.6, c.h]);
		for (let k = 0; k < 5; k++) {
			const t = (k / 5) * Math.PI * 2;
			c.add(blossom, ['circle', fx + Math.cos(t) * 2.4, fy + Math.sin(t) * 2.4, 1.9]);
		}
		c.add(seed, ['circle', fx, fy, 1.4]);
		// New colors: shaded berry, a shine, a darker crown, a cloth, gingham.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(berry, 'lr', 0.3)));
		c.more((e) => e.glint(berry, 'ul', 0.08, 20));
		c.more((e) => e.shade(crown, 'b', 0.35, -1, 4));
		c.more((e) => e.part(BRIGHTS.concat(BROWNS), ['rect', 0, c.h * 0.92, c.w, c.h], [bg], 6));
		c.more((e) => e.shade(blossom, 'lr', 0.35, -1, 4));
		c.more((e) => e.sprinkle(BLOOMS_ALL, 5, [bg]));
		c.later((d) => {
			// Seeds all over the berry, flecks in the crown and blossom, a checked cloth.
			d.hatch(body, [berry], [null, seed, shadow ?? OUTLINE, crown], 'dots');
			d.specks([berry, seed], [crown], d.n(1, 6));
			d.hatch(['rect', 0, c.h * 0.94, c.w, c.h], [bg], [bg, berry, seed, crown], 'diag');
			d.specks([berry, seed, crown], [bg], d.n(2, 10));
		});
		return `${cap(c.nameOf(berry))} Strawberry`;
	},
	pumpkin(c) {
		const sky = c.color(['night', 'navy', 'plum', 'dusk', 'sky', 'cream'], true);
		const ground = c.color(['brown', 'forest', 'green', 'tan', 'plum'], true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.82, c.w, c.h]);
		const pump = c.color(['orange', 'amber', 'coral', 'yellow']);
		const stem = c.color(['green', 'brown', 'forest', 'lime']);
		const glow = c.color(['yellow', 'cream', 'white', 'lime']);
		const cx = c.w / 2;
		const cy = c.h * 0.6;
		const r = c.w * 0.3;
		c.add(
			stem,
			path(
				[
					[c.w * 0.05, c.h * 0.84],
					[c.w * 0.2, c.h * 0.8],
					[c.w * 0.35, c.h * 0.84],
					[c.w * 0.65, c.h * 0.82],
					[c.w * 0.95, c.h * 0.85]
				],
				1.4
			)
		);
		c.add(stem, ['ellipse', c.w * 0.14, c.h * 0.78, 3, 1.6]);
		c.add(stem, ['ellipse', c.w * 0.85, c.h * 0.79, 3, 1.6]);
		const lobes: Shape[] = [
			['ellipse', cx - r * 0.55, cy, r * 0.55, r * 0.72],
			['ellipse', cx + r * 0.55, cy, r * 0.55, r * 0.72],
			['ellipse', cx, cy, r * 0.6, r * 0.78]
		];
		c.add(stem, [
			'poly',
			[
				[cx - 1.8, cy - r * 0.65],
				[cx + 1.8, cy - r * 0.65],
				[cx + 3.5, cy - r * 1.1],
				[cx + 1.5, cy - r * 1.15]
			]
		]);
		for (const l of lobes) c.add(pump, l);
		const face = c.rng() < 0.6;
		if (face) {
			for (const sx of [-1, 1])
				c.add(glow, [
					'poly',
					[
						[cx + sx * r * 0.42, cy - r * 0.1],
						[cx + sx * r * 0.12, cy - r * 0.1],
						[cx + sx * r * 0.27, cy - r * 0.4]
					]
				]);
			c.add(glow, [
				'poly',
				[
					[cx - r * 0.55, cy + r * 0.15],
					[cx + r * 0.55, cy + r * 0.15],
					[cx + r * 0.3, cy + r * 0.45],
					[cx, cy + r * 0.32],
					[cx - r * 0.3, cy + r * 0.45]
				]
			]);
		} else c.add(glow, ['circle', c.w * 0.82, c.h * 0.15, 3]);
		// New colors: shaded side lobes, a moon or its glow, a darker field, stars, leaves.
		let sides: string | undefined;
		c.more(
			(e) =>
				(sides = e.part(
					pump,
					any(
						['ellipse', cx - r * 0.7, cy, r * 0.32, r * 0.7],
						['ellipse', cx + r * 0.7, cy, r * 0.32, r * 0.7]
					),
					[pump],
					6,
					-1
				))
		);
		c.more((e) => e.shade(pump, 'lr', 0.15, -1, 10));
		c.more((e) => e.part(sky, ['circle', cx, cy, r * 1.35], [sky], 6, 1));
		c.more((e) => e.part(ground, ['rect', 0, c.h * 0.92, c.w, c.h], [ground], 6, -1));
		c.more((e) => e.shade(stem, 'b', 0.3, -1, 4));
		c.more((e) =>
			e.part(
				['tangerine', 'gold', 'lemon', 'apricot'],
				(x, y) =>
					face && y > cy - r * 0.4 && y < cy + r * 0.5 && e.at(x, y) === glow && (x + y) % 2 === 0,
				[glow],
				3
			)
		);
		c.more((e) => e.sprinkle(['ivory', 'lemon', 'ice', 'lavender'], 7, [sky]));
		c.later((d) => {
			// Ridges down the lobes, flecks in the light, a straw field, stars.
			d.hatch(
				['ellipse', cx, cy + r * 0.55, r * 1.05, r * 0.2],
				[pump],
				[pump, sides ?? stem, OUTLINE, glow],
				'zig'
			);
			d.specks([stem, OUTLINE], [pump], d.n(2, 8));
			d.specks([pump], [glow], d.n(0, 3));
			d.hatch(['rect', 0, c.h * 0.86, c.w, 3], [ground], [ground, pump, glow, stem], 'zig');
			d.specks([glow, pump], [sky], d.n(3, 14));
		});
		return `${cap(c.nameOf(pump))} Pumpkin`;
	},
	snail(c) {
		const sky = c.color(SKY, true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.8, c.w, c.h]);
		const shell = c.color(['brown', 'amber', 'orange', 'plum', 'pink', 'violet']);
		const swirl = c.color(['sand', 'cream', 'yellow', 'tan', 'rose']);
		const skin = c.color(['tan', 'grey', 'lime', 'sand', 'mint', 'lilac']);
		const cx = c.w * 0.42;
		const sy = c.h * 0.52;
		const R = c.w * 0.25;
		const hx = cx + c.w * 0.36;
		c.add(skin, ['ellipse', cx + c.w * 0.04, c.h * 0.77, c.w * 0.38, c.h * 0.07]);
		c.add(skin, [
			'poly',
			[
				[hx - 4, c.h * 0.77],
				[hx + 2, c.h * 0.77],
				[hx + 1.5, c.h * 0.58],
				[hx - 3, c.h * 0.6]
			]
		]);
		c.add(skin, ['circle', hx - 0.5, c.h * 0.58, 3.2]);
		for (const dx of [-2, 1.5]) {
			c.add(skin, segment(hx + dx * 0.4, c.h * 0.56, hx + dx, c.h * 0.42, 1.2));
			c.add(skin, ['circle', hx + dx, c.h * 0.42, 1.3]);
		}
		const shellShape: Shape = ['circle', cx, sy, R];
		c.add(shell, shellShape);
		c.add(swirl, ring(cx + R * 0.08, sy + R * 0.06, R * 0.74, R * 0.52));
		c.add(shell, ['circle', cx + R * 0.14, sy + R * 0.1, R * 0.5]);
		c.add(swirl, ring(cx + R * 0.2, sy + R * 0.13, R * 0.36, R * 0.18));
		// New colors: shaded shell, shaded skin, a slime trail, a cloud, a deeper field, flowers.
		let shadow: string | undefined;
		c.more((e) => (shadow = e.shade(shell, 'lr', 0.25)));
		c.more((e) => e.shade(skin, 'b', 0.35, -1, 6));
		c.more((e) =>
			e.part(
				['ice', 'ivory', 'seafoam', 'lavender'],
				['rect', 0, c.h * 0.84, cx - c.w * 0.2, 1.4],
				[ground],
				3
			)
		);
		c.more((e) => {
			const x = c.w * e.r(0.1, 0.4);
			e.part(
				LIGHTS,
				any(['ellipse', x, c.h * 0.12, 4.2, 1.5], ['circle', x + 1, c.h * 0.12 - 1, 1.7]),
				[sky],
				5
			);
		});
		c.more((e) => e.part(ground, ['rect', 0, c.h * 0.93, c.w, c.h], [ground], 6, -1));
		c.more((e) => e.shade(swirl, 'lr', 0.3, -1, 6));
		c.more((e) => e.sprinkle(BLOOMS_ALL, 5, [ground]));
		c.later((d) => {
			// A banded shell, spots on the skin, eyes, grass and pebbles, birds.
			d.hatch(ring(cx, sy, R, R * 0.78), [shell], [shell, swirl, OUTLINE, shadow ?? skin], 'zig');
			d.specks([OUTLINE], [skin], 2, ['rect', 0, c.h * 0.38, c.w, c.h * 0.08]);
			d.specks([shell, OUTLINE], [skin], d.n(1, 6), ['rect', 0, c.h * 0.7, c.w, c.h]);
			d.hatch(['rect', 0, c.h * 0.8, c.w, 2], [ground], [ground, shell, swirl, skin], 'zig');
			d.specks([shell, skin, swirl], [ground], d.n(1, 8));
			d.specks([OUTLINE], [sky], d.n(1, 6));
		});
		return `${cap(c.nameOf(shell))} Snail`;
	},
	volcano(c) {
		const sky = c.color(['dusk', 'plum', 'night', 'navy', 'rose', 'sand'], true);
		const land = c.color(['teal', 'blue', 'forest', 'green', 'navy'], true);
		c.fill(sky);
		c.add(land, ['rect', 0, c.h * 0.86, c.w, c.h]);
		const rock = c.color(['brown', 'grey', 'plum', 'tan']);
		const lava = c.color(['orange', 'red', 'amber', 'yellow', 'coral']);
		const smoke = c.color(['grey', 'lilac', 'cream', 'white']);
		const cx = c.w / 2 + c.r(-1.5, 1.5);
		const top = c.h * 0.38;
		const plume: Shape[] = [
			['circle', cx, top - 4, 3.2],
			['circle', cx - 3, top - 8, 3.6],
			['circle', cx + 2, top - 11, 4],
			['circle', cx + 6, top - 14, 3.6]
		];
		for (const p of plume) c.add(smoke, p);
		const cone: Shape = [
			'poly',
			[
				[c.w * 0.02, c.h * 0.88],
				[c.w * 0.98, c.h * 0.88],
				[cx + c.w * 0.12, top],
				[cx - c.w * 0.12, top]
			]
		];
		c.add(rock, cone);
		c.add(lava, ['ellipse', cx, top, c.w * 0.11, 1.6]);
		const flows: [number, number][][] = [
			[
				[cx - 2, top],
				[cx - 4, top + c.h * 0.12],
				[cx - 2, top + c.h * 0.24],
				[cx - 6, top + c.h * 0.4]
			],
			[
				[cx + 2, top],
				[cx + 5, top + c.h * 0.14],
				[cx + 4, top + c.h * 0.28],
				[cx + 8, top + c.h * 0.44]
			]
		];
		for (const f of flows) c.add(lava, path(f, 3.6));
		for (let k = 0; k < 3; k++)
			c.add(lava, ['circle', cx + c.r(-c.w * 0.3, c.w * 0.3), c.r(c.h * 0.06, top - 6), 1.1]);
		// New colors: a hot core, shaded rock, a glowing horizon, shaded smoke, palms, stars.
		let core: string | undefined;
		c.more((e) => (core = e.part(lava, any(...flows.map((f) => path(f, 0.9))), [lava], 4, 1)));
		c.more((e) => e.part(rock, ['rect', cx + c.w * 0.04, 0, c.w, c.h], [rock], 6, -1));
		c.more((e) => e.part(sky, ['rect', 0, c.h * 0.72, c.w, c.h * 0.14], [sky], 6, 1));
		c.more((e) => e.shade(smoke, 'lr', 0.35, -1, 6));
		c.more((e) => e.part(land, ['rect', 0, c.h * 0.95, c.w, c.h], [land], 4, -1));
		c.more((e) =>
			e.part(
				GREENS_ALL,
				any(
					['ellipse', c.w * 0.08, c.h * 0.84, 2.6, 1.2],
					['ellipse', c.w * 0.93, c.h * 0.84, 2.6, 1.2]
				),
				[sky, land],
				3
			)
		);
		c.more((e) => e.sprinkle(['ivory', 'lemon', 'ice', 'peach'], 6, [sky]));
		c.later((d) => {
			// Lava that bubbles, embers on the slope, ash in the smoke, sparks in the air.
			for (const f of flows)
				d.hatch(
					['and', path(f, 3.6), ['rect', 0, top + c.h * 0.22, c.w, c.h]],
					[lava],
					[lava, rock, core ?? OUTLINE, smoke],
					'zig'
				);
			d.specks([lava, smoke, OUTLINE], [rock], d.n(3, 14));
			for (const p of plume) d.hatch(p, [smoke], [null, sky, rock, lava], 'dots');
			d.specks([lava, smoke], [sky], d.n(2, 10));
			d.specks([lava, rock], [land], d.n(1, 6));
		});
		return `${cap(c.nameOf(lava))} Volcano`;
	}
};

/** A name made unique among `ids`: "Red Target", then "Red Target II" (id red-target-2) and on. */
function unique(name: string, ids: Set<string>) {
	let id = slug(name);
	let shown = name;
	for (let k = 2; ids.has(id); k++) {
		id = `${slug(name)}-${k}`;
		shown = `${name} ${['II', 'III', 'IV', 'V', 'VI'][k - 2] ?? k}`;
	}
	return { id, shown };
}

// The first set: packs 02 to 05, the first templates in turn, 28 wide at first, up to 34.
const kinds = Object.keys(TEMPLATES);
const pictures: Picture[] = [];
const ids = new Set<string>();
let fails = 0;
for (let n = 0, seed = 1; pictures.length < FIRST && seed < FIRST * 40; seed++) {
	// A template that keeps failing (colors too alike, too plain) gives way to the next.
	if (fails >= 6) {
		n++;
		fails = 0;
	}
	const rng = makeRng(seed * 2654435761);
	// Bigger as the game goes on: 28 wide at first, up to 34.
	const grow = pictures.length / Math.max(1, FIRST - 1);
	const w = Math.round(28 + grow * 6) + (rng() < 0.5 ? 0 : -1);
	const h = Math.round(w * (0.9 + rng() * 0.25));
	const kind = kinds[n % kinds.length];
	// Detail grows with the same place in play, on random numbers of its own.
	const c = new Canvas(w, h, rng, makeRng(seed * 40503 + 7), grow, makeRng(seed * 7919 + 101));
	let name: string;
	try {
		name = TEMPLATES[kind](c);
	} catch {
		fails++;
		continue;
	}
	const { id, shown } = unique(name, ids);
	const pic = c.finish(id, shown);
	if (!pic) {
		fails++;
		continue;
	}
	ids.add(id);
	pictures.push(pic);
	fails = 0;
	n++;
}

// The second set: packs 06 to 10. Each new subject comes up twice, about 50 levels apart,
// with some of the first set's subjects between them. Pictures grow from 33 or 34 wide to
// 39 or 40 (the most a phone shows at 8px a food), and colors and detail keep growing from
// where the first set ends: 12 colors at first, 16 at the end.
const subjects = Object.keys(SUBJECTS);
const order: string[] = [];
for (const from of [0, 3]) {
	const old = kinds.slice(from, from + 16);
	let o = 0;
	subjects.forEach((s, i) => {
		order.push(s);
		if (i % 2 === 1 && o < old.length) order.push(old[o++]);
	});
}
const draw: Record<string, Template> = { ...TEMPLATES, ...SUBJECTS };
// Hand-drawn ids count too, so no generated level takes one.
for (const lv of JSON.parse(
	readFileSync(new URL('../src/lib/forage/levels/01-outlines.json', import.meta.url), 'utf8')
).levels)
	ids.add(lv.id);
const second: Picture[] = [];
let seed2 = 1;
order.forEach((kind, j) => {
	const grow = j / (order.length - 1);
	for (let tries = 0; ; tries++, seed2++) {
		if (tries >= 60) throw new Error(`${kind}: no picture in 60 tries`);
		const rng = makeRng((seed2 + 90000) * 2654435761);
		const w = Math.round(33.5 + grow * 6.5) - (rng() < 0.5 ? 0 : 1);
		const h = Math.round(w * (0.9 + rng() * 0.2));
		const c = new Canvas(
			w,
			h,
			rng,
			makeRng(seed2 * 40503 + 99991),
			1 + 0.5 * grow,
			makeRng(seed2 * 7919 + 77777)
		);
		c.colors = Math.round(12 + 4 * grow);
		let pic: Picture | null = null;
		try {
			const { id, shown } = unique(draw[kind](c), ids);
			pic = c.finish(id, shown);
		} catch {
			// Colors too alike: try another seed.
		}
		if (!pic) continue;
		ids.add(pic.id);
		second.push(pic);
		seed2++;
		return;
	}
});

/** Whether two levels have the same picture, so a rewritten one keeps what forage:tune saved. */
const same = (a: Picture, b: Picture) =>
	a.id === b.id &&
	a.name === b.name &&
	JSON.stringify([a.palette, a.art]) === JSON.stringify([b.palette, b.art]);

const packs = [
	...['Morning', 'Afternoon', 'Evening', 'Midnight'].map((name, p) => ({
		num: 2 + p,
		name,
		levels: pictures.slice(p * 22, (p + 1) * 22)
	})),
	...['Dawn', 'Noon', 'Dusk', 'Night', 'Small Hours'].map((name, p) => ({
		num: 6 + p,
		name,
		levels: second.slice(p * 20, (p + 1) * 20)
	}))
];
/** What forage:tune saved in a level. */
const KEEP = new Set<string>(TUNED);
mkdirSync(OUT, { recursive: true });
for (const { num, name, levels } of packs) {
	if (num < START_PACK || !levels.length) continue;
	const file = new URL(`${String(num).padStart(2, '0')}-${slug(name)}.json`, OUT);
	const was: Picture[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).levels : [];
	const out = levels.map((lv) => {
		const old = was.find((o) => same(o, lv)) as Record<string, unknown> | undefined;
		if (!old) return lv;
		return { ...lv, ...Object.fromEntries(Object.entries(old).filter(([k]) => KEEP.has(k))) };
	});
	await writePack(file, { name, levels: out });
	console.log(
		`${String(num).padStart(2, '0')} ${name}: ${levels.map((l) => `${l.id} ${l.art[0].length}x${l.art.length}`).join(', ')}`
	);
}
console.log(`${pictures.length + second.length} pictures`);
