/*
 * Level packs: every `*.json` file in this folder, in file name order.
 * A pack is { name, levels: [{ id, name, palette, art }] }. See README.md.
 */
import type { Level } from '../engine';

export interface Pack {
	/** File name without `.json`, like `01-first-light`. */
	id: string;
	name: string;
	levels: Level[];
}

const files = import.meta.glob<{ default: Omit<Pack, 'id'> }>('./*.json', { eager: true });

export const PACKS: Pack[] = Object.keys(files)
	.sort()
	.map((path) => ({ id: path.slice(2, -'.json'.length), ...files[path].default }));

/** Every level, in play order. A level's place in this list sets its blob sizes. */
export const LEVELS: Level[] = PACKS.flatMap((p) => p.levels);
