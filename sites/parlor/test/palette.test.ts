import assert from 'node:assert/strict';
import { test } from 'node:test';

import { closePairs } from '../src/lib/shared/palette.ts';
import { loadPacks } from './levels.ts';

for (const pack of loadPacks()) {
	for (const lv of pack.levels) {
		test(`${pack.id}/${lv.id}: colors are easy to tell apart`, () => {
			const used = new Set(lv.art.join('').replace(/\./g, ''));
			for (const k of used) assert.ok(k in lv.palette, `"${k}" has a color`);
			const close = closePairs(lv.palette, used);
			assert.deepEqual(
				close.map(
					(p) => `${p.a} ${lv.palette[p.a]} vs ${p.b} ${lv.palette[p.b]}: ${p.delta.toFixed(1)}`
				),
				[]
			);
		});
	}
}

test('level ids are unique', () => {
	const ids = loadPacks().flatMap((p) => p.levels.map((l) => l.id));
	assert.equal(new Set(ids).size, ids.length);
});
