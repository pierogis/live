import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildPuzzle } from '../src/lib/mosaic/engine.ts';
import { reportLevel } from '../src/lib/mosaic/report.ts';
import { loadLevels } from './levels.ts';

const LEVELS = loadLevels();

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

test('report: a shipped level is clean; a broken one lists its problems', () => {
	const ok = reportLevel(LEVELS[0]);
	assert.deepEqual(ok.problems, []);
	assert.ok(ok.moves > 0 && ok.minTray <= buildPuzzle(LEVELS[0], 0).trayCap);

	const bad = reportLevel({
		id: '',
		name: 'x',
		palette: { A: '#e63946', B: '#e33b47' },
		art: ['AB', 'BAX']
	});
	assert.ok(bad.problems.includes('needs an id'));
	assert.ok(bad.problems.includes('rows are not all the same width'));
	assert.ok(bad.problems.includes('"X" has no color'));
	assert.ok(bad.problems.some((p) => p.startsWith('A and B look alike')));
});
