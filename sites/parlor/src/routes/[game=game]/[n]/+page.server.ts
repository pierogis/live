import { error } from '@sveltejs/kit';

import { findGame, GAMES } from '#lib/games.js';
import type { EntryGenerator, PageServerLoad } from './$types';

/** Every level of every game gets its own prerendered page, with its board already drawn. */
export const prerender = true;

export const entries: EntryGenerator = async () => {
	const all = await Promise.all(
		GAMES.map(async (game) =>
			(await game.parts()).LEVELS.map((_, i) => ({ game: game.id, n: String(i + 1) }))
		)
	);
	return all.flat();
};

export const load: PageServerLoad = async ({ params }) => {
	const game = findGame(params.game);
	const [{ LEVELS }, build] = await Promise.all([game.parts(), game.build()]);
	const index = Number(params.n) - 1;
	const level = LEVELS[index];
	// Only the number as the site writes it, so /mosaic/05 isn't a second /mosaic/5.
	if (!level || params.n !== String(index + 1)) error(404, 'No such level');
	return {
		index,
		title: `${level.name} · ${game.name} · parlor`,
		description: `${game.name} level ${index + 1}: ${level.name}`,
		/** The level's starting state, built at prerender so the page needn't build it as it starts. */
		initial: build(level, index)
	};
};
