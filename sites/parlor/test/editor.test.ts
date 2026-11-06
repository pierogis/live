import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as G from '../src/lib/shared/editor/grid.ts';
import { closePairs } from '../src/lib/shared/palette.ts';
import { quantize } from '../src/lib/shared/editor/quantize.ts';
import { makeRng } from '../src/lib/shared/engine.ts';
import { reportLevel } from '../src/lib/mosaic/report.ts';
import { loadLevels } from './levels.ts';

test('grid: art round trip, fill, resize, shift, mirror', () => {
	const g = G.fromArt(['AAB', 'ABB', '.BB']);
	assert.deepEqual(G.toArt(g), ['AAB', 'ABB', '.BB']);
	assert.deepEqual(G.toArt(G.fill(g, 0, 'C')), ['CCB', 'CBB', '.BB'], 'fill spreads, no diagonals');
	assert.deepEqual(G.toArt(G.fill(g, 2, 'C')), ['AAC', 'ACC', '.CC']);
	assert.deepEqual(G.toArt(G.resize(g, 5, 3)), ['.AAB.', '.ABB.', '..BB.'], 'grows centered');
	assert.deepEqual(G.toArt(G.resize(g, 1, 1)), ['B'], 'shrinks centered');
	assert.deepEqual(G.toArt(G.shift(g, 1, 0)), ['BAA', 'BAB', 'B.B'], 'wraps around');
	assert.deepEqual(G.toArt(G.flip(g)), ['BAA', 'BBA', 'BB.']);
	assert.equal(G.nextKey({ A: '#000', B: '#fff' }), 'C');
	assert.equal(G.slug('Hot Air Balloon!'), 'hot-air-balloon');
});

/** RGBA pixels from rows of letters and a color map. */
function pixels(rows: string[], colors: Record<string, [number, number, number, number]>) {
	const data: number[] = [];
	for (const row of rows) for (const ch of row) data.push(...colors[ch]);
	return data;
}

test('quantize: keeps distinct colors, merges look-alikes, empties transparent pixels', () => {
	const rows = ['RRRRBBBB', 'RRRRBBBB', 'rrrrBBBB', 'rrrr....'];
	const data = pixels(rows, {
		R: [230, 57, 70, 255],
		r: [226, 60, 72, 255], // almost the same red
		B: [59, 125, 216, 255],
		'.': [0, 0, 0, 0]
	});
	const q = quantize(data, 8, 4, { colors: 6, despeckle: 0 });
	assert.equal(Object.keys(q.palette).length, 2, 'the two reds merge');
	assert.deepEqual(q.art, ['AAAABBBB', 'AAAABBBB', 'AAAABBBB', 'AAAA....']);
	assert.deepEqual(closePairs(q.palette), []);
});

test('quantize: the colors it writes are far enough apart, even on a noisy gradient', () => {
	// Merging by average Lab once let this one through: the written hex colors (average
	// RGB) of two kept colors came out just under MIN_DELTA.
	const w = 24;
	const h = 20;
	const rng = makeRng(54);
	const data: number[] = [];
	const noise = () => (rng() - 0.5) * 60;
	const byte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const t = x / (w - 1);
			const u = y / (h - 1);
			data.push(byte(40 + 180 * t + noise()), byte(200 - 120 * u + noise()));
			data.push(byte(60 + 100 * t * u + noise()), 255);
		}
	}
	const q = quantize(data, w, h, { colors: 8 });
	assert.ok(Object.keys(q.palette).length >= 4);
	assert.deepEqual(closePairs(q.palette), []);
});

test("quantize: lone pixels take their neighbors' color", () => {
	const rows = ['WWWWW', 'WWKWW', 'WWWWW', 'KKKKK'];
	const data = pixels(rows, { W: [255, 255, 255, 255], K: [20, 20, 30, 255] });
	assert.equal(quantize(data, 5, 4, { colors: 2, despeckle: 0 }).art[1], 'AABAA');
	assert.equal(quantize(data, 5, 4, { colors: 2, despeckle: 1 }).art[1], 'AAAAA');
});

test('report: a shipped level is clean; a broken one lists its problems', () => {
	const [first] = loadLevels();
	const ok = reportLevel(first, 0);
	assert.deepEqual(ok.problems, []);
	assert.ok(ok.moves > 0 && ok.minTray <= 20);

	const bad = reportLevel(
		{ id: '', name: 'x', palette: { A: '#e63946', B: '#e33b47' }, art: ['AB', 'BAX'] },
		0
	);
	assert.ok(bad.problems.includes('needs an id'));
	assert.ok(bad.problems.includes('rows are not all the same width'));
	assert.ok(bad.problems.includes('"X" has no color'));
	assert.ok(bad.problems.some((p) => p.startsWith('A and B look alike')));
});
