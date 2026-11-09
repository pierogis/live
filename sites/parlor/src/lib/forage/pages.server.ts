/* Forage's pages on the server: see gamePages in shared/pages.server.ts. */
import { GAME } from '../games';
import { gamePages } from '../shared/pages.server';
import { buildPuzzle } from './engine';
import { LEVELS } from './levels/index';
import { forageSave } from './save';

export const pages = gamePages({
	game: GAME.forage,
	levels: LEVELS,
	save: forageSave,
	build: buildPuzzle
});
