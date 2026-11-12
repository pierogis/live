/*
 * A 1 to 5 difficulty index for a Forage level, from how many attempts people who
 * retry take to win it (learner.ts): the typical learner's, saved by forage:tune in
 * `tries` (best, typical, worst):
 *   1  won first try
 *   2  about two tries
 *   3  three or four
 *   4  five or six
 *   5  seven or more: it takes learning the level
 * The learners lose where a rule of thumb breaks and learn where a person would, so
 * this replaces the old rating from one-shot wins capped by the level's cruxes. The
 * cruxes (cruxes.ts) still shape forage:tune's deal search.
 */

/** What forage:tune measured about a level's cruxes (see cruxes.ts). */
export interface Cruxes {
	/** Rule breaks: where the send that finishes right away loses. */
	breaks?: number;
	/** Real cruxes: tight stretches where only some sends win. */
	cruxes?: number;
	/** Thirds of the game with a real crux, 0 to 3. */
	spread?: number;
}

/** What forage:tune saved about a level's attempts (see `Tries` in learner.ts). */
export interface Tried {
	/** Best, typical and worst learners' attempts to win. */
	tries?: number[];
}

/** 1 (easy) to 5 (very hard) from the typical learner's attempts. */
export function fromTries(typical: number): number {
	if (typical < 1.5) return 1;
	if (typical < 2.5) return 2;
	if (typical < 4.5) return 3;
	if (typical < 6.5) return 4;
	return 5;
}

/** A level's difficulty from what forage:tune saved in it; null when it hasn't been measured. */
export function levelDifficulty(lv: Tried): number | null {
	return lv.tries ? fromTries(lv.tries[1]) : null;
}

/**
 * How hard a level plays, for putting murals in order: log2 of the typical learner's
 * attempts (0 when won first try, 1 at two, 3 at eight), so one level few learn doesn't
 * swamp its mural. Null when it hasn't been measured.
 */
export function levelHardness(lv: Tried): number | null {
	return lv.tries ? Math.log2(lv.tries[1]) : null;
}
