/*
 * A 1 to 5 difficulty index for a Forage level. It starts from how often a good
 * player wins it (the best of the players in player.ts; see report.ts):
 *   1  wins basically every time
 *   2  loses now and then
 *   3  loses about one game in three
 *   4  wins about half the time
 *   5  loses most attempts: it takes real planning
 * then its cruxes (see cruxes.ts) cap it. Players that follow a rule of thumb can
 * lose a level that a person sees through at once; what makes a level hard for a
 * person is having to break the rule of thumb, more than once, all through the game:
 *   - no rule break: at most 2
 *   - one rule break, one real crux, or all of them in one third of the game: at most 3
 *   - 4 takes 2 rule breaks and 2 real cruxes in different thirds
 *   - 5 takes 2 rule breaks and 3 real cruxes, in at least 2 thirds
 * A level with 3 real cruxes and 2 rule breaks is at least 3.
 */

/** What forage:tune measured about a level's cruxes. */
export interface Cruxes {
	/** Rule breaks: where the send that finishes right away loses. */
	breaks?: number;
	/** Real cruxes: tight stretches where only some sends win. */
	cruxes?: number;
	/** Thirds of the game with a real crux, 0 to 3. */
	spread?: number;
}

/** 1 to 5 from the win share alone. */
function fromWins(wins: number): number {
	if (wins >= 0.93) return 1;
	if (wins >= 0.75) return 2;
	if (wins >= 0.55) return 3;
	if (wins >= 0.35) return 4;
	return 5;
}

/** The most and least a level with these cruxes can be rated. */
export function crux(c: Cruxes): { most: number; least: number } {
	const breaks = c.breaks ?? 0;
	const real = c.cruxes ?? 0;
	const spread = c.spread ?? 0;
	let most = 5;
	if (breaks === 0) most = 2;
	else if (breaks === 1 || real <= 1 || spread <= 1) most = 3;
	else if (real < 3) most = 4;
	const least = real >= 3 && breaks >= 2 ? 3 : 1;
	return { most, least: Math.min(least, most) };
}

/** A level's difficulty from what forage:tune saved in it. */
export function levelDifficulty(lv: { wins?: number } & Cruxes): number | null {
	return difficultyIndex(lv.wins, lv);
}

/** 1 (easy) to 5 (very hard); null when the level hasn't been measured yet. */
export function difficultyIndex(wins: number | undefined, c?: Cruxes): number | null {
	if (wins === undefined) return null;
	const base = fromWins(wins);
	// Not measured for cruxes (an untuned draft): the win share alone.
	if (!c || c.cruxes === undefined) return base;
	const { most, least } = crux(c);
	return Math.max(least, Math.min(most, base));
}
