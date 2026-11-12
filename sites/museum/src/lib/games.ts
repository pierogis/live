// No imports: node scripts and tests read this file.
export const GAME_IDS = ['mosaic', 'forage'] as const;
export type GameId = (typeof GAME_IDS)[number];

export interface GameInfo {
	id: GameId;
	name: string;
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
