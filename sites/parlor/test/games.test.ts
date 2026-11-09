// The site's list of games (src/lib/games.ts) has every game folder, and only those, and each has its routes.
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

import { GAME_IDS, GAMES } from '../src/lib/games.ts';

test('every game folder with levels is in the games list', () => {
	const lib = new URL('../src/lib/', import.meta.url);
	const folders = readdirSync(lib, { withFileTypes: true })
		.filter((d) => d.isDirectory() && existsSync(new URL(`${d.name}/levels/`, lib)))
		.map((d) => d.name);
	assert.deepEqual([...GAME_IDS].sort(), folders.sort());
	assert.deepEqual(
		GAMES.map((g) => g.id),
		[...GAME_IDS]
	);
});

test('every game has its own routes', () => {
	const routes = new URL('../src/routes/', import.meta.url);
	for (const id of GAME_IDS) {
		for (const page of ['', '[n]/', 'pictures/', 'edit/']) {
			assert.ok(existsSync(new URL(`${id}/${page}+page.svelte`, routes)), `${id}/${page}`);
		}
	}
});
