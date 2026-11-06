/* What a level page needs in the browser, shared by /<game> and /<game>/N: the game's component and levels. */
import { findGame } from '#lib/games.js';

export async function loadPlay(id: string) {
	const game = findGame(id);
	const [{ LEVELS }, Game] = await Promise.all([game.parts(), game.component()]);
	return { game: game.id, levels: LEVELS, Game };
}
