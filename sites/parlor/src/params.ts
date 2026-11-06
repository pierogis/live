/* Route param matchers: `[game=game]` is one of the site's games, by id (see src/lib/games.ts). */
import { defineParams } from '@sveltejs/kit/params';

// Plain node loads this file at build time, so its imports must be node-safe (games.ts is).
import { isGameId } from './lib/games.ts';

export const params = defineParams({
	game: (param) => (isGameId(param) ? param : undefined)
});
