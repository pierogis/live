/* What the shared picture editor needs from a game. */
import type { Component } from 'svelte';

import type { Picture } from './checks';

export type { Picture } from './checks';

export interface EditorPack<L extends Picture = Picture> {
	/** File name without `.json`, like `01-first-light`. */
	id: string;
	name: string;
	levels: L[];
}

/** The editor's live checks for a draft. */
export interface Check {
	/** Must fix before play-testing or saving. */
	problems: string[];
	warnings: string[];
	/** One line for a playable level, like "Solvable with the 20-slot tray." */
	summary: string;
	stats: { label: string; value: string }[];
}

export interface EditorGame<L extends Picture = Picture> {
	/** The game's name; also the folder its packs live in: src/lib/<id>/levels. */
	id: string;
	packs: EditorPack<L>[];
	/** Check a draft as if it were the `index`th level in play order. */
	check: (level: L, index: number) => Check;
	/** The game itself, for play-testing a draft. */
	play: Component<{ levels: L[]; start?: number; sandbox?: boolean }>;
}
