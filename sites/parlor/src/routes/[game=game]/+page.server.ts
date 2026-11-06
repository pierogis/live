import { redirect } from '@sveltejs/kit';

import { findGame, type GameDef } from '#lib/games.js';
import type { Picture } from '#lib/shared/level.js';
import type { PageServerLoad } from './$types';

// Rendered per request: it reads your save to send you straight to your level.
export const prerender = false;

/** Each game's level 1, built once: it's the same for everyone, and the page clones it. */
const firsts = new Map<string, unknown>();

async function levelOne(game: GameDef, level: Picture): Promise<unknown> {
	if (!firsts.has(game.id)) firsts.set(game.id, (await game.build())(level, 0));
	return firsts.get(game.id);
}

export const load: PageServerLoad = async ({ params, cookies }) => {
	const game = findGame(params.game);
	const { LEVELS, save } = await game.parts();
	const saved = save.saveFromCookie(cookies.get(save.cookie));
	if (saved.level > 0) redirect(307, `/${game.id}/${saved.level + 1}`);
	return {
		title: `${game.name} · parlor`,
		description: game.about,
		/** Level 1, built here so the page needn't build it again as it starts. */
		initial: await levelOne(game, LEVELS[0])
	};
};
