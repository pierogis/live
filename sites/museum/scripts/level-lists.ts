import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

import { GAME_IDS, type GameId } from '../src/lib/games.ts';
import { packLevels, type PackFile } from '../src/lib/shared/levels.ts';

const PREFIX = 'virtual:level-list/';
const LIB = fileURLToPath(new URL('../src/lib/', import.meta.url));
const PICTURE = new Set(['palette', 'art']);

export function levelLists(): Plugin {
	return {
		name: 'museum-level-lists',
		configureServer(server) {
			const repack = (file: string) => {
				const game = /\/src\/lib\/([a-z]+)\/levels\/[^/]+\.json$/.exec(file)?.[1];
				if (!game) return;
				for (const env of Object.values(server.environments)) {
					const mod = env.moduleGraph.getModuleById(`\0${PREFIX}${game}`);
					if (mod) env.moduleGraph.invalidateModule(mod);
				}
				server.ws.send({ type: 'full-reload' });
			};
			server.watcher.on('add', repack);
			server.watcher.on('unlink', repack);
		},
		resolveId(id) {
			if (!id.startsWith(PREFIX)) return;
			const game = id.slice(PREFIX.length);
			if ((GAME_IDS as readonly string[]).includes(game)) return `\0${id}`;
		},
		load(id) {
			if (!id.startsWith(`\0${PREFIX}`)) return;
			const game = id.slice(PREFIX.length + 1) as GameId;
			const dir = `${LIB}${game}/levels/`;
			const list = packFiles(dir).flatMap((f) => {
				// Rebuilt when a pack changes, like a redraw by `pnpm -F museum murals`.
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

/** A game's pack files, in play order. */
function packFiles(dir: string) {
	return readdirSync(dir)
		.filter((f) => f.endsWith('.json'))
		.sort();
}
