import { findGame } from '#lib/games.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, data }) => {
	const game = findGame(params.game);
	return { ...data, game: { id: game.id, name: game.name }, parts: await game.parts() };
};
