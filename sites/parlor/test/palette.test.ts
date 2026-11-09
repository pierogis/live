import assert from 'node:assert/strict';
import { test } from 'node:test';

import { GAME_IDS } from '../src/lib/games.ts';
import { checkPicture } from '../src/lib/shared/editor/checks.ts';
import { loadPacks } from './levels.ts';

for (const game of GAME_IDS) {
	const packs = loadPacks(game);
	for (const pack of packs) {
		for (const lv of pack.levels) {
			test(`${game} ${pack.id}/${lv.id}: every color is there and easy to tell apart`, () => {
				assert.deepEqual(checkPicture(lv).problems, []);
			});
		}
	}

	test(`${game}: level ids are unique across all packs`, () => {
		const ids = packs.flatMap((p) => p.levels.map((l) => l.id));
		assert.deepEqual(
			ids.filter((id, i) => ids.indexOf(id) !== i),
			[]
		);
	});
}
