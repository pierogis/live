/*
 * Level packs for any game: its `levels/*.json` files, in file name order. Each
 * game globs its own folder (Vite needs the pattern written there) and hands the
 * files here.
 */

export interface Pack<L> {
	/** File name without `.json`, like `01-first-light`. */
	id: string;
	name: string;
	levels: L[];
}

export function packsFrom<L>(
	files: Record<string, { default: { name: string; levels: L[] } }>
): Pack<L>[] {
	return Object.keys(files)
		.sort()
		.map((path) => ({
			id: path.slice(path.lastIndexOf('/') + 1, -'.json'.length),
			...files[path].default
		}));
}
