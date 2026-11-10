/* What every game's levels share. Types only, so node scripts can import it too. */

/** A level's picture: rows of palette letters, '.' for empty. */
export interface Picture {
	id: string;
	name: string;
	palette: Record<string, string>;
	art: string[];
	/** Its song's key and mode, when the seed's don't suit it (see `SongKey` in sound.ts). */
	song?: { key: string; mode: string };
}

/** A level as a game's level list has it: everything but its picture (scripts/level-lists.ts). */
export type Listed<L extends Picture = Picture> = Omit<L, 'palette' | 'art'>;

/** One `levels/*.json` file: a named run of levels. */
export interface Pack<L extends Picture = Picture> {
	/** File name without `.json`, like `01-first-light`. */
	id: string;
	name: string;
	levels: L[];
}
