import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MURALS } from '../scripts/murals/index.ts';
import { pack } from '../scripts/murals/mural.ts';
import { loadPacks } from './levels.ts';

const PACKS = loadPacks();

test('every mosaic pack is a mural drawn by a script, in play order', () => {
	assert.deepEqual(
		PACKS.map((p) => p.id),
		MURALS.map((m) => m.file)
	);
	assert.deepEqual(
		MURALS.map((m) => m.file),
		MURALS.map((m) => m.file).sort()
	);
});

for (const m of MURALS) {
	test(`${m.file}: the pack file is what its script draws`, () => {
		const file = PACKS.find((p) => p.id === m.file);
		assert.ok(file, 'no pack file; run `pnpm -F parlor murals`');
		const made = pack(m);
		assert.equal(file.name, made.name);
		assert.deepEqual(file.mural, made.mural);
		assert.deepEqual(file.song, made.song);
		assert.equal(file.levels.length, made.levels.length);
		made.levels.forEach((lv, k) => {
			const was = file.levels[k];
			// A pack's song settings reach its levels when loaded; the script gives a panel's own.
			assert.deepEqual({ ...was, song: undefined }, { ...lv, song: undefined }, lv.id);
			assert.deepEqual(was.song, { ...made.song, ...lv.song }, lv.id);
		});
	});
}
