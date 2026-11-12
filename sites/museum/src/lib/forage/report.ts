/*
 * One report per Forage level: is the picture usable, what got dealt, how hard
 * the deal is, and how much it makes you wait. Used by `pnpm -F museum levels`,
 * `pnpm -F museum murals` and `forage:tune`.
 * Difficulty is how many attempts people who retry take to win it (learner.ts),
 * against `targetTries`. A quicker guide, for forage:tune's search, is how often a
 * good player wins a fresh game, measured by playing it many times with each of
 * these (see player.ts):
 *   strong: a careful player who thinks a move or two ahead
 *   clean: the rule of thumb: send a colony that finishes right away when there
 *     is one, else park the best-looking one
 *   look: the same rule, choosing among the ones that finish with look ahead
 *   careless: sends any colony that can go
 * A level's win share is the best of them: a deal whose trap catches one
 * player's habits isn't hard if another way of playing walks through it.
 * Its cruxes (cruxes.ts) say where it's hard: where the rule of thumb breaks, and
 * how often.
 * Imports use `.ts` so node scripts can load this file directly.
 */
import { checkPicture } from '../shared/checks.ts';
import { muralMeasure } from '../shared/difficulty.ts';
import { analyze, type Analysis, type Budget } from './cruxes.ts';
import { levelHardness } from './difficulty.ts';
import { triesOf, type Tries } from './learner.ts';
import * as F from './engine.ts';
import { carelessGame, hastyGame, winsOf, wonShare } from './player.ts';

export interface Difficulty {
	/** The best of the players, 0 to 1: what the level's difficulty index comes from. */
	wins: number;
	/** Share of strong games won, 0 to 1. */
	strong: number;
	/** Share of rule-of-thumb games won, picking at random among sends that finish. */
	clean: number;
	/** Share of rule-of-thumb games won, picking among sends that finish with look ahead. */
	look: number;
	/** Share of careless (random) games won, 0 to 1. */
	careless: number;
}

/** Difficulty not measured. */
export const UNMEASURED: Difficulty = {
	wins: NaN,
	strong: NaN,
	clean: NaN,
	look: NaN,
	careless: NaN
};

/** Games of each kind per level for `forage:tune` and `pnpm levels --measure`. */
export const GAMES = 16;

/** Share of `rollouts` careless games won. */
function winShare(s: F.State, rollouts: number): number {
	return wonShare(rollouts, (k) => carelessGame(s, k) !== null);
}

/** `games` games by each player. */
export function measure(s: F.State, games = GAMES): Difficulty {
	const strong = winsOf('strong', s, games);
	const clean = winsOf('clean', s, games);
	const look = winsOf('look', s, games);
	const careless = winShare(s, games);
	return { wins: Math.max(strong, clean, look, careless), strong, clean, look, careless };
}

/** Ticks between a hasty player's sends: a tap every second and a half. */
const HASTE = 15;

/**
 * Share of `games` hasty games won (see hastyGame() in player.ts), 0 to 1. The
 * players in measure() know which sends finish, park well and wait for the board;
 * a person on an early level does none of those reliably. `forage:tune` holds
 * easy levels to hastyFloor() of these, so "easy" is easy for that player too.
 */
export function hastyWins(s: F.State, games = GAMES): number {
	return wonShare(games, (k) => hastyGame(s, k * 31 + 7, HASTE));
}

/**
 * The least hastyWins() a level with this target should have: 9 in 10 where the
 * target is to always win, less as levels get harder, nothing once the target is
 * to lose one game in four (by then it's meant to take care).
 */
export function hastyFloor(target: number): number {
	return Math.max(0, 0.9 - 3.5 * (1 - target));
}

/**
 * Share of fresh games (see Difficulty.wins) a level of this difficulty (0 to 1) should
 * let you win: a rough guide for forage:tune's search, whose target is `targetTries`.
 * Teaching levels you basically always win; past them it falls steadily to about 1 in 5
 * at the hardest.
 */
export function targetWins(difficulty = 0): number {
	return 1 - 0.8 * F.progress(difficulty) ** 0.8;
}

/** At the hardest, the attempts (learner.ts) the best, typical and worst learners should take. */
const HARDEST: Tries = { best: 5, typical: 8, worst: 15 };

/**
 * Attempts to win (see learner.ts) a level of this difficulty (0 to 1) should take: one
 * for everyone while teaching, rising evenly in ratio to `HARDEST` at difficulty 1. The
 * best learners, sharp and lucky, never grind; the worst may take a while.
 */
export function targetTries(difficulty = 0): Tries {
	const t = F.progress(difficulty);
	return {
		best: HARDEST.best ** t,
		typical: HARDEST.typical ** t,
		worst: HARDEST.worst ** t
	};
}

/**
 * How hard a mural is, for putting murals in order: its panels' measured hardness
 * (`levelHardness`, from what forage:tune saved) in a power mean (`muralMeasure`). A panel
 * not tuned yet counts as what its difficulty aims for.
 */
export function muralHardness(levels: F.Level[]): number {
	return muralMeasure(
		levels.map((lv) => levelHardness(lv) ?? Math.log2(targetTries(lv.difficulty).typical))
	);
}

/** How much the built-in play makes you wait: the pressure a deal puts on the slots. */
export interface Pressure {
	/** Sends after which a colony sat waiting in its slot for its food to open up. */
	waits: number;
	/** Colonies that held their slot through 3 or more later sends. */
	longWaits: number;
	/** Linked groups that held their slots through 3 or more later sends, some waiting. */
	heldPairs: number;
	/** Sends in the built-in play. */
	sends: number;
}

/** How long colonies wait in the built-in play, counted in sends. */
export function pressure(s0: F.State): Pressure {
	const s = F.clone(s0);
	/** Per colony out working: the send it went out on. */
	const outAt = new Map<number, number>();
	/** Linked groups already counted as held. */
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
			// A group counts once: its colonies all leave together.
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
	/** Attempts people who retry take (learner.ts); null when not asked for. */
	tries: Tries | null;
	/** Where it's hard (see cruxes.ts); null when not asked for. */
	cruxes: Analysis | null;
	pressure: Pressure | null;
	target: number;
	/** Must fix: the level can't ship like this. */
	problems: string[];
	/** Worth a look, but playable. */
	warnings: string[];
}

/**
 * Check a level, as hard as its difficulty makes it. `games` games by each player
 * measure how often it's won fresh (0 skips that); `budget` finds its cruxes and how many
 * attempts learners take (none skips those: they're slow).
 */
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
