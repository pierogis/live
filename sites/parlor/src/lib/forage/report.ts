/*
 * How hard a Forage deal is: play it many times with random players.
 *   careless: sends any colony that can go
 *   careful: prefers colonies that will finish eating without having to wait
 * Imports use `.ts` so node scripts can load this file directly.
 */
import * as F from './engine.ts';

export interface Difficulty {
	/** Share of careless games won, 0 to 1. */
	careless: number;
	/** Share of careful games won, 0 to 1. */
	careful: number;
}

export function playRandom(s0: F.State, seed: number, careful: boolean): boolean {
	const s = F.clone(s0);
	const rng = F.makeRng(seed);
	while (!F.isWon(s)) {
		const legal = F.legalPicks(s);
		if (!legal.length) return false;
		let pool = legal;
		if (careful) {
			const clean = legal.filter((c) => F.wouldWait(s, c) === false);
			if (clean.length) pool = clean;
		}
		F.pick(s, pool[Math.floor(rng() * pool.length)]);
	}
	return true;
}

export function measure(s: F.State, rollouts = 30): Difficulty {
	let careless = 0;
	let careful = 0;
	for (let k = 1; k <= rollouts; k++) {
		if (playRandom(s, k, false)) careless++;
		if (playRandom(s, k * 7 + 3, true)) careful++;
	}
	return { careless: careless / rollouts, careful: careful / rollouts };
}

/** Share of careless games a level at this place in play order should let you win. */
export function targetWins(index: number): number {
	// Eases from about 88% down toward 22%, with an easier breather every sixth level.
	const base = 0.22 + 0.66 * Math.exp(-index / 25);
	const breather = index % 6 === 5 ? 0.25 : 0;
	return Math.min(0.92, base + breather);
}

export interface ForageReport {
	w: number;
	h: number;
	blocks: number;
	colors: number;
	colonies: number;
	links: number;
	locks: number;
	mystery: number;
	/** The built-in winning play works. */
	intendedWins: boolean;
	difficulty: Difficulty;
	target: number;
	problems: string[];
	ms: number;
}

export function reportForage(lv: F.Level, index: number, rollouts = 30): ForageReport {
	const t0 = performance.now();
	const problems: string[] = [];
	const s = F.buildPuzzle(lv, index);
	const ok = F.wins(s);
	if (!ok) problems.push('the built-in winning play does not win');
	const colonies = s.columns.flat();
	return {
		w: s.w,
		h: s.h,
		blocks: s.target.filter((c) => c >= 0).length,
		colors: s.colors.length,
		colonies: colonies.length,
		links: colonies.filter((c) => c.link !== undefined).length / 2,
		locks: s.locks.filter((k) => k >= 0).length,
		mystery: colonies.filter((c) => c.mystery).length,
		intendedWins: ok,
		difficulty: rollouts ? measure(s, rollouts) : { careless: NaN, careful: NaN },
		target: targetWins(index),
		problems,
		ms: performance.now() - t0
	};
}
