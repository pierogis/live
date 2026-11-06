import { findGame, GAMES } from '#lib/games.js';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => GAMES.map((game) => ({ game: game.id }));

export const load: PageLoad = async ({ params }) => {
	const game = findGame(params.game);
	return {
		title: `${game.name} editor · parlor`,
		description: `paint pictures for ${game.name}, check them, and play-test them`,
		editor: await game.editor()
	};
};
