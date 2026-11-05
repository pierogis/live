/*
 * Pieces every game's engine uses: seeded randomness and reading a picture's
 * letters into colors. No DOM; imports use `.ts` so node tests and scripts can
 * load the engines directly.
 */

export type Rng = () => number;

export interface Color {
	key: string;
	hex: string;
}

/** A picture as an engine sees it: one color index per pixel (-1 is empty). */
export interface Art {
	w: number;
	h: number;
	target: number[];
	colors: Color[];
}

/** FNV-1a: a level id becomes a stable seed. */
export function hashStr(s: string): number {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

/** mulberry32: small, fast, seeded. */
export function makeRng(seed: number): Rng {
	let a = seed >>> 0;
	return function () {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function shuffle<T>(arr: T[], rng: Rng): T[] {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		const t = arr[i];
		arr[i] = arr[j];
		arr[j] = t;
	}
	return arr;
}

export function pickWeighted<T>(items: T[], weight: (t: T) => number, rng: Rng): T {
	const total = items.reduce((sum, t) => sum + weight(t), 0);
	let r = rng() * total;
	for (const t of items) {
		r -= weight(t);
		if (r < 0) return t;
	}
	return items[items.length - 1];
}

/** Read a picture's rows of letters into color indices, in order of first use. */
export function parseArt(level: {
	id: string;
	palette: Record<string, string>;
	art: string[];
}): Art {
	const h = level.art.length;
	const w = level.art[0].length;
	const keys: string[] = [];
	const target: number[] = new Array(w * h).fill(-1);
	level.art.forEach((row, y) => {
		if (row.length !== w) {
			throw new Error(`${level.id}: row ${y} is ${row.length} wide, expected ${w}`);
		}
		for (let x = 0; x < w; x++) {
			const ch = row[x];
			if (ch === '.') continue;
			if (!(ch in level.palette)) throw new Error(`${level.id}: no color for "${ch}"`);
			let k = keys.indexOf(ch);
			if (k < 0) {
				k = keys.length;
				keys.push(ch);
			}
			target[y * w + x] = k;
		}
	});
	return { w, h, target, colors: keys.map((key) => ({ key, hex: level.palette[key] })) };
}
