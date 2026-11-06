/*
 * Level packs for any game: its `levels/*.json` files, in file name order. Each
 * game globs its own folder (Vite needs the pattern written there) and hands the
 * files here; node tests and scripts read the files and do the same. Imports use
 * `.ts` so node can load this file directly.
 */
import type { Pack, Picture } from './level.ts';

/** Pack files by path, each as its JSON (under `default`, the way a glob gives it). */
export type PackFiles<L> = Record<string, { default: { name: string; levels: L[] } }>;

/** The packs in file name order, and every level in play order. */
export function levelsFrom<L extends Picture>(
	files: PackFiles<L>
): { PACKS: Pack<L>[]; LEVELS: L[] } {
	const PACKS = Object.keys(files)
		.sort()
		.map((path) => ({
			id: path.slice(path.lastIndexOf('/') + 1, -'.json'.length),
			...files[path].default
		}));
	return { PACKS, LEVELS: PACKS.flatMap((p) => p.levels) };
}
