import type { Attachment } from 'svelte/attachments';

import type { Level } from './engine';

/**
 * Draw a level as a small pixel picture: in its colors when `done`, otherwise
 * as a silhouette in the canvas's CSS `--silhouette` color.
 */
export function drawArt(canvas: HTMLCanvasElement, lv: Level, done: boolean, size: number) {
	const w = lv.art[0].length;
	const h = lv.art.length;
	const silhouette = getComputedStyle(canvas).getPropertyValue('--silhouette').trim() || '#ccc';
	canvas.width = w;
	canvas.height = h;
	const scale = Math.floor(size / Math.max(w, h)) || 1;
	canvas.style.width = w * scale + 'px';
	canvas.style.height = h * scale + 'px';
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	ctx.clearRect(0, 0, w, h);
	lv.art.forEach((row, y) => {
		for (let x = 0; x < w; x++) {
			const ch = row[x];
			if (ch === '.') continue;
			ctx.fillStyle = done ? lv.palette[ch] : silhouette;
			ctx.fillRect(x, y, 1, 1);
		}
	});
}

/** `{@attach art(level, done, size)}` on a canvas. */
export const art =
	(lv: Level, done: boolean, size: number): Attachment<HTMLCanvasElement> =>
	(canvas) => {
		drawArt(canvas, lv, done, size);
	};
