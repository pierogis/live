// Node-side level loading for tests and scripts (the site uses import.meta.glob instead).
import { readdirSync, readFileSync } from 'node:fs';

import type { Level } from '../src/lib/mosaic/engine.ts';

export const LEVELS_DIR = new URL('../src/lib/mosaic/levels/', import.meta.url);

export interface PackFile {
	id: string;
	path: URL;
	name: string;
	levels: Level[];
}

export function loadPacks(): PackFile[] {
	return readdirSync(LEVELS_DIR)
		.filter((f) => f.endsWith('.json'))
		.sort()
		.map((f) => {
			const path = new URL(f, LEVELS_DIR);
			const pack = JSON.parse(readFileSync(path, 'utf8'));
			return { id: f.slice(0, -'.json'.length), path, ...pack };
		});
}

export function loadLevels(): Level[] {
	return loadPacks().flatMap((p) => p.levels);
}
