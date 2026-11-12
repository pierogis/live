/*
 * One report per level: can it be solved, how hard is it, and what needs fixing.
 * Used by `pnpm -F museum levels` and `pnpm -F museum murals`.
 * Imports use `.ts` so node scripts can load this file directly.
 */
import {
	blobSizes,
	boardGroups,
	buildSolved,
	isWon,
	move,
	nearestOpen,
	openCount,
	clone,
	tapMove,
	type Group,
	type Level,
	type State
} from './engine.ts';
import { checkPicture } from '../shared/checks.ts';
import { muralMeasure } from '../shared/difficulty.ts';
import { makeRng } from '../shared/engine.ts';

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
	/** The quick player's taps (`quickPlay`), on average. */
	taps: number;
	/** The groups it looked past before finding one that helped, on average. */
	glances: number;
	/** How hard: the quick player's taps and glances. */
	score: number;
	ms: number;
	/** Must fix: the level can't ship like this. */
	problems: string[];
	/** Worth a look, but playable. */
	warnings: string[];
}

/** The share of open spots, all of tray colors, that has the quick player empty its tray. */
const WALL = 0.8;

/**
 * Plays the way people do, quickly, not like the solver's best path: fills the tray first,
 * tapping whatever catches the eye (big groups first, lone dots last), which goes home
 * when its color has an open spot and into the tray when not. Once the tray is full, it
 * looks past groups until it finds one that can go home, so needed lone dots cost
 * glances. It empties the tray only at a wall: when nothing on the board can go home, or
 * when nearly all the open spots (`WALL`) are colors in the tray; then it sends home the
 * tray color with the most open spots. Returns its taps and glances.
 */
export function quickPlay(s0: State, seed: number): { taps: number; glances: number } {
	const s = clone(s0);
	const rng = makeRng(seed);
	let taps = 0;
	let glances = 0;
	for (const limit = 10 * s.target.length; !isWon(s) && taps < limit; taps++) {
		const open = s.colors.map((_, c) => openCount(s, c));
		const trayed = new Set(s.tray.map((g) => g.c));
		const opens = open.reduce((a, n) => a + n, 0);
		const trayOpens = [...trayed].reduce((a, c) => a + open[c], 0);
		// Noticed in turn, each group about as likely as its size to catch the eye next.
		const seen = boardGroups(s)
			.map((g) => ({ g, key: rng() ** (1 / g.cells.length) }))
			.sort((a, b) => b.key - a.key)
			.map(({ g }) => g);
		let tap: Group | undefined;
		if (trayOpens < WALL * opens || !opens) {
			if (s.tray.length < s.trayCap) tap = seen[0];
			else {
				tap = seen.find((g) => open[g.color] > 0);
				glances += tap ? seen.indexOf(tap) : seen.length;
			}
		}
		if (tap) {
			const { sel, dst } = tapMove(s, tap.cells[0]);
			move(s, sel, dst);
			continue;
		}
		const home = [...trayed].sort((a, b) => open[b] - open[a])[0];
		if (home === undefined || !open[home]) break;
		move(s, { from: 'tray', color: home }, { to: 'spot', cell: nearestOpen(s, home, 0) });
	}
	return isWon(s) ? { taps, glances } : { taps: Infinity, glances };
}

/** How hard a mural is, for putting murals in order: its panels' scores (`muralMeasure`). */
export function muralScore(levels: Level[]): number {
	return muralMeasure(levels.map((lv) => reportLevel(lv).score));
}

/** Check a level, as hard as its mural's difficulty makes it. */
export function reportLevel(lv: Level): LevelReport {
	const t0 = performance.now();
	const { w, h, counts, pixels: dots, problems, warnings } = checkPicture(lv);
	const blobs = blobSizes(lv.difficulty ?? 0);
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
		taps: 0,
		glances: 0,
		score: 0,
		ms: 0,
		problems,
		warnings
	};
	if (problems.length) return { ...empty, ms: performance.now() - t0 };

	// The same solve that let the build keep its shuffle, so the report agrees with the game.
	const { state: s, solution: sol } = buildSolved(lv);
	const shuffle = s.attempt ?? -1;
	const minTray = s.minTray ?? 0;
	if (shuffle < 0) problems.push(`needs more than its ${s.trayBase}-slot tray`);

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
	const runs = [1, 2, 3].map((seed) => quickPlay(s, seed));
	const taps = runs.reduce((a, r) => a + r.taps, 0) / runs.length;
	const glances = runs.reduce((a, r) => a + r.glances, 0) / runs.length;
	if (!Number.isFinite(taps)) problems.push('a quick player got stuck');
	return {
		...empty,
		moves,
		parks,
		minTray,
		shuffle,
		groups: groups.length,
		biggestGroup: Math.max(0, ...groups.map((g) => g.cells.length)),
		cleanGroups: clean,
		taps: Math.round(taps),
		glances: Math.round(glances),
		score: Math.round(taps + glances),
		ms: performance.now() - t0
	};
}
