import type { Attachment } from 'svelte/attachments';

import type { Picture } from './level';

/** Draw a level's picture in its colors, as small as fits `size` in whole pixels. */
function drawArt(canvas: HTMLCanvasElement, lv: Pick<Picture, 'palette' | 'art'>, size: number) {
	const w = lv.art[0].length;
	const h = lv.art.length;
	canvas.width = w;
	canvas.height = h;
	const scale = Math.floor(size / Math.max(w, h)) || 1;
	canvas.style.width = w * scale + 'px';
	canvas.style.height = h * scale + 'px';
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	ctx.clearRect(0, 0, w, h);
	let color: string | undefined;
	lv.art.forEach((row, y) => {
		for (let x = 0; x < w; x++) {
			const ch = row[x];
			if (ch === '.') continue;
			if (lv.palette[ch] !== color) {
				color = lv.palette[ch];
				ctx.fillStyle = color;
			}
			ctx.fillRect(x, y, 1, 1);
		}
	});
}

/** `{@attach art(level, size)}` on a canvas. */
export const art =
	(lv: Pick<Picture, 'palette' | 'art'>, size: number): Attachment<HTMLCanvasElement> =>
	(canvas) => {
		drawArt(canvas, lv, size);
	};
