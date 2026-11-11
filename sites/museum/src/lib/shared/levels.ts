/*
 * Level packs for any game: its `levels/*.json` files, in file name order. Each
 * game globs its own folder (Vite needs the pattern written there) and hands the
 * files here; node tests and scripts read the files and do the same. Imports use
 * `.ts` so node can load this file directly.
 */
import type { Pack, Picture } from './level.ts';

/** One pack file's JSON. */
export type PackFile<L extends Picture = Picture> = Omit<Pack<L>, 'id'>;

/** Pack files by path, each as its JSON (under `default`, the way a glob gives it). */
export type PackFiles<L extends Picture> = Record<string, { default: PackFile<L> }>;

/** A pack's levels as played: the pack's song settings go to each, under the level's own. */
export function packLevels<L extends Picture>({ song, levels }: PackFile<L>): L[] {
	return song ? levels.map((lv) => ({ ...lv, song: { ...song, ...lv.song } })) : levels;
}

/** The packs in file name order, and every level in play order. */
export function levelsFrom<L extends Picture>(
	files: PackFiles<L>
): { PACKS: Pack<L>[]; LEVELS: L[] } {
	const PACKS = Object.keys(files)
		.sort()
		.map((path) => {
			const pack = files[path].default;
			const id = path.slice(path.lastIndexOf('/') + 1, -'.json'.length);
			return { id, ...pack, levels: packLevels(pack) };
		});
	return { PACKS, LEVELS: PACKS.flatMap((p) => p.levels) };
}

/** A pack as one picture: a mural's panels put back together, or else its first level. */
export function packPicture(pack: PackFile): Pick<Picture, 'palette' | 'art'> {
	const { levels, mural } = pack;
	if (!mural) return { palette: levels[0].palette, art: levels[0].art };
	const art: string[] = [];
	for (let k = 0; k < levels.length; k += mural.cols) {
		const row = levels.slice(k, k + mural.cols);
		row[0].art.forEach((_, y) => art.push(row.map((lv) => lv.art[y]).join('')));
	}
	return { palette: Object.assign({}, ...levels.map((lv) => lv.palette)), art };
}
