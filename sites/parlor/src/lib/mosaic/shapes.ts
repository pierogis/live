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
