import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { MURALS } from '../scripts/murals/index.ts';
import { pack } from '../scripts/murals/mural.ts';
import { loadPacks } from './levels.ts';

test('every mosaic pack is a mural drawn by a script, in play order', () => {
	assert.deepEqual(
		loadPacks().map((p) => p.id),
		MURALS.map((m) => m.file)
	);
	assert.deepEqual(
		MURALS.map((m) => m.file),
		MURALS.map((m) => m.file).sort()
	);
});

for (const m of MURALS) {
	test(`${m.file}: the pack file is what its script draws`, () => {
		const file = new URL(`../src/lib/mosaic/levels/${m.file}.json`, import.meta.url);
		assert.ok(existsSync(file), 'no pack file; run `pnpm -F parlor murals`');
		assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), pack(m));
	});
}
