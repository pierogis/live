// Node-side level loading for tests and scripts (the site uses import.meta.glob instead).
import { readdirSync, readFileSync } from 'node:fs';

import type { Level } from '../src/lib/mosaic/engine.ts';

export type Game = 'mosaic' | 'forage';

export const levelsDir = (game: Game) => new URL(`../src/lib/${game}/levels/`, import.meta.url);

export interface PackFile<L = Level> {
	id: string;
	path: URL;
	name: string;
	levels: L[];
}

export function loadPacks<L = Level>(game: Game = 'mosaic'): PackFile<L>[] {
	const dir = levelsDir(game);
	return readdirSync(dir)
		.filter((f) => f.endsWith('.json'))
		.sort()
		.map((f) => {
			const path = new URL(f, dir);
			const pack = JSON.parse(readFileSync(path, 'utf8'));
			return { id: f.slice(0, -'.json'.length), path, ...pack };
		});
}

export function loadLevels<L = Level>(game: Game = 'mosaic'): L[] {
	return loadPacks<L>(game).flatMap((p) => p.levels);
}
