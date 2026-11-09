// Node-side level loading for tests and scripts (the site uses import.meta.glob instead).
import { readdirSync, readFileSync } from 'node:fs';

import type { GameId } from '../src/lib/games.ts';
import type { Level } from '../src/lib/mosaic/engine.ts';
import type { Pack, Picture } from '../src/lib/shared/level.ts';
import { levelsFrom, type PackFiles } from '../src/lib/shared/levels.ts';

export interface PackFile<L extends Picture = Level> extends Pack<L> {
	path: URL;
}

/** The game's pack files, read the way its levels/index.ts globs them. */
function read<L extends Picture>(game: GameId) {
	const dir = new URL(`../src/lib/${game}/levels/`, import.meta.url);
	const files: PackFiles<L> = {};
	for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
		files[f] = { default: JSON.parse(readFileSync(new URL(f, dir), 'utf8')) };
	}
	return { dir, ...levelsFrom(files) };
}

export function loadPacks<L extends Picture = Level>(game: GameId = 'mosaic'): PackFile<L>[] {
	const { dir, PACKS } = read<L>(game);
	return PACKS.map((p) => ({ ...p, path: new URL(`${p.id}.json`, dir) }));
}

export function loadLevels<L extends Picture = Level>(game: GameId = 'mosaic'): L[] {
	return read<L>(game).LEVELS;
}
