// Mosaic's level set as a whole: 200 levels that fit a phone, with one picture each that
// no single color swamps, and difficulty that rises through play.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { reportLevel } from '../src/lib/mosaic/report.ts';
import { loadLevels, loadPacks } from './levels.ts';

const LEVELS = loadLevels();

test('mosaic has 200 levels in packs of a playable size', () => {
	assert.equal(LEVELS.length, 200);
	for (const pack of loadPacks()) {
		assert.ok(pack.levels.length >= 12 && pack.levels.length <= 24, pack.id);
		assert.ok(pack.name.trim(), pack.id);
	}
});

test('every picture fits a phone and has no color covering half of it', () => {
	for (const lv of LEVELS) {
		const h = lv.art.length;
		const w = lv.art[0].length;
		assert.ok(w <= 36 && h <= 36, `${lv.id} is ${w}x${h}`);
		const counts: Record<string, number> = {};
		for (const row of lv.art) for (const ch of row) counts[ch] = (counts[ch] ?? 0) + 1;
		const top = Math.max(...Object.values(counts));
		assert.ok(2 * top <= w * h, `${lv.id}: one color is ${Math.round((100 * top) / (w * h))}%`);
	}
});

test('later levels are harder: the solver score rises through play', () => {
	const scores = LEVELS.map((lv, i) => reportLevel(lv, i).score);
	const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
	const thirds = [0, 1, 2].map((k) => mean(scores.slice(k * 66, k * 66 + 66)));
	assert.ok(thirds[0] < thirds[1] && thirds[1] < thirds[2], `thirds ${thirds.map(Math.round)}`);
});
