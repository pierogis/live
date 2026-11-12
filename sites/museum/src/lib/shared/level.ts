/* What every game's levels share. Types only, so node scripts can import it too. */
import type { SongSettings } from './sound.ts';

/** A level's picture: rows of palette letters, '.' for empty. */
export interface Picture {
	id: string;
	name: string;
	palette: Record<string, string>;
	art: string[];
	/** Its song's settings, so the music suits the picture (see `SongSettings`). */
	song?: SongSettings;
	/** How hard it's made, 0 to 1: its own, or its pack's (see `Pack.difficulty`). */
	difficulty?: number;
}

/** A level as a game's level list has it: everything but its picture (scripts/level-lists.ts). */
export type Listed<L extends Picture = Picture> = Omit<L, 'palette' | 'art'> & {
	/** The mural it's a panel of, and which panel (from 1), when its pack is one. */
	panel?: { mural: string; n: number; of: number };
};

/** One `levels/*.json` file: a named run of levels. */
export interface Pack<L extends Picture = Picture> {
	/** File name without `.json`, like `01-first-light`. */
	id: string;
	name: string;
	/**
	 * Its levels are the panels of one big picture, `cols` to a row, in reading
	 * order, all the same size: finishing the pack puts the mural together.
	 */
	mural?: { cols: number };
	/** Song settings all its levels share (each level's own come on top): a mural's theme and notes. */
	song?: SongSettings;
	/**
	 * How hard its levels are made, 0 to 1, in Mosaic (how big and how confined its scattered
	 * groups, how tight its tray), for each that doesn't set its own. A pack's own, not its
	 * place in play, so adding one changes no other.
	 */
	difficulty?: number;
	levels: L[];
}
