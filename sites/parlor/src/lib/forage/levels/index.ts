/*
 * This game's level packs: every `*.json` file in this folder, in file name order.
 * LEVELS is every level, in play order; a level's place there feeds its difficulty.
 */
import type { Level } from '../engine';
import { levelsFrom } from '../../shared/levels';

export const { PACKS, LEVELS } = levelsFrom(
	import.meta.glob<{ default: { name: string; levels: Level[] } }>('./*.json', { eager: true })
);
