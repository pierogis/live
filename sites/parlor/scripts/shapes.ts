/*
 * Draw a picture from simple shapes, then turn it into pixel rows.
 * Handy for writing levels in code; the editor works on the pixels directly.
 *
 * Coordinates are in cells. A cell is painted when its center is inside.
 *   ['rect', x, y, w, h]
 *   ['circle', cx, cy, r]
 *   ['ellipse', cx, cy, rx, ry]
 *   ['poly', [[x, y], ...]]
 *   ['and', shapeA, shapeB, ...]   inside all of them
 *   ['not', shape]                 outside it
 */

export type Shape =
	| ['rect', number, number, number, number]
	| ['circle', number, number, number]
	| ['ellipse', number, number, number, number]
	| ['poly', [number, number][]]
	| ['and', ...Shape[]]
	| ['not', Shape];

export interface Drawing {
	w: number;
	h: number;
	/** The color letter that fills the whole picture first ('.' for empty). */
	base: string;
	/** [colorLetter, shape] pairs, painted in order, later ones on top. */
	draw: [string, Shape][];
}

export function inside(shape: Shape, px: number, py: number): boolean {
	switch (shape[0]) {
		case 'rect': {
			const [, x, y, w, h] = shape;
			return px >= x && px < x + w && py >= y && py < y + h;
		}
		case 'circle': {
			const [, cx, cy, r] = shape;
			return (px - cx) * (px - cx) + (py - cy) * (py - cy) <= r * r;
		}
		case 'ellipse': {
			const [, cx, cy, rx, ry] = shape;
			const dx = (px - cx) / rx;
			const dy = (py - cy) / ry;
			return dx * dx + dy * dy <= 1;
		}
		case 'poly': {
			const pts = shape[1];
			let c = false;
			for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
				const [xi, yi] = pts[i];
				const [xj, yj] = pts[j];
				if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
			}
			return c;
		}
		case 'and': {
			const [, ...parts] = shape;
			return parts.every((s) => inside(s, px, py));
		}
		case 'not':
			return !inside(shape[1], px, py);
	}
}

export function rasterize(d: Drawing): string[] {
	const rows: string[] = [];
	for (let y = 0; y < d.h; y++) {
		let row = '';
		for (let x = 0; x < d.w; x++) {
			let key = d.base;
			for (const [k, shape] of d.draw) if (inside(shape, x + 0.5, y + 0.5)) key = k;
			row += key;
		}
		rows.push(row);
	}
	return rows;
}

/*
 * Helpers that build shapes out of the ones above, for drawing in code.
 */

/** Inside any of `shapes`. */
export function or(...shapes: Shape[]): Shape {
	return ['not', ['and', ...shapes.map((s): Shape => ['not', s])]];
}

/** A band between two circles around (cx, cy): `r` out, `inner` in. */
export function ring(cx: number, cy: number, r: number, inner: number): Shape {
	return ['and', ['circle', cx, cy, r], ['not', ['circle', cx, cy, inner]]];
}

/** A straight bar `width` wide from (x0, y0) to (x1, y1), with square ends. */
export function segment(x0: number, y0: number, x1: number, y1: number, width: number): Shape {
	const len = Math.hypot(x1 - x0, y1 - y0) || 1;
	const nx = (-(y1 - y0) / len) * (width / 2);
	const ny = ((x1 - x0) / len) * (width / 2);
	return [
		'poly',
		[
			[x0 + nx, y0 + ny],
			[x1 + nx, y1 + ny],
			[x1 - nx, y1 - ny],
			[x0 - nx, y0 - ny]
		]
	];
}

/** A regular polygon with `n` corners on a circle of radius `r`, turned by `turn` radians. */
export function regular(cx: number, cy: number, r: number, n: number, turn = 0): Shape {
	return [
		'poly',
		Array.from({ length: n }, (_, k): [number, number] => {
			const t = turn + (k / n) * Math.PI * 2;
			return [cx + Math.cos(t) * r, cy + Math.sin(t) * r];
		})
	];
}

/** A star with `n` points, from radius `r` at the points to `inner` between them. */
export function star(
	cx: number,
	cy: number,
	r: number,
	inner: number,
	n = 5,
	turn = -Math.PI / 2
): Shape {
	return [
		'poly',
		Array.from({ length: n * 2 }, (_, k): [number, number] => {
			const t = turn + (k / (n * 2)) * Math.PI * 2;
			const rr = k % 2 ? inner : r;
			return [cx + Math.cos(t) * rr, cy + Math.sin(t) * rr];
		})
	];
}

/** A rect with corners rounded by `round`. */
export function roundRect(x: number, y: number, w: number, h: number, round: number): Shape {
	const q = Math.min(round, w / 2, h / 2);
	return or(
		['rect', x + q, y, w - 2 * q, h],
		['rect', x, y + q, w, h - 2 * q],
		['circle', x + q, y + q, q],
		['circle', x + w - q, y + q, q],
		['circle', x + q, y + h - q, q],
		['circle', x + w - q, y + h - q, q]
	);
}

/** Bars `width` wide along a path through `points`, like a stalk or a rope. */
export function path(points: [number, number][], width: number): Shape {
	const parts: Shape[] = [];
	for (let k = 1; k < points.length; k++) {
		const [x0, y0] = points[k - 1];
		const [x1, y1] = points[k];
		parts.push(segment(x0, y0, x1, y1, width), ['circle', x1, y1, width / 2]);
	}
	return or(['circle', points[0][0], points[0][1], width / 2], ...parts);
}
