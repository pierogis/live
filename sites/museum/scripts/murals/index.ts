/* Every game's murals, and the order each game plays them in. */
import { readdirSync, readFileSync } from 'node:fs';

import { TUNED, type Level as ForageLevel } from '../../src/lib/forage/engine.ts';
import { muralHardness } from '../../src/lib/forage/report.ts';
import type { GameId } from '../../src/lib/games.ts';
import type { Level as MosaicLevel } from '../../src/lib/mosaic/engine.ts';
import { muralScore } from '../../src/lib/mosaic/report.ts';
import type { Picture } from '../../src/lib/shared/level.ts';
import { packLevels } from '../../src/lib/shared/levels.ts';
import { MURALS as forage } from './forage/index.ts';
import { MURALS as mosaic } from './mosaic/index.ts';
import { pack, type Mural } from './mural.ts';

export const MURALS: Record<GameId, Mural[]> = { mosaic, forage };

/**
 * A Forage mural's panels as played, with what forage:tune last measured for each panel
 * whose id is still in its pack file.
 */
function tuned(m: Mural): ForageLevel[] {
	const dir = new URL('../../src/lib/forage/levels/', import.meta.url);
	const file = readdirSync(dir).find((f) => f.replace(/^[^-]+-/, '') === `${m.file}.json`);
	const saved: Picture[] = file ? JSON.parse(readFileSync(new URL(file, dir), 'utf8')).levels : [];
	const keep = new Set<string>(TUNED);
	return packLevels(pack(m)).map((lv) => {
		const was = saved.find((s) => s.id === lv.id) ?? {};
		return { ...lv, ...Object.fromEntries(Object.entries(was).filter(([k]) => keep.has(k))) };
	});
}

/** How hard each game's murals measure, higher harder: what puts them in order. */
const MEASURE: Record<GameId, (m: Mural) => number> = {
	mosaic: (m) => muralScore(packLevels(pack(m)) as MosaicLevel[]),
	forage: (m) => muralHardness(tuned(m))
};

/**
 * A game's murals in play order, easiest first, as measured (`MEASURE`): each mural's
 * `difficulty` sets how hard it's made, and a new one goes where its panels put it.
 */
export function playOrder(game: GameId): Mural[] {
	const score = new Map(MURALS[game].map((m) => [m, MEASURE[game](m)]));
	return MURALS[game].toSorted(
		(a, b) => score.get(a)! - score.get(b)! || a.file.localeCompare(b.file)
	);
}

/** The pack file a mural is drawn into, without `.json`: its place in play, then its name. */
export const fileOf = (m: Mural, place: number) =>
	`${String(place + 1).padStart(2, '0')}-${m.file}`;
