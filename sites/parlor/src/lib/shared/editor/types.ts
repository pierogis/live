/*
 * What the shared picture editor needs from a game. A game's rules (its `rules.ts`)
 * are pure, so the editor's check worker and node scripts load them too; the editor
 * adds the packs and the game itself. Imports use `.ts` so node can load this file.
 */
import type { Component } from 'svelte';

import type { GameId } from '../../games.ts';
import type { Pack, Picture } from '../level.ts';

/** The editor's live checks for a draft. */
export interface Check {
	/** Must fix before play-testing or saving. */
	problems: string[];
	warnings: string[];
	/** One line for a playable level, like "Solvable with the 20-slot tray." */
	summary: string;
	stats: { label: string; value: string }[];
}

/** One level's line in `pnpm -F parlor levels`. */
export interface Row {
	problems: string[];
	warnings: string[];
	/** Short stats, one column each, in order. */
	cols: Record<string, string | number>;
	/** Rough difficulty, for `--order`; leave out when the game has none. */
	score?: number;
}

/** A game's checks, with no UI: node scripts and the editor's check worker import them. */
export interface Rules<L extends Picture = Picture> {
	/** The game's name; also the folder its packs live in: src/lib/<id>/levels. */
	id: GameId;
	/** Check a draft as if it were the `index`th level in play order. Quick enough to run as you paint. */
	check: (level: L, index: number) => Check;
	/** A shipped level's line in `pnpm -F parlor levels`; `measure` asks for the slow measurements too. */
	row: (level: L, index: number, measure: boolean) => Row;
	/** Fields dropped when a level is loaded into the editor, because editing makes them stale. */
	forget?: (keyof L)[];
}

export interface EditorGame<L extends Picture = Picture> extends Rules<L> {
	packs: Pack<L>[];
	/** The game itself, for play-testing a draft. */
	play: Component<{ levels: L[]; start?: number; sandbox?: boolean }>;
	/**
	 * Starts the game's check worker (src/lib/<game>/check.worker.ts). Written in the
	 * game's own module, so Vite bundles the worker with that game's rules and no other.
	 */
	checker(): Worker;
}
