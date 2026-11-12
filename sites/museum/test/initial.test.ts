import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as F from '../src/lib/forage/engine.ts';
import * as M from '../src/lib/mosaic/engine.ts';
import { loadLevels } from './levels.ts';

const roundTrip = <T>(s: T): T => JSON.parse(JSON.stringify(s));

test('every mosaic start state is plain data', () => {
	loadLevels('mosaic').forEach((lv) => {
		const s = M.buildPuzzle(lv);
		assert.deepStrictEqual(roundTrip(s), s, lv.id);
		assert.deepStrictEqual(M.relax(roundTrip(s)), M.buildPuzzle(lv, { relaxed: true }), lv.id);
	});
});

test('every forage start state is plain data', () => {
	loadLevels<F.Level>('forage').forEach((lv) => {
		const s = F.buildPuzzle(lv);
		assert.deepStrictEqual(roundTrip(s), s, lv.id);
	});
});
