/* Forage in the shared picture editor: its rules, plus the packs and the game to play-test. */
import type { EditorGame } from '../shared/editor/types';
import type { Level } from './engine';
import Forage from './Forage.svelte';
import { PACKS } from './levels/index';
import { rules } from './rules';

export const forageEditor: EditorGame<Level> = { ...rules, packs: PACKS, play: Forage };
