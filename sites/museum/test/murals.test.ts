import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { TUNED } from '../src/lib/forage/engine.ts';
import { GAME_IDS } from '../src/lib/games.ts';
import type { Picture } from '../src/lib/shared/level.ts';
import { MURALS } from '../scripts/murals/index.ts';
import { pack } from '../scripts/murals/mural.ts';
import { loadPacks } from './levels.ts';

/** What a game saves into a panel beyond what its script draws. */
const SAVED: Record<string, readonly string[]> = { forage: TUNED };

for (const game of GAME_IDS) {
	const murals = MURALS[game];

	test(`every ${game} pack is a mural drawn by a script, in play order`, () => {
		assert.deepEqual(
			loadPacks(game).map((p) => p.id),
			murals.map((m) => m.file)
		);
		assert.deepEqual(
			murals.map((m) => m.file),
			murals.map((m) => m.file).sort()
		);
	});

	for (const m of murals) {
		test(`${game} ${m.file}: the pack file is what its script draws`, () => {
			const file = new URL(`../src/lib/${game}/levels/${m.file}.json`, import.meta.url);
			assert.ok(existsSync(file), 'no pack file; run `pnpm -F museum murals`');
			const saved = new Set(SAVED[game] ?? []);
			const data = JSON.parse(readFileSync(file, 'utf8'));
			data.levels = data.levels.map((lv: Picture) =>
				Object.fromEntries(Object.entries(lv).filter(([k]) => !saved.has(k)))
			);
			assert.deepEqual(data, pack(m));
		});
	}
}
