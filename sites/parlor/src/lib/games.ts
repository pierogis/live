/*
 * Every game on the site, in the order the home page lists them. Each game has its
 * own routes, src/routes/<id>/, serving /<id>, /<id>/N, /<id>/pictures and
 * /<id>/edit. They import the game's modules directly, so SvelteKit preloads them
 * with the page. Keep this file free of imports: node scripts and tests read it.
 */

export const GAME_IDS = ['mosaic', 'forage'] as const;
export type GameId = (typeof GAME_IDS)[number];

export interface GameInfo {
	id: GameId;
	/** As shown on the page and in titles. */
	name: string;
	/** One line on what you do; the home page's card and the game page's description. */
	about: string;
}

export const GAME: { [I in GameId]: GameInfo & { id: I } } = {
	mosaic: {
		id: 'mosaic',
		name: 'mosaic',
		about: 'lift dots off a picture, sort them by color, and fill it back in'
	},
	forage: {
		id: 'forage',
		name: 'forage',
		about: 'send ant colonies to eat a picture away, color by color, from the outside in'
	}
};

export const GAMES: GameInfo[] = GAME_IDS.map((id) => GAME[id]);
