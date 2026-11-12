/* How hard levels and murals are, in any game that measures it. Pure, for node too. */

/** Names for a level's 1 (easy) to 5 (very hard) difficulty, in any game that rates one. */
export const LABELS = ['Easy', 'Fair', 'Medium', 'Hard', 'Very hard'];

/**
 * How much a mural's hardest panels outweigh its easy ones in `muralMeasure`: 1 would be
 * a plain mean, and the higher, the closer to just its hardest panel.
 */
const PEAK = 1.5;

/**
 * How hard a mural is, for putting a game's murals in order, from its panels' measures
 * (each game's own, higher is harder): a power mean (`PEAK`). One very hard panel among
 * easy ones counts for more than in a plain mean, so 11 easy panels and the game's
 * hardest rank above 12 fairly easy ones, but below 12 medium.
 */
export function muralMeasure(panels: number[]): number {
	return (panels.reduce((a, x) => a + x ** PEAK, 0) / panels.length) ** (1 / PEAK);
}
