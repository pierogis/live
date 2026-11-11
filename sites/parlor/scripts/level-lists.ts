/*
 * `virtual:level-list/<game>`: a game's levels in play order without their pictures,
 * which is all a level page needs to name, save and rate each one. Pages import it
 * instead of every picture, so they download a few kB rather than every level.
 * The order matches levels/index.ts (and levelsFrom): pack files by name, then each
 * pack's levels in turn.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

import { GAME_IDS, type GameId } from '../src/lib/games.ts';
import { packLevels, type PackFile } from '../src/lib/shared/levels.ts';

const PREFIX = 'virtual:level-list/';
const LIB = fileURLToPath(new URL('../src/lib/', import.meta.url));
/** A level's picture: the fields its list leaves out (see `Listed` in shared/level.ts). */
const PICTURE = new Set(['palette', 'art']);

export function levelLists(): Plugin {
	return {
		name: 'parlor-level-lists',
		resolveId(id) {
			if (!id.startsWith(PREFIX)) return;
			const game = id.slice(PREFIX.length);
			if ((GAME_IDS as readonly string[]).includes(game)) return `\0${id}`;
		},
		load(id) {
			if (!id.startsWith(`\0${PREFIX}`)) return;
			const game = id.slice(PREFIX.length + 1) as GameId;
			const dir = `${LIB}${game}/levels/`;
			const list = readdirSync(dir)
				.filter((f) => f.endsWith('.json'))
				.sort()
				.flatMap((f) => {
					// Rebuilt when a pack changes, like a save from the picture editor.
					this.addWatchFile(dir + f);
					const pack = JSON.parse(readFileSync(dir + f, 'utf8')) as PackFile;
					const of = pack.levels.length;
					return packLevels(pack).map((lv, k) => ({
						...Object.fromEntries(Object.entries(lv).filter(([k]) => !PICTURE.has(k))),
						// A mural's panel knows its place, so the level page can say so.
						...(pack.mural && { panel: { mural: pack.name, n: k + 1, of } })
					}));
				});
			return `export default ${JSON.stringify(list)};`;
		}
	};
}
