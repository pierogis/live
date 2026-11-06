/*
 * This game's level packs: every `*.json` file in this folder, in file name order.
 * LEVELS is every level, in play order; a level's place there feeds its difficulty.
 */
import type { Level } from '../engine';
import type { Pack as AnyPack } from '../../shared/level';
import { levelsFrom } from '../../shared/levels';

export type Pack = AnyPack<Level>;

export const { PACKS, LEVELS } = levelsFrom(
	import.meta.glob<{ default: { name: string; levels: Level[] } }>('./*.json', { eager: true })
);
