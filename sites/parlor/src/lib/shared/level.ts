/* What every game's levels share. Types only, so node scripts can import it too. */

/** A level's picture: rows of palette letters, '.' for empty. */
export interface Picture {
	id: string;
	name: string;
	palette: Record<string, string>;
	art: string[];
}

/** One `levels/*.json` file: a named run of levels. */
export interface Pack<L extends Picture = Picture> {
	/** File name without `.json`, like `01-first-light`. */
	id: string;
	name: string;
	levels: L[];
}
