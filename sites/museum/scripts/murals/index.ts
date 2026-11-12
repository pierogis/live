/* Every game's murals, and the order each game plays them in. */
import type { GameId } from '../../src/lib/games.ts';
import type { Level } from '../../src/lib/mosaic/engine.ts';
import { muralScore } from '../../src/lib/mosaic/report.ts';
import { packLevels } from '../../src/lib/shared/levels.ts';
import { MURALS as forage } from './forage/index.ts';
import { MURALS as mosaic } from './mosaic/index.ts';
import { pack, type Mural } from './mural.ts';

export const MURALS: Record<GameId, Mural[]> = { mosaic, forage };

/**
 * A game's murals in play order, easiest first. Mosaic's are measured (`muralScore`), so a
 * new mural goes where its panels put it; Forage's play as listed, since a level's place in
 * play sets how hard it is.
 */
export function playOrder(game: GameId): Mural[] {
	if (game === 'forage') return MURALS.forage;
	const score = new Map(MURALS.mosaic.map((m) => [m, muralScore(packLevels(pack(m)) as Level[])]));
	return MURALS.mosaic.toSorted(
		(a, b) => score.get(a)! - score.get(b)! || a.file.localeCompare(b.file)
	);
}

/** The pack file a mural is drawn into, without `.json`: its place in play, then its name. */
export const fileOf = (m: Mural, place: number) =>
	`${String(place + 1).padStart(2, '0')}-${m.file}`;
