/* Mosaic in the shared picture editor: its rules, packs, check worker, and the game to play-test. */
import type { EditorGame } from '../shared/editor/types';
import Mosaic from './Mosaic.svelte';
import type { Level } from './engine';
import { PACKS } from './levels/index';
import { rules } from './rules';

export const mosaicEditor: EditorGame<Level> = {
	...rules,
	packs: PACKS,
	play: Mosaic,
	checker: () => new Worker(new URL('./check.worker.ts', import.meta.url), { type: 'module' })
};
