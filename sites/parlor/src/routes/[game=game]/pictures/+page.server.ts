import { findGame } from '#lib/games.js';
import type { PageServerLoad } from './$types';

// Rendered per request, so your ✓ marks come from your save right away.
export const prerender = false;

export const load: PageServerLoad = async ({ params, cookies }) => {
	const game = findGame(params.game);
	const { save } = await game.parts();
	return {
		save: save.saveFromCookie(cookies.get(save.cookie)),
		title: `${game.name} pictures · parlor`,
		description: `every ${game.name} picture`
	};
};
