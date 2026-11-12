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
	minTray: number;
	blobs: string;
	shuffle: number;
	groups: number;
	biggestGroup: number;
	cleanGroups: number;
	taps: number;
	glances: number;
	score: number;
	ms: number;
	problems: string[];
	warnings: string[];
}

const WALL = 0.8;

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

export function muralScore(levels: Level[]): number {
	return muralMeasure(levels.map((lv) => reportLevel(lv).score));
}

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
