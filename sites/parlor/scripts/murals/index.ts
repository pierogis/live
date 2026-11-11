/* Every game's murals, each game's in play order: easiest first. */
import type { GameId } from '../../src/lib/games.ts';
import { MURALS as forage } from './forage/index.ts';
import { MURALS as mosaic } from './mosaic/index.ts';
import type { Mural } from './mural.ts';

export const MURALS: Record<GameId, Mural[]> = { mosaic, forage };
