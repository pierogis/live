export const int = Math.trunc;

export function round(x: number): number {
	const f = Math.floor(x);
	const d = x - f;
	if (d !== 0.5) return d < 0.5 ? f : f + 1;
	return f % 2 === 0 ? f : f + 1;
}

export const mod = (a: number, b: number) => ((a % b) + b) % b;

export const div = (a: number, b: number) => Math.floor(a / b);

export type Point = [x: number, y: number];

export const points = <P extends number[] = Point>(list: string): P[] =>
	list
		.trim()
		.split(/\s+/)
		.map((p) => p.split(',').map(Number) as P);

export const SIDES = points('1,0 -1,0 0,1 0,-1');

export const turn = (p: string[]) =>
	[...p[0]].map((_, i) =>
		p
			.map((row) => row[i])
			.reverse()
			.join('')
	);

export const around = (n: number, r: number, cx: number, cy: number, from = 0) =>
	Array.from({ length: n }, (_, k) => {
		const a = from + (k * 2 * Math.PI) / n;
		return [cx + r * Math.cos(a), cy + r * Math.sin(a), a] as const;
	});

export const inell = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
	((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

type Where = (x: number, y: number) => boolean;

export class Canvas {
	readonly w: number;
	readonly h: number;
	readonly g: string[][];
	#ox = 0;
	#oy = 0;
	#clip: [x0: number, y0: number, x1: number, y1: number] | null = null;

	constructor(w: number, h: number, ground: string) {
		this.w = w;
		this.h = h;
		this.g = Array.from({ length: h }, () => Array<string>(w).fill(ground));
	}

	at = (ox = 0, oy = 0) => {
		this.#ox = ox;
		this.#oy = oy;
	};

	clip = (...box: [x0: number, y0: number, x1: number, y1: number] | []) => {
		this.#clip = box.length ? box : null;
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

	get = (x: number, y: number): string => {
		x += this.#ox;
		y += this.#oy;
		return x >= 0 && x < this.w && y >= 0 && y < this.h ? this.g[y][x] : '';
	};

	rect = (x0: number, y0: number, x1: number, y1: number, c: string) => {
		for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.put(x, y, c);
	};

	ell = (cx: number, cy: number, rx: number, ry: number, c: string, where?: Where) => {
		for (let y = int(cy - ry) - 1; y < int(cy + ry) + 2; y++) {
			for (let x = int(cx - rx) - 1; x < int(cx + rx) + 2; x++) {
				if (inell(x, y, cx, cy, rx, ry) && (!where || where(x, y))) this.put(x, y, c);
			}
		}
	};

	oval = (cx: number, cy: number, rx: number, ry: number, a: number, c: string) => {
		const ca = Math.cos(a);
		const sa = Math.sin(a);
		const r = Math.ceil(Math.max(rx, ry)) + 1;
		for (let y = Math.floor(cy) - r; y <= Math.ceil(cy) + r; y++) {
			for (let x = Math.floor(cx) - r; x <= Math.ceil(cx) + r; x++) {
				const u = (x - cx) * ca + (y - cy) * sa;
				const v = -(x - cx) * sa + (y - cy) * ca;
				if ((u / rx) ** 2 + (v / ry) ** 2 <= 1) this.put(x, y, c);
			}
		}
	};

	leaf = (x: number, y: number, a: number, len: number, c: string, vein = '') => {
		this.oval(x + (Math.cos(a) * len) / 2, y + (Math.sin(a) * len) / 2, len / 2 + 0.3, 1.2, a, c);
		if (vein) this.put(x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5, vein);
	};

	disk = (cx: number, cy: number, r: number, c: string, where?: Where) =>
		this.ell(cx, cy, r, r, c, where);

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

	stamp = (pattern: string[], x: number, y: number, key: Record<string, string>, flip = false) => {
		pattern.forEach((line, r) => {
			const row = flip ? [...line].reverse() : [...line];
			row.forEach((ch, i) => {
				if (Object.hasOwn(key, ch)) this.put(x + i, y + r, key[ch]);
			});
		});
	};

	rows(): string[] {
		return this.g.map((row) => row.join(''));
	}
}
