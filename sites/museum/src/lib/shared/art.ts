import type { Attachment } from 'svelte/attachments';

import type { Picture } from './level';

/** A color mostly greyed (85% of the way to its own lightness), as an unplayed picture shows. */
function grey(hex: string): string {
	const n = parseInt(hex.slice(1, 7), 16);
	const rgb = [n >> 16, (n >> 8) & 255, n & 255];
	const y = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
	return `rgb(${rgb.map((c) => Math.round(c + (y - c) * 0.85)).join(' ')})`;
}

/**
 * Draw a level's picture in its colors, at the biggest whole-pixel scale that fits in `size`.
 * Each dot is `dot` canvas pixels: more than 1 for a picture CSS scales down to fit, so
 * its dots stay even. Dots `faded` says are drawn greyed and faint, as unplayed pictures show.
 */
function drawArt(
	canvas: HTMLCanvasElement,
	lv: Pick<Picture, 'palette' | 'art'>,
	size: number,
	dot = 1,
	faded?: (x: number, y: number) => boolean
) {
	const w = lv.art[0].length;
	const h = lv.art.length;
	canvas.width = w * dot;
	canvas.height = h * dot;
	// Size 0 leaves the canvas's size to CSS (a mural's panels).
	if (size) {
		const scale = Math.floor(size / Math.max(w, h)) || 1;
		canvas.style.width = w * scale + 'px';
		canvas.style.height = h * scale + 'px';
	}
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	let color: string | undefined;
	lv.art.forEach((row, y) => {
		for (let x = 0; x < w; x++) {
			const ch = row[x];
			if (ch === '.') continue;
			const fade = faded?.(x, y) ?? false;
			const c = fade ? grey(lv.palette[ch]) : lv.palette[ch];
			if (c !== color) {
				color = c;
				ctx.fillStyle = c;
			}
			ctx.globalAlpha = fade ? 0.4 : 1;
			ctx.fillRect(x * dot, y * dot, dot, dot);
		}
	});
}

/** `{@attach art(level, size)}` on a canvas; `dot` and `faded` as in `drawArt`. */
export const art =
	(
		lv: Pick<Picture, 'palette' | 'art'>,
		size: number,
		dot = 1,
		faded?: (x: number, y: number) => boolean
	): Attachment<HTMLCanvasElement> =>
	(canvas) => {
		drawArt(canvas, lv, size, dot, faded);
	};
