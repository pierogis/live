/* This game's level packs: every `*.json` file in this folder, in file name order. */
import type { Level } from '../engine';
import { packsFrom, type Pack as AnyPack } from '../../shared/levels';

export type Pack = AnyPack<Level>;

export const PACKS: Pack[] = packsFrom<Level>(
	import.meta.glob<{ default: { name: string; levels: Level[] } }>('./*.json', { eager: true })
);

/** Every level, in play order. A level's place in this list feeds its difficulty. */
export const LEVELS: Level[] = PACKS.flatMap((p) => p.levels);
