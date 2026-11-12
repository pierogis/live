/*
 * What `pnpm -F museum levels` needs from a game: one line of stats per shipped level.
 * A game's rules (its `rules.ts`) are pure, with `.ts` imports, so node scripts load them.
 */
import type { GameId } from '../games.ts';
import type { Picture } from './level.ts';

/** One level's line in `pnpm -F museum levels`. */
export interface Row {
	problems: string[];
	warnings: string[];
	/** Short stats, one column each, in order. */
	cols: Record<string, string | number>;
	/** Rough difficulty, for `--order`; leave out when the game has none. */
	score?: number;
}

/** A game's checks, with no UI. */
export interface Rules<L extends Picture = Picture> {
	/** The game's name; also the folder its packs live in: src/lib/<id>/levels. */
	id: GameId;
	/** A shipped level's line; `measure` asks for the slow measurements too. */
	row: (level: L, measure: boolean) => Row;
}
