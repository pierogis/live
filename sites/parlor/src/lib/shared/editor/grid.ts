/* Pixel grid helpers for the editor. Pure, so tests can run them. */
import { KEYS } from './quantize.ts';

export interface Grid {
	w: number;
	h: number;
	/** One palette letter per pixel, '.' for empty, row by row. */
	cells: string[];
}

export function fromArt(art: string[]): Grid {
	const h = art.length;
	const w = art[0]?.length ?? 0;
	return { w, h, cells: art.join('').split('') };
}

export function toArt(g: Grid): string[] {
	const rows: string[] = [];
	for (let y = 0; y < g.h; y++) rows.push(g.cells.slice(y * g.w, (y + 1) * g.w).join(''));
	return rows;
}

export function blank(w: number, h: number, key = '.'): Grid {
	return { w, h, cells: new Array(w * h).fill(key) };
}

/** Paint-bucket fill from cell `i` over touching cells of the same letter (no diagonals). */
export function fill(g: Grid, i: number, key: string): Grid {
	const from = g.cells[i];
	if (from === key) return g;
	const cells = g.cells.slice();
	const todo = [i];
	cells[i] = key;
	while (todo.length) {
		const j = todo.pop()!;
		const x = j % g.w;
		const y = Math.floor(j / g.w);
		const near = [
			x > 0 ? j - 1 : -1,
			x < g.w - 1 ? j + 1 : -1,
			y > 0 ? j - g.w : -1,
			y < g.h - 1 ? j + g.w : -1
		];
		for (const n of near) {
			if (n >= 0 && cells[n] === from) {
				cells[n] = key;
				todo.push(n);
			}
		}
	}
	return { ...g, cells };
}

/** Replace every pixel of one letter with another. */
export function replaceAll(g: Grid, from: string, to: string): Grid {
	return { ...g, cells: g.cells.map((c) => (c === from ? to : c)) };
}

/** Change the size, keeping the picture centered. New pixels get `pad`. */
export function resize(g: Grid, w: number, h: number, pad = '.'): Grid {
	const ox = Math.floor((w - g.w) / 2);
	const oy = Math.floor((h - g.h) / 2);
	const cells = new Array(w * h).fill(pad);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const sx = x - ox;
			const sy = y - oy;
			if (sx >= 0 && sy >= 0 && sx < g.w && sy < g.h) cells[y * w + x] = g.cells[sy * g.w + sx];
		}
	}
	return { w, h, cells };
}

/** Shift the picture by (dx, dy), wrapping around the edges. */
export function shift(g: Grid, dx: number, dy: number): Grid {
	const cells = new Array(g.w * g.h);
	for (let y = 0; y < g.h; y++) {
		for (let x = 0; x < g.w; x++) {
			const nx = (((x + dx) % g.w) + g.w) % g.w;
			const ny = (((y + dy) % g.h) + g.h) % g.h;
			cells[ny * g.w + nx] = g.cells[y * g.w + x];
		}
	}
	return { ...g, cells };
}

/** Mirror the picture left to right. */
export function flip(g: Grid): Grid {
	const cells = new Array(g.w * g.h);
	for (let y = 0; y < g.h; y++) {
		for (let x = 0; x < g.w; x++) cells[y * g.w + (g.w - 1 - x)] = g.cells[y * g.w + x];
	}
	return { ...g, cells };
}

/** The first palette letter not in use yet, or null when all are taken. */
export function nextKey(palette: Record<string, string>): string | null {
	for (const k of KEYS) if (!(k in palette)) return k;
	return null;
}

/** A level id from a name: "Hot Air Balloon" -> "hot-air-balloon". */
export function slug(name: string): string {
	return name
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
