/*
 * Turn small RGBA pixels (an image already shrunk to the level size) into a level:
 * a palette of a few colors that are easy to tell apart, and rows of color letters.
 * Pure: no DOM, so tests can run it.
 */
import { MIN_DELTA, deltaE, rgbToHex, rgbToLab, type Lab } from './palette.ts';

export interface QuantizeOptions {
	/** Most colors to keep. */
	colors: number;
	/** Merge colors closer than this (delta E). */
	minDelta?: number;
	/** Pixels more transparent than this (0-255) become empty. */
	alphaCutoff?: number;
	/** Passes that recolor lone pixels to their neighbors' color, for bigger groups. */
	despeckle?: number;
	/** Colors covering less than this share of the picture merge into their nearest color. */
	minShare?: number;
}

export interface Quantized {
	palette: Record<string, string>;
	art: string[];
}

/** Letters for palette keys, most used color first. */
export const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

interface Cluster {
	lab: Lab;
	rgb: [number, number, number];
	n: number;
}

export function quantize(
	data: ArrayLike<number>,
	w: number,
	h: number,
	opts: QuantizeOptions
): Quantized {
	const minDelta = opts.minDelta ?? MIN_DELTA;
	const cutoff = opts.alphaCutoff ?? 128;
	const k = Math.max(2, Math.min(KEYS.length, opts.colors));
	const pixels: { i: number; rgb: [number, number, number]; lab: Lab }[] = [];
	for (let i = 0; i < w * h; i++) {
		if (data[i * 4 + 3] < cutoff) continue;
		const rgb: [number, number, number] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
		pixels.push({ i, rgb, lab: rgbToLab(...rgb) });
	}
	const assign = new Int32Array(w * h).fill(-1);
	if (!pixels.length) return { palette: {}, art: Array.from({ length: h }, () => '.'.repeat(w)) };

	// k-means in Lab, seeded with k-means++ picks taken in a fixed order (same image, same result).
	const centers: Lab[] = [pixels[0].lab];
	while (centers.length < k) {
		let best = -1;
		let bestD = 0;
		for (let p = 0; p < pixels.length; p++) {
			const d = Math.min(...centers.map((c) => deltaE(c, pixels[p].lab)));
			if (d > bestD) {
				bestD = d;
				best = p;
			}
		}
		if (best < 0) break; // fewer distinct colors than k
		centers.push(pixels[best].lab);
	}
	let clusters: Cluster[] = [];
	for (let iter = 0; iter < 12; iter++) {
		clusters = centers.map(() => ({ lab: [0, 0, 0], rgb: [0, 0, 0], n: 0 }));
		for (const px of pixels) {
			let c = 0;
			let cd = Infinity;
			centers.forEach((center, j) => {
				const d = deltaE(center, px.lab);
				if (d < cd) {
					cd = d;
					c = j;
				}
			});
			assign[px.i] = c;
			const cl = clusters[c];
			cl.n++;
			for (let t = 0; t < 3; t++) {
				cl.lab[t] += px.lab[t];
				cl.rgb[t] += px.rgb[t];
			}
		}
		clusters.forEach((cl, j) => {
			if (!cl.n) return;
			for (let t = 0; t < 3; t++) {
				cl.lab[t] /= cl.n;
				cl.rgb[t] /= cl.n;
			}
			centers[j] = cl.lab;
		});
	}

	// Merge colors that look alike, smaller into bigger, until every pair is far enough apart.
	const into = clusters.map((_, j) => j);
	const find = (j: number): number => (into[j] === j ? j : (into[j] = find(into[j])));
	for (;;) {
		let pair: [number, number] | null = null;
		let pd = minDelta;
		for (let a = 0; a < clusters.length; a++) {
			if (find(a) !== a || !clusters[a].n) continue;
			for (let b = a + 1; b < clusters.length; b++) {
				if (find(b) !== b || !clusters[b].n) continue;
				const d = deltaE(clusters[a].lab, clusters[b].lab);
				if (d < pd) {
					pd = d;
					pair = [a, b];
				}
			}
		}
		if (!pair) break;
		const [a, b] = clusters[pair[0]].n >= clusters[pair[1]].n ? pair : [pair[1], pair[0]];
		const ca = clusters[a];
		const cb = clusters[b];
		const n = ca.n + cb.n;
		for (let t = 0; t < 3; t++) {
			ca.lab[t] = (ca.lab[t] * ca.n + cb.lab[t] * cb.n) / n;
			ca.rgb[t] = (ca.rgb[t] * ca.n + cb.rgb[t] * cb.n) / n;
		}
		ca.n = n;
		cb.n = 0;
		into[b] = a;
	}
	// Tiny colors (often soft edges between two areas) make tiny groups: fold them into the nearest color.
	const minCount = Math.max(3, Math.round(pixels.length * (opts.minShare ?? 0.03)));
	for (;;) {
		const live = clusters.map((cl, j) => j).filter((j) => find(j) === j && clusters[j].n > 0);
		if (live.length <= 2) break;
		const small = live
			.filter((j) => clusters[j].n < minCount)
			.sort((a, b) => clusters[a].n - clusters[b].n)[0];
		if (small === undefined) break;
		let to = -1;
		let td = Infinity;
		for (const j of live) {
			if (j === small) continue;
			const dd = deltaE(clusters[small].lab, clusters[j].lab);
			if (dd < td) {
				td = dd;
				to = j;
			}
		}
		clusters[to].n += clusters[small].n;
		clusters[small].n = 0;
		into[small] = to;
	}
	for (let i = 0; i < assign.length; i++) if (assign[i] >= 0) assign[i] = find(assign[i]);

	// Lone pixels make tiny groups; give them the color most of their neighbors have.
	for (let pass = 0; pass < (opts.despeckle ?? 1); pass++) {
		const next = assign.slice();
		for (let i = 0; i < assign.length; i++) {
			if (assign[i] < 0) continue;
			const x = i % w;
			const y = Math.floor(i / w);
			const near = new Map<number, number>();
			let same = 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					if (!dx && !dy) continue;
					const nx = x + dx;
					const ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
					const c = assign[ny * w + nx];
					if (c < 0) continue;
					if (c === assign[i]) same++;
					else near.set(c, (near.get(c) || 0) + 1);
				}
			}
			if (same === 0 && near.size) {
				next[i] = [...near.entries()].sort((p, q) => q[1] - p[1] || p[0] - q[0])[0][0];
			}
		}
		assign.set(next);
	}

	// Letters by how much each color is used.
	const used = new Map<number, number>();
	for (const c of assign) if (c >= 0) used.set(c, (used.get(c) || 0) + 1);
	const order = [...used.entries()].sort((p, q) => q[1] - p[1] || p[0] - q[0]).map(([c]) => c);
	const keyOf = new Map(order.map((c, j) => [c, KEYS[j]]));
	const palette: Record<string, string> = {};
	for (const c of order) palette[keyOf.get(c)!] = rgbToHex(...clusters[c].rgb);
	const art: string[] = [];
	for (let y = 0; y < h; y++) {
		let row = '';
		for (let x = 0; x < w; x++) {
			const c = assign[y * w + x];
			row += c < 0 ? '.' : keyOf.get(c);
		}
		art.push(row);
	}
	return { palette, art };
}
