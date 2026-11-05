/*
 * One report per level: can it be solved, how hard is it, and what needs fixing.
 * Used by the editor (live, as you paint) and by `pnpm -F parlor levels`.
 * Imports use `.ts` so node scripts can load this file directly.
 */
import { boardGroups, buildPuzzle, solve, TRAY, type Level } from './engine.ts';
import { checkPicture } from '../shared/editor/checks.ts';

export interface LevelReport {
	w: number;
	h: number;
	dots: number;
	colors: number;
	/** Pixels per color key. */
	counts: Record<string, number>;
	moves: number;
	parks: number;
	minTray: number;
	/** Which shuffle the puzzle kept; -1 when no shuffle fit the standard tray. */
	shuffle: number;
	groups: number;
	biggestGroup: number;
	/** Starting dot groups that sit on spots of a single color. */
	cleanGroups: number;
	/** Dots that start on a spot of their own color. */
	onOwnColor: number;
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
	const picture = checkPicture(lv);
	const { w, h, counts, problems, warnings } = picture;
	const dots = picture.pixels;
	const empty: LevelReport = {
		w,
		h,
		dots,
		colors: Object.keys(counts).length,
		counts,
		moves: 0,
		parks: 0,
		minTray: 0,
		shuffle: -1,
		groups: 0,
		biggestGroup: 0,
		cleanGroups: 0,
		onOwnColor: 0,
		score: 0,
		ms: 0,
		problems,
		warnings
	};
	if (problems.length) return { ...empty, ms: performance.now() - t0 };

	const s = buildPuzzle(lv, index);
	const sol = solve(s, 1, 1);
	if (s.attempt! < 0) problems.push(`needs a ${s.trayCap}-slot tray (the game has ${TRAY})`);
	if (!sol) problems.push('the solver could not finish it');

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
	const parks = sol ? sol.path.filter((a) => a.dst.to === 'tray').length : 0;
	const moves = sol ? sol.path.length : 0;
	return {
		...empty,
		moves,
		parks,
		minTray: s.minTray ?? 0,
		shuffle: s.attempt ?? -1,
		groups: groups.length,
		biggestGroup: Math.max(0, ...groups.map((g) => g.cells.length)),
		cleanGroups: clean,
		onOwnColor,
		score: Math.round(parks * 2 + (s.minTray ?? 0) + moves / 2),
		ms: performance.now() - t0
	};
}
