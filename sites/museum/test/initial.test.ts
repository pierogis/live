// A level's starting state can be built ahead of time (at prerender) and handed to
// the game as its `initial` prop, so it has to come through JSON unchanged.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as F from '../src/lib/forage/engine.ts';
import * as M from '../src/lib/mosaic/engine.ts';
import { loadLevels } from './levels.ts';

const roundTrip = <T>(s: T): T => JSON.parse(JSON.stringify(s));

test('every mosaic start state is plain data', () => {
	loadLevels('mosaic').forEach((lv, i) => {
		const s = M.buildPuzzle(lv, i);
		assert.deepStrictEqual(roundTrip(s), s, lv.id);
		// Relaxing a prebuilt state is the same as building it relaxed.
		assert.deepStrictEqual(M.relax(roundTrip(s)), M.buildPuzzle(lv, i, { relaxed: true }), lv.id);
	});
});

test('every forage start state is plain data', () => {
	loadLevels<F.Level>('forage').forEach((lv, i) => {
		const s = F.buildPuzzle(lv, i);
		assert.deepStrictEqual(roundTrip(s), s, lv.id);
	});
});
