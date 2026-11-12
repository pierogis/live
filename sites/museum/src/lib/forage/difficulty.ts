export interface Cruxes {
	breaks?: number;
	cruxes?: number;
	spread?: number;
}

export interface Tried {
	// Attempts to win for the best, typical and worst learners (learner.ts).
	tries?: number[];
}

export function fromTries(typical: number): number {
	if (typical < 1.5) return 1;
	if (typical < 2.5) return 2;
	if (typical < 4.5) return 3;
	if (typical < 6.5) return 4;
	return 5;
}

export function levelDifficulty(lv: Tried): number | null {
	return lv.tries ? fromTries(lv.tries[1]) : null;
}

export function levelHardness(lv: Tried): number | null {
	return lv.tries ? Math.log2(lv.tries[1]) : null;
}
