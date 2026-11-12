import type { Pack, Picture } from './level.ts';

export type PackFile<L extends Picture = Picture> = Omit<Pack<L>, 'id'>;

export type PackFiles<L extends Picture> = Record<string, { default: PackFile<L> }>;

export function packLevels<L extends Picture>({ song, difficulty, levels }: PackFile<L>): L[] {
	if (!song && difficulty === undefined) return levels;
	return levels.map((lv) => ({
		...lv,
		...(song && { song: { ...song, ...lv.song } }),
		...(difficulty !== undefined && { difficulty: lv.difficulty ?? difficulty })
	}));
}

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
