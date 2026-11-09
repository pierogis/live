/*
 * Named colors for Mosaic's generated pictures, and a picker that gives each part of a
 * picture a true color from its list while keeping every pair in the picture easy to
 * tell apart (MIN_DELTA, plus a wider gap inside one hue family, so no look-alike reds).
 */
import { deltaE, lab, MIN_DELTA, type Lab } from '../../src/lib/shared/palette.ts';
import type { Rng } from '../../src/lib/shared/engine.ts';

/** name: [hex, family]. Families: a wider gap is kept between two colors of one family. */
const BANK: Record<string, [string, string]> = {
	white: ['#ffffff', 'white'],
	snow: ['#eef4fb', 'white'],
	cream: ['#fff1cc', 'white'],
	ice: ['#c9ecfb', 'blue'],
	lemon: ['#fff176', 'yellow'],
	yellow: ['#ffd23f', 'yellow'],
	gold: ['#f2b705', 'yellow'],
	sand: ['#efd08f', 'tan'],
	beige: ['#e5d2b0', 'tan'],
	tan: ['#d4a373', 'tan'],
	peach: ['#ffc8a2', 'orange'],
	apricot: ['#f9a66c', 'orange'],
	orange: ['#ff8c2e', 'orange'],
	amber: ['#e8891c', 'orange'],
	rust: ['#b5481b', 'brown'],
	coral: ['#ff6f61', 'red'],
	red: ['#e23838', 'red'],
	crimson: ['#a3123a', 'red'],
	maroon: ['#661a2a', 'red'],
	salmon: ['#fa9e8a', 'pink'],
	blush: ['#f8c3d0', 'pink'],
	rose: ['#ef8fae', 'pink'],
	pink: ['#ff6fb0', 'pink'],
	magenta: ['#cf2f98', 'purple'],
	orchid: ['#d77fd8', 'purple'],
	lilac: ['#cdb6ef', 'purple'],
	lavender: ['#a996ec', 'purple'],
	violet: ['#8a55d8', 'purple'],
	purple: ['#64329a', 'purple'],
	plum: ['#4a1f52', 'purple'],
	indigo: ['#3a3a96', 'blue'],
	navy: ['#1d2f5e', 'blue'],
	night: ['#161c38', 'dark'],
	cobalt: ['#2350c8', 'blue'],
	blue: ['#3b82e0', 'blue'],
	azure: ['#5aa9f5', 'blue'],
	sky: ['#94d4fb', 'blue'],
	steel: ['#5f7f9f', 'grey'],
	teal: ['#159a94', 'teal'],
	turquoise: ['#33c3c6', 'teal'],
	aqua: ['#7fe3e0', 'teal'],
	mint: ['#b8efcf', 'green'],
	lime: ['#a8dc42', 'green'],
	leaf: ['#5cb948', 'green'],
	green: ['#2e9a50', 'green'],
	forest: ['#1d5a32', 'green'],
	pine: ['#103d2c', 'green'],
	olive: ['#7c7d2a', 'green'],
	sage: ['#9db894', 'green'],
	caramel: ['#c57b38', 'brown'],
	brown: ['#8a552c', 'brown'],
	chocolate: ['#4b2716', 'brown'],
	grey: ['#9c9aa6', 'grey'],
	silver: ['#c9c9d2', 'grey'],
	stone: ['#7d776e', 'grey'],
	slate: ['#4a5566', 'grey'],
	charcoal: ['#34343c', 'dark'],
	black: ['#141418', 'dark']
};

const COLOR_NAMES = Object.keys(BANK);
/** The hex for a color name; throws on a name not in the bank. */
export const hexOf = (name: string) => {
	if (!BANK[name]) throw new Error(`no color "${name}"`);
	return BANK[name][0];
};

/** Two colors of one family need this much more than MIN_DELTA to sit in one picture. */
const FAMILY_DELTA = 34;
/** A little over the rule, so rounding never lands a pair right on it. */
const DELTA = MIN_DELTA + 1;

const LABS: Record<string, Lab> = Object.fromEntries(
	Object.entries(BANK).map(([k, [hex]]) => [k, lab(hex)])
);

/** Whether two colors stand far enough apart to sit in one picture. */
export function fits(a: string, b: string): boolean {
	const d = deltaE(LABS[a], LABS[b]);
	return d >= (BANK[a][1] === BANK[b][1] ? FAMILY_DELTA : DELTA);
}

/**
 * One color per part, in order, each from its own list, every pair fitting.
 * Lists are tried mostly in order (the first is the truest color), lightly shuffled
 * by `rng` so repeats of a subject vary. Returns null when no choice fits.
 */
export function assignColors(lists: string[][], rng: Rng): string[] | null {
	const orders = lists.map((list) => {
		const xs = list.map((name, k) => ({ name, key: k + rng() * 2.2 }));
		return xs.sort((a, b) => a.key - b.key).map((x) => x.name);
	});
	const out: string[] = [];
	let budget = 20000;
	const go = (i: number): boolean => {
		if (i === orders.length) return true;
		for (const name of orders[i]) {
			if (--budget < 0) return false;
			if (out.includes(name) || !out.every((o) => fits(o, name))) continue;
			out.push(name);
			if (go(i + 1)) return true;
			out.pop();
		}
		return false;
	};
	return go(0) ? out : null;
}

/**
 * Colors that read as a lighter or darker tone of `name`: about the same hue (within
 * `maxHue` radians; for a grey, another grey), far enough apart to fit beside it,
 * nearest first.
 */
export function tones(name: string, maxHue = 0.6): string[] {
	const [, a, b] = LABS[name];
	const C = Math.hypot(a, b);
	const hue = Math.atan2(b, a);
	return COLOR_NAMES.filter((n) => {
		if (n === name || !fits(name, n)) return false;
		const [, a2, b2] = LABS[n];
		const C2 = Math.hypot(a2, b2);
		if (C < 15) return C2 < 20;
		if (C2 < 12) return false;
		let d = Math.abs(Math.atan2(b2, a2) - hue);
		if (d > Math.PI) d = 2 * Math.PI - d;
		return d < maxHue;
	})
		.sort((x, y) => deltaE(LABS[name], LABS[x]) - deltaE(LABS[name], LABS[y]))
		.slice(0, 6);
}

/** A color's lightness, 0 (black) to 100 (white). */
export const lightness = (name: string) => LABS[name][0];
