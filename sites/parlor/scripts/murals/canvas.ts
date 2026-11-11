/*
 * The grid a mural is painted on: one letter per dot, each letter a palette color.
 * Later paint covers earlier paint. Positions can be fractions; a dot lands on the
 * cell its position falls in.
 */

/** Drop the fraction, toward zero. */
export const int = Math.trunc;

/** Round to the nearest whole number, a half going to the even one. */
export function round(x: number): number {
	const f = Math.floor(x);
	const d = x - f;
	if (d !== 0.5) return d < 0.5 ? f : f + 1;
	return f % 2 === 0 ? f : f + 1;
}

/** The remainder that is never negative for a positive `b`: `mod(-1, 4)` is 3. */
export const mod = (a: number, b: number) => ((a % b) + b) % b;

/** Whole-number division, rounding down. */
export const div = (a: number, b: number) => Math.floor(a / b);

export type Point = [x: number, y: number];
type Where = (x: number, y: number) => boolean;

export class Canvas {
	readonly w: number;
	readonly h: number;
	/** The dots by row, then column. Painting straight into it skips the offset. */
	readonly g: string[][];
	#ox = 0;
	#oy = 0;
	#clip: [x0: number, y0: number, x1: number, y1: number] | null = null;

	constructor(w: number, h: number, ground: string) {
		this.w = w;
		this.h = h;
		this.g = Array.from({ length: h }, () => Array<string>(w).fill(ground));
	}

	/** Shift everything painted from here on, so a figure can be drawn once and placed anywhere. */
	at = (ox = 0, oy = 0) => {
		this.#ox = ox;
		this.#oy = oy;
	};

	/**
	 * Keep paint inside a box (corners included) from here on, so a figure can't spill
	 * into the panel beside it. The box moves with `at`. With no box, paint goes anywhere.
	 */
	clip = (x0?: number, y0?: number, x1?: number, y1?: number) => {
		this.#clip = x0 === undefined ? null : [x0, y0 ?? x0, x1 ?? x0, y1 ?? y0 ?? x0];
	};

	put = (x: number, y: number, c: string) => {
		x = Math.floor(x);
		y = Math.floor(y);
		const box = this.#clip;
		if (box && (x < box[0] || x > box[2] || y < box[1] || y > box[3])) return;
		x += this.#ox;
		y += this.#oy;
		if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.g[y][x] = c;
	};

	/** The color at a whole-number spot, or '' off the canvas. */
	get = (x: number, y: number): string => {
		x += this.#ox;
		y += this.#oy;
		return x >= 0 && x < this.w && y >= 0 && y < this.h ? this.g[y][x] : '';
	};

	/** A filled box, both corners included. */
	rect = (x0: number, y0: number, x1: number, y1: number, c: string) => {
		for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.put(x, y, c);
	};

	/** A filled oval; `where` can keep part of it. */
	ell = (cx: number, cy: number, rx: number, ry: number, c: string, where?: Where) => {
		for (let y = int(cy - ry) - 1; y < int(cy + ry) + 2; y++) {
			for (let x = int(cx - rx) - 1; x < int(cx + rx) + 2; x++) {
				const inside = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
				if (inside && (!where || where(x, y))) this.put(x, y, c);
			}
		}
	};

	disk = (cx: number, cy: number, r: number, c: string, where?: Where) =>
		this.ell(cx, cy, r, r, c, where);

	/** A circle's outline, `t` dots thick. */
	ring = (cx: number, cy: number, r: number, c: string, t = 0.9) => {
		for (let y = int(cy - r) - 1; y < int(cy + r) + 2; y++) {
			for (let x = int(cx - r) - 1; x < int(cx + r) + 2; x++) {
				const d = Math.hypot(x - cx, y - cy);
				if (d >= r - t && d <= r + 0.3) this.put(x, y, c);
			}
		}
	};

	line = (x0: number, y0: number, x1: number, y1: number, c: string) => {
		const n = int(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) || 1;
		for (let i = 0; i <= n; i++) {
			this.put(round(x0 + ((x1 - x0) * i) / n), round(y0 + ((y1 - y0) * i) / n), c);
		}
	};

	dots = (c: string, ...points: Point[]) => {
		for (const [x, y] of points) this.put(x, y, c);
	};

	/**
	 * Paint a small pattern given as rows of marks, its top left at (x, y). `key` says
	 * which color each mark paints; any other mark paints nothing. `flip` mirrors it.
	 */
	stamp = (pattern: string[], x: number, y: number, key: Record<string, string>, flip = false) => {
		pattern.forEach((line, r) => {
			const row = flip ? [...line].reverse() : [...line];
			row.forEach((ch, i) => {
				if (Object.hasOwn(key, ch)) this.put(x + i, y + r, key[ch]);
			});
		});
	};

	/** The whole picture as rows of letters. */
	rows(): string[] {
		return this.g.map((row) => row.join(''));
	}
}
