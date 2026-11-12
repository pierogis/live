import { GAME } from '../games';
import { gamePages } from '../shared/pages.server';
import { buildPuzzle } from './engine';
import { LEVELS, PACKS } from './levels/index';
import { mosaicSave } from './save';

export const pages = gamePages({
	game: GAME.mosaic,
	levels: LEVELS,
	packs: PACKS,
	save: mosaicSave,
	build: buildPuzzle
});
