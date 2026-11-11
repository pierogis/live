/*
 * One report per level: can it be solved, how hard is it, and what needs fixing.
 * Used by `pnpm -F museum levels` and `pnpm -F museum murals`.
 * Imports use `.ts` so node scripts can load this file directly.
 */
import { blobSizes, boardGroups, buildSolved, BUILD_TRAY, type Level } from './engine.ts';
import { checkPicture } from '../shared/checks.ts';

export interface LevelReport {
	w: number;
	h: number;
	dots: number;
	colors: number;
	moves: number;
	parks: number;
	/** The most tray the solver's path filled at once. */
	minTray: number;
	/** The sizes of the scattered blobs at this point in play, like "10-28". */
	blobs: string;
	/** Which shuffle the puzzle kept; -1 when no shuffle fit the standard tray. */
	shuffle: number;
	groups: number;
	biggestGroup: number;
	/** Starting dot groups that sit on spots of a single color. */
	cleanGroups: number;
	/** Rough difficulty: more parking, more tray use and more moves are harder. */
	score: number;
	ms: number;
	/** Must fix: the level can't ship like this. */
	problems: string[];
	/** Worth a look, but playable. */
	warnings: string[];
}

/** Check a level as if it were the `index`th level in play order (that sets its blob sizes). */
export function reportLevel(lv: Level, index: number): LevelReport {
	const t0 = performance.now();
	const { w, h, counts, pixels: dots, problems, warnings } = checkPicture(lv);
	const blobs = blobSizes(index);
	const empty: LevelReport = {
		w,
		h,
		dots,
		colors: Object.keys(counts).length,
		moves: 0,
		parks: 0,
		minTray: 0,
		blobs: `${blobs.min}-${blobs.max}`,
		shuffle: -1,
		groups: 0,
		biggestGroup: 0,
		cleanGroups: 0,
		score: 0,
		ms: 0,
		problems,
		warnings
	};
	if (problems.length) return { ...empty, ms: performance.now() - t0 };

	// The same solve that let the build keep its shuffle, so the report agrees with the game.
	const { state: s, solution: sol } = buildSolved(lv, index);
	const shuffle = s.attempt ?? -1;
	const minTray = s.minTray ?? 0;
	if (shuffle < 0) problems.push(`needs more than a ${BUILD_TRAY}-slot tray`);

	const groups = boardGroups(s);
	const clean = groups.filter((g) => new Set(g.cells.map((j) => s.target[j])).size === 1).length;
	const onOwnColor = s.target.filter((c, k) => c >= 0 && s.top[k]!.c === c).length;
	const top = Math.max(...Object.values(counts));
	if (2 * top > dots) {
		warnings.push(
			`one color is ${Math.round((100 * top) / dots)}% of the picture, so some dots must start on their own color`
		);
	} else if (onOwnColor) {
		warnings.push(`${onOwnColor} dot(s) start on their own color`);
	}
	const parks = sol.path.filter((a) => a.dst.to === 'tray').length;
	const moves = sol.path.length;
	return {
		...empty,
		moves,
		parks,
		minTray,
		shuffle,
		groups: groups.length,
		biggestGroup: Math.max(0, ...groups.map((g) => g.cells.length)),
		cleanGroups: clean,
		score: Math.round(parks * 2 + minTray + moves / 2),
		ms: performance.now() - t0
	};
}
