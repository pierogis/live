/*
 * Every game on the site, in the order the home page lists them. The routes under
 * src/routes/[game=game]/ serve each one at /<id>, /<id>/N, /<id>/pictures and
 * /<id>/edit, and the `game` matcher in src/params.ts matches only these ids.
 *
 * A game's levels, component and editor load on demand, so a page pulls in only
 * its own game, and the home page none. Keep every static import here type-only:
 * node scripts and tests import this file for GAME_IDS, and node can't load the
 * games' Vite-only modules (their levels come from import.meta.glob).
 */
import type { Component } from 'svelte';

import type { Level as ForageLevel, State as ForageState } from './forage/engine.ts';
import type { Level as MosaicLevel, State as MosaicState } from './mosaic/engine.ts';
import type { EditorGame } from './shared/editor/types.ts';
import type { LevelProps } from './shared/game/level.svelte.ts';
import type { Pack, Picture } from './shared/level.ts';
import type { GameSave } from './shared/save.ts';

export const GAME_IDS = ['mosaic', 'forage'] as const;
export type GameId = (typeof GAME_IDS)[number];

/**
 * What a game's pages need besides its component: no Svelte and no engine, so
 * server loads and the pictures page can use it cheaply.
 */
export interface GameParts<L extends Picture = Picture> {
	/** Every level, in play order. */
	LEVELS: L[];
	PACKS: Pack<L>[];
	save: GameSave;
	/** A level's difficulty from 1 to 5, for the pictures page, when the game rates its levels. */
	difficulty?(level: L): number | null;
}

export interface GameDef<L extends Picture = Picture, S = unknown> {
	id: GameId;
	/** As shown on the page and in titles. */
	name: string;
	/** One line on what you do; the home page's card and the game page's description. */
	about: string;
	parts(): Promise<GameParts<L>>;
	/**
	 * Loads the engine's level builder: level `index`'s starting state, as the
	 * component builds it. Pure, so it runs at prerender.
	 */
	build(): Promise<(level: L, index: number) => S>;
	/** The game's component: it takes the level controller's props. */
	component(): Promise<Component<LevelProps<L, S>>>;
	/** The game in the shared picture editor. */
	editor(): Promise<EditorGame<L>>;
}

/** Each game typed as itself, then loosened so one list holds them all. */
function game<I extends GameId, L extends Picture, S>(
	def: GameDef<L, S> & { id: I }
): GameDef & { id: I } {
	return def as unknown as GameDef & { id: I };
}

const DEFS: { [I in GameId]: GameDef & { id: I } } = {
	mosaic: game<'mosaic', MosaicLevel, MosaicState>({
		id: 'mosaic',
		name: 'mosaic',
		about: 'lift dots off a picture, sort them by color, and fill it back in',
		parts: async () => {
			const [{ LEVELS, PACKS }, { mosaicSave }] = await Promise.all([
				import('./mosaic/levels/index'),
				import('./mosaic/save')
			]);
			return { LEVELS, PACKS, save: mosaicSave };
		},
		build: async () => (await import('./mosaic/engine')).buildPuzzle,
		component: async () => (await import('./mosaic/Mosaic.svelte')).default,
		editor: async () => (await import('./mosaic/editor')).mosaicEditor
	}),
	forage: game<'forage', ForageLevel, ForageState>({
		id: 'forage',
		name: 'forage',
		about: 'send ant colonies to eat a picture away, color by color, from the outside in',
		parts: async () => {
			const [{ LEVELS, PACKS }, { forageSave }, { levelDifficulty }] = await Promise.all([
				import('./forage/levels/index'),
				import('./forage/save'),
				import('./forage/difficulty')
			]);
			return { LEVELS, PACKS, save: forageSave, difficulty: levelDifficulty };
		},
		build: async () => (await import('./forage/engine')).buildPuzzle,
		component: async () => (await import('./forage/Forage.svelte')).default,
		editor: async () => (await import('./forage/editor')).forageEditor
	})
};

export const GAMES: GameDef[] = GAME_IDS.map((id) => DEFS[id]);

/** The game with this id. Routes get ids through the `game` param matcher, so it's there. */
export function findGame(id: string): GameDef {
	if (!isGameId(id)) throw new Error(`no game "${id}"`);
	return DEFS[id];
}

export function isGameId(id: string): id is GameId {
	return (GAME_IDS as readonly string[]).includes(id);
}
