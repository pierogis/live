/* A 1 to 5 difficulty index for a Forage level, from how often careless play wins it. */

export const LABELS = ['Easy', 'Fair', 'Medium', 'Hard', 'Very hard'];

/** 1 (easy) to 5 (very hard); null when the level hasn't been measured yet. */
export function difficultyIndex(wins: number | undefined): number | null {
	if (wins === undefined) return null;
	if (wins >= 0.85) return 1;
	if (wins >= 0.65) return 2;
	if (wins >= 0.45) return 3;
	if (wins >= 0.25) return 4;
	return 5;
}
