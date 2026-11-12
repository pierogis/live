import { checkPicture } from '../shared/checks.ts';
import { muralMeasure } from '../shared/difficulty.ts';
import { analyze, type Analysis, type Budget } from './cruxes.ts';
import { levelHardness } from './difficulty.ts';
import { triesOf, type Tries } from './learner.ts';
import * as F from './engine.ts';
import { carelessGame, hastyGame, winsOf, wonShare } from './player.ts';

export interface Difficulty {
	wins: number;
	strong: number;
	clean: number;
	look: number;
	careless: number;
}

export const UNMEASURED: Difficulty = {
	wins: NaN,
	strong: NaN,
	clean: NaN,
	look: NaN,
	careless: NaN
};

export const GAMES = 16;

function winShare(s: F.State, rollouts: number): number {
	return wonShare(rollouts, (k) => carelessGame(s, k) !== null);
}

export function measure(s: F.State, games = GAMES): Difficulty {
	const strong = winsOf('strong', s, games);
	const clean = winsOf('clean', s, games);
	const look = winsOf('look', s, games);
	const careless = winShare(s, games);
	return { wins: Math.max(strong, clean, look, careless), strong, clean, look, careless };
}

const HASTE = 15;

export function hastyWins(s: F.State, games = GAMES): number {
	return wonShare(games, (k) => hastyGame(s, k * 31 + 7, HASTE));
}

export function hastyFloor(target: number): number {
	return Math.max(0, 0.9 - 3.5 * (1 - target));
}

export function targetWins(difficulty = 0): number {
	return 1 - 0.8 * F.progress(difficulty) ** 0.8;
}

const HARDEST: Tries = { best: 5, typical: 8, worst: 15 };

export function targetTries(difficulty = 0): Tries {
	const t = F.progress(difficulty);
	return {
		best: HARDEST.best ** t,
		typical: HARDEST.typical ** t,
		worst: HARDEST.worst ** t
	};
}

export function muralHardness(levels: F.Level[]): number {
	return muralMeasure(
		levels.map((lv) => levelHardness(lv) ?? Math.log2(targetTries(lv.difficulty).typical))
	);
}

export interface Pressure {
	waits: number;
	longWaits: number;
	heldPairs: number;
	sends: number;
}

export function pressure(s0: F.State): Pressure {
	const s = F.clone(s0);
	const outAt = new Map<number, number>();
	const counted = new Set<number>();
	const groupOf = new Map(s0.columns.flat().map((e) => [e.id, e.link]));
	let waits = 0;
	let longWaits = 0;
	let heldPairs = 0;
	const intended = s0.intended ?? [];
	intended.forEach((col, k) => {
		const r = F.pick(s, col);
		if (!r.ok) return;
		if (r.parked.length) waits++;
		for (const e of s.slots) if (e && !outAt.has(e.id)) outAt.set(e.id, k);
		const here = new Set(s.slots.flatMap((e) => (e ? [e.id] : [])));
		for (const [id, at] of outAt) {
			if (here.has(id)) continue;
			outAt.delete(id);
			if (k - at < 3) continue;
			const link = groupOf.get(id);
			if (link === undefined) longWaits++;
			else if (!counted.has(link)) {
				counted.add(link);
				heldPairs++;
			}
		}
	});
	return { waits, longWaits, heldPairs, sends: intended.length };
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
	difficulty: Difficulty;
	tries: Tries | null;
	cruxes: Analysis | null;
	pressure: Pressure | null;
	target: number;
	problems: string[];
	warnings: string[];
}

export function reportForage(lv: F.Level, games = GAMES, budget?: Budget): ForageReport {
	const picture = checkPicture(lv);
	const { problems, warnings } = picture;
	const target = targetWins(lv.difficulty);
	if (problems.length) {
		return {
			w: picture.w,
			h: picture.h,
			blocks: picture.pixels,
			colors: Object.keys(picture.counts).length,
			colonies: 0,
			links: 0,
			locks: 0,
			mystery: 0,
			difficulty: UNMEASURED,
			tries: null,
			cruxes: null,
			pressure: null,
			target,
			problems,
			warnings
		};
	}
	const s = F.buildPuzzle(lv);
	const colonies = s.columns.flat();
	return {
		w: s.w,
		h: s.h,
		blocks: s.target.filter((c) => c >= 0).length,
		colors: s.colors.length,
		colonies: colonies.length,
		links: new Set(colonies.flatMap((c) => (c.link === undefined ? [] : [c.link]))).size,
		locks: s.locks.filter((k) => k >= 0).length,
		mystery: colonies.filter((c) => c.mystery).length,
		difficulty: games ? measure(s, games) : UNMEASURED,
		tries: budget ? triesOf(s) : null,
		cruxes: budget ? analyze(s, budget) : null,
		pressure: pressure(s),
		target,
		problems,
		warnings
	};
}
