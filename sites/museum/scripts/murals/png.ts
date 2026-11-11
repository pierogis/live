/* A tiny PNG writer (RGB, no dependencies), for looking at a mural while drawing it. */
import { deflateSync } from 'node:zlib';

import { hexToRgb } from '../../src/lib/shared/palette.ts';

function png(w: number, h: number, rgb: Buffer): Buffer {
	const raw = Buffer.alloc((w * 3 + 1) * h);
	for (let y = 0; y < h; y++) rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
	const table = new Int32Array(256).map((_, n) => {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		return c;
	});
	const crc = (buf: Buffer) => {
		let c = -1;
		for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
		return (c ^ -1) >>> 0;
	};
	const chunk = (type: string, data: Buffer) => {
		const len = Buffer.alloc(4);
		len.writeUInt32BE(data.length);
		const td = Buffer.concat([Buffer.from(type), data]);
		const c = Buffer.alloc(4);
		c.writeUInt32BE(crc(td));
		return Buffer.concat([len, td, c]);
	};
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(w, 0);
	ihdr.writeUInt32BE(h, 4);
	ihdr[8] = 8;
	ihdr[9] = 2;
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', ihdr),
		chunk('IDAT', deflateSync(raw)),
		chunk('IEND', Buffer.alloc(0))
	]);
}

/** A picture as an image, `px` pixels a dot, with a `gap` between panels when given a panel size. */
export function image(
	rows: string[],
	palette: Record<string, string>,
	px: number,
	panel?: [number, number],
	gap = 0
): Buffer {
	const [pw, ph] = panel ?? [rows[0].length, rows.length];
	const at = (i: number, size: number) => gap + i * px + Math.floor(i / size) * gap;
	const W = at(rows[0].length - 1, pw) + px + gap;
	const H = at(rows.length - 1, ph) + px + gap;
	const img = Buffer.alloc(W * H * 3, 0xf0);
	rows.forEach((row, y) =>
		[...row].forEach((ch, x) => {
			const c = hexToRgb(palette[ch]);
			for (let dy = 0; dy < px; dy++)
				for (let dx = 0; dx < px; dx++) {
					const o = ((at(y, ph) + dy) * W + at(x, pw) + dx) * 3;
					img[o] = c[0];
					img[o + 1] = c[1];
					img[o + 2] = c[2];
				}
		})
	);
	return png(W, H, img);
}
