// Pick each Forage level's deal so it's about as hard as its difficulty (its mural's) asks for:
//   pnpm -F museum forage:tune [--seeds 10] [--games 16] [--screen 4] [--climb 80] [--hard-ms 420000] [--jobs <n>]
//                              [--only <id>] [--levels 0,5,20] [--dry] [--cruxes-only] [--results <file>]
// Hard is how many attempts people who retry take to win (learner.ts): the best (sharp and
// lucky), typical and worst of a dozen learners, against targetTries() in report.ts. Finding
// deals near that is guided by (see src/lib/forage/report.ts and cruxes.ts):
//   - how often a good player wins a fresh game: the best of a strong player, two that follow
//     the rule of thumb (send a colony that finishes right away), and a careless one,
//     `--games` each
//   - on easy levels, how often a hasty player wins too (hastyWins() in report.ts): one
//     who parks anything and doesn't wait for the board. An easy level has to be easy
//     for that player as well, or it only measures easy (see hastyFloor()).
//   - its cruxes: stretches where only some sends win, found with a solver, and its rule
//     breaks, where every send that finishes right away loses. Each difficulty wants a
//     number of them (see want()): none while the game teaches, one in the middle, several
//     spread through the game at the hardest.
// For each level it deals `--seeds` seeds and screens each with a quick look (`--screen`
// games each, a fast crux search). The closest few then have their deal searched: colonies
// moved between columns (the play and so the way to win stay the same) until the cruxes are
// what the level wants, for up to `--climb` tries. The deals that come out of that are
// measured properly, learners and all, and the closest to the target kept. When nothing lands near it, it
// pushes the tuning harder (or easier) and tries again.
// Hard levels also try late pressure (`tuning.late`) on half their seeds.
// Writes `seed`, `push`, `deal` (the columns found), `tuning.late`, the learners' attempts
// `tries` (which set the level's difficulty index), the win share `wins` and the crux counts
// `breaks`, `cruxes` and `spread` into the level packs (the hasty share is only printed).
// `--dry` only prints. `--cruxes-only` keeps each level's deal and win share and only measures
// its cruxes and attempts again. Levels are shared out to
// `--jobs` workers (one per core but one, by default).
// `--results <file>` also appends each level's result to that file as a JSON line, as it
// comes in, so a long run's work isn't lost if it stops early.
import { spawn } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import {
	analyze,
	cruxCounts,
	isReal,
	THOROUGH,
	type Analysis,
	type Budget
} from '../src/lib/forage/cruxes.ts';
import { fromTries, levelDifficulty } from '../src/lib/forage/difficulty.ts';
import * as F from '../src/lib/forage/engine.ts';
import { GIVE_UP, learn, type Expression, type Tries } from '../src/lib/forage/learner.ts';
import { rememberSends } from '../src/lib/forage/player.ts';
import {
	hastyFloor,
	hastyWins,
	measure,
	pressure,
	targetTries,
	targetWins,
	UNMEASURED,
	type Difficulty,
	type Pressure
} from '../src/lib/forage/report.ts';
import { hashStr, makeRng } from '../src/lib/shared/engine.ts';
import { LABELS } from '../src/lib/shared/difficulty.ts';
import { pct } from '../src/lib/shared/checks.ts';
import { loadPacks } from '../test/levels.ts';
import { writePack } from './write-pack.ts';

const { values: args } = parseArgs({
	options: {
		seeds: { type: 'string', default: '10' },
		games: { type: 'string', default: '16' },
		screen: { type: 'string', default: '4' },
		climb: { type: 'string', default: '80' },
		'hard-ms': { type: 'string', default: '420000' },
		jobs: { type: 'string', default: String(availableParallelism() - 1) },
		only: { type: 'string', default: '' },
		levels: { type: 'string', default: '' },
		dry: { type: 'boolean', default: false },
		'cruxes-only': { type: 'boolean', default: false },
		results: { type: 'string', default: '' },
		worker: { type: 'string', default: '' }
	}
});
const seeds = Number(args.seeds);
const games = Number(args.games);
const screen = Math.min(games, Number(args.screen));
const climbs = Number(args.climb);
const { only, worker } = args;
/** Level indices to tune, or every level. */
const picked = args.levels ? new Set(args.levels.split(',').map(Number)) : null;

/** A quick crux search, for screening seeds and for the deal search. */
const FAST: Budget = { ms: 20_000, playouts: 4, nodes: 20 };
/** The deal search's time per seed, and per level (hard levels get more). */
const CLIMB_MS = 120_000;
const LEVEL_MS = 200_000;
const HARD_LEVEL_MS = Number(args['hard-ms']);
/** Seeds whose deal gets searched. */
const SEARCHED = 2;

/** How many cruxes a level wants: at least `min`, at most `max`. */
interface Want {
	min: { real: number; breaks: number; spread: number };
	max: { real: number; breaks: number };
}

/**
 * The least share of a level's lost attempts that should fall in passes learners soon see
 * (`Expression.focus` in learner.ts): its difficulty should come from cruxes you learn,
 * not mistakes that show long after.
 */
const FOCUS = 0.7;

/**
 * The most attempts the worst learners (the 80th percentile) may take on any level: past
 * this, real players give up (see targetTries() in report.ts, whose hardest is this).
 */
const CEILING = 15;

/** Whether a level teaches the game (see `TEACH` in engine.ts). */
const teaches = (lv: F.Level) => (lv.difficulty ?? 0) < F.TEACH;

/** Whether a level is in the top tier: its timing is checked too (it's slow). */
const top = (lv: F.Level) => F.progress(lv.difficulty) >= 0.8;

/**
 * What a level wants, from the rating its target attempts ask for: none while the game
 * teaches, a rule break or so in the middle, several spread through the game at the
 * hardest (more for the top tier).
 */
function want(lv: F.Level): Want {
	const pips = fromTries(targetTries(lv.difficulty).typical);
	const none = { real: 0, breaks: 0, spread: 0 };
	if (teaches(lv)) return { min: none, max: { real: 0, breaks: 0 } };
	if (pips === 1) return { min: none, max: { real: 1, breaks: 0 } };
	if (pips === 2) return { min: none, max: { real: 2, breaks: 1 } };
	if (pips === 3) return { min: { real: 1, breaks: 1, spread: 1 }, max: { real: 3, breaks: 2 } };
	if (pips === 4) return { min: { real: 2, breaks: 2, spread: 2 }, max: { real: 9, breaks: 9 } };
	if (top(lv)) return { min: { real: 4, breaks: 3, spread: 3 }, max: { real: 99, breaks: 99 } };
	return { min: { real: 3, breaks: 2, spread: 2 }, max: { real: 99, breaks: 99 } };
}

/** How far a deal's cruxes are from what the level wants: 0 when they're right. */
function short(a: Analysis, w: Want): number {
	if (!a.complete) return 9;
	return (
		Math.max(0, w.min.real - a.real) +
		Math.max(0, w.min.breaks - a.breaks) +
		Math.max(0, w.min.spread - a.spread) +
		Math.max(0, a.real - w.max.real) +
		Math.max(0, a.breaks - w.max.breaks)
	);
}

/**
 * How much harder its cruxes make a deal: more, tighter (one way through counts
 * extra), rule breaks (most of all ones where parking at random loses too),
 * spread out, of more kinds.
 */
function hardness(a: Analysis): number {
	let v = 0;
	for (const c of a.cruxes) {
		if (isReal(c)) v += c.tightness + (c.orderings === 1 ? 0.3 : 0);
	}
	return (
		v + 0.6 * Math.min(5, a.breaks) + 0.6 * Math.min(4, a.choices) + 0.7 * a.spread + 0.3 * a.kinds
	);
}

interface Result extends Difficulty, CruxFields {
	/** Learners' attempts: best, typical, worst (see learner.ts); empty when not measured. */
	tries: number[];
	/** Share of learners' losses in passes they soon see (see learner.ts); NaN when not measured. */
	focus: number;
	/** Its passes, like "12-15:39%/10" (sends, share of losses, sends until seen). */
	passes: string;
	index: number;
	id: string;
	seed: number;
	push: number;
	/** Whether it uses late pressure (Tuning.late). */
	late: boolean;
	/** Share of hasty games won (see hastyWins()); NaN when not measured. */
	hasty: number;
	/** The columns the deal search found, or '' for the seed's own deal. */
	deal: string;
	pressure: Pressure;
	screened: number;
	searched: number;
	ms: number;
}

/** What a level's Result says about its cruxes. */
interface CruxFields {
	breaks: number;
	cruxes: number;
	spread: number;
	byThird: number[];
	/** Ways through the real cruxes (1: one exact sequence). */
	sequences: number;
	/** Sends that only win if you wait for the board to settle (top tier only, else -1). */
	timing: number;
	/** Each real crux, like "34%:3/1/0.98/park+lock" (where, sends, orderings, tightness, kinds). */
	detail: string;
}

function cruxFields(a: Analysis, lv: F.Level): CruxFields {
	return {
		...cruxCounts(a),
		byThird: a.byThird,
		sequences: a.sequences,
		timing: top(lv) ? a.timing : -1,
		detail: describe(a)
	};
}

/** What a Result says about where learners lose. */
function passFields(e: Expression): Pick<Result, 'focus' | 'passes'> {
	return {
		focus: e.focus,
		passes: e.passes
			.map((p) => `${p.from}-${p.to}:${Math.round(p.share * 100)}%/${p.gap}`)
			.join(' ')
	};
}

/** What a Result says about how learners do on a deal. */
function learned(s: F.State): Pick<Result, 'tries' | 'focus' | 'passes'> {
	const { tries, expression: e } = learn(s);
	return { tries: [tries.best, tries.typical, tries.worst], ...passFields(e) };
}

/** The level with late pressure on or off (see Tuning.late), dropping an empty tuning. */
function withLate(lv: F.Level, late: boolean): F.Level {
	const tuning = { ...lv.tuning };
	delete tuning.late;
	if (late) tuning.late = 1;
	const out: F.Level = { ...lv, tuning };
	if (!Object.keys(tuning).length) delete out.tuning;
	return out;
}

const packs = loadPacks<F.Level>('forage');
const levels = packs.flatMap((p) => p.levels);

/** A crux list, short: where it starts, its sends, orderings, tightness and kinds. */
function describe(a: Analysis): string {
	return a.cruxes
		.filter(isReal)
		.map(
			(c) =>
				`${Math.round(a.positions[c.from].eaten * 100)}%:${c.size}/${c.orderings}/${c.tightness.toFixed(2)}/${c.kinds.join('+')}`
		)
		.join(' ');
}

/** Find the deal for level `index` that best fits its target. */
function tune(index: number): Result {
	const t0 = performance.now();
	const lv: F.Level = { ...levels[index], deal: undefined };
	const target = targetWins(lv.difficulty);
	const goal = targetTries(lv.difficulty);
	const w = want(lv);
	const targetPips = fromTries(goal.typical);
	/** The hasty player's share an easy level needs (0 for the rest: not measured). */
	const floor = hastyFloor(target);
	/** How far under that a hasty share is; 0 when it's fine. */
	const shortfall = (hasty: number) => (floor ? Math.max(0, floor - hasty) : 0);
	/** A deal's shortfall from `n` hasty games (none played when there's no floor). */
	const rushed = (s: F.State, n: number) => (floor ? shortfall(hastyWins(s, n)) : 0);
	/**
	 * How far a measured deal is from the level's target, lower better: the typical
	 * learner's attempts off by a factor of 2 is 1, and the best or the worst learners
	 * going past theirs counts double. Past `CEILING` for the worst is a deal no real
	 * player should get: it counts so much it's kept only if nothing else turns up. Losses
	 * that don't fall in passes soon seen count too: missing `FOCUS` by a tenth is 0.2.
	 */
	const miss = (t: Tries, e: Expression, a: Analysis, under: number) => {
		const over = (x: number, cap: number) => Math.max(0, Math.log2(x / cap));
		return (
			Math.abs(Math.log2(t.typical / goal.typical)) +
			2 * Math.max(0, FOCUS - e.focus) +
			2 * over(t.best, goal.best) +
			2 * over(t.worst, goal.worst) +
			(t.worst > CEILING ? 5 : 0) +
			0.1 * short(a, w) +
			under
		);
	};
	interface Candidate {
		seed: number;
		push: number;
		late: boolean;
		plan: F.Plan;
		s: F.State;
		placement: number[] | null;
		a: Analysis;
		quick: number;
		/** rushed() from a quick look. */
		under: number;
	}
	let screened = 0;
	let searched = 0;
	/** Hard levels also try late pressure, on half their seeds. */
	const lateToo = targetPips >= 4;
	const screenSeeds = (push: number): Candidate[] => {
		const out: Candidate[] = [];
		for (let k = 0; k < seeds; k++) {
			const late = lateToo && k % 2 === 1;
			const seed = lateToo ? k >> 1 : k;
			const level = withLate({ ...lv, push }, late);
			const { plan, s } = F.buildWithPlan(level, {}, seed);
			const a = analyze(s, FAST);
			const quick = measure(s, screen).wins;
			// Hasty games are cheap, and a few say little: screen with twice as many.
			const under = rushed(s, 2 * screen);
			out.push({ seed, push, late, plan, s, placement: null, a, quick, under });
			screened++;
		}
		const rough = (c: Candidate) =>
			Math.abs(c.quick - target) + 0.25 * short(c.a, w) + (c.quick === 0 ? 0.3 : 0) + c.under;
		return out.sort((x, y) => rough(x) - rough(y));
	};

	/**
	 * Search a deal's columns until its cruxes are what the level wants, then on
	 * toward the target: harder (more and tighter cruxes) while it's won too often,
	 * easier while too rarely. Returns the deals worth measuring.
	 */
	const climb = (c: Candidate): Candidate[] => {
		// Harder when the seed's deal is too easy (if the level should be hard at all);
		// easier when it's too hard.
		const harder = c.quick > target && targetPips >= 2;
		if (short(c.a, w) === 0 && !harder) return [c];
		const rng = makeRng(hashStr(lv.id) + c.seed * 7 + c.push * 131);
		const groups = [...c.plan.groups];
		let place = F.placementOf(c.s);
		/** Whether each linked group is linked in the seed's deal: the search keeps it so. */
		const linkedAt = groups.map(([j, g]) => new Set(place.slice(j, j + g)).size === g);
		let dist = short(c.a, w);
		let hard = hardness(c.a);
		const kept: Candidate[] = [c];
		const tough = targetPips >= 4;
		const until = Math.min(
			performance.now() + (tough ? Math.max(CLIMB_MS, HARD_LEVEL_MS / 3) : CLIMB_MS),
			t0 + (tough ? HARD_LEVEL_MS : LEVEL_MS)
		);
		const m = place.length;
		const cols = c.plan.tune.columns;
		let tries = 0;
		for (let it = 0; it < climbs && tries < climbs * 20 && performance.now() < until; tries++) {
			const p = place.slice();
			const r = rng();
			if (r < 0.5) p[Math.floor(rng() * m)] = Math.floor(rng() * cols);
			else if (r < 0.8) {
				const j = Math.floor(rng() * m);
				const k = Math.floor(rng() * m);
				[p[j], p[k]] = [p[k], p[j]];
			} else {
				// A run of the play into one column.
				const j = Math.floor(rng() * m);
				const col = Math.floor(rng() * cols);
				for (let q = j; q < Math.min(m, j + 2 + Math.floor(rng() * 4)); q++) p[q] = col;
			}
			if (groups.some(([j, g], k) => linkedAt[k] && new Set(p.slice(j, j + g)).size !== g))
				continue;
			const s = F.dealAs(c.plan, p);
			if (!s || !F.wins(s)) continue;
			searched++;
			it++;
			const a = analyze(s, FAST);
			if (!a.complete) continue;
			const d = short(a, w);
			const h = hardness(a);
			// Closer to the cruxes it wants; at the same distance, harder or easier as it needs.
			const sideways = harder ? h >= hard : h <= hard;
			if (!(d < dist || (d === dist && sideways))) continue;
			const step = d < dist || h !== hard;
			place = p;
			dist = d;
			hard = h;
			if (d > 0 || !step) continue;
			// Right cruxes, and a real step: see how often it's won.
			const next = {
				...c,
				s,
				placement: p,
				a,
				quick: measure(s, screen).wins,
				under: rushed(s, 2 * screen)
			};
			kept.push(next);
			if (harder ? next.quick <= target : next.quick >= target) break;
			if (kept.length > 8) break;
		}
		// The two closest to the target, by their quick look and their cruxes.
		const near = (k: Candidate) => Math.abs(k.quick - target) + short(k.a, w) + k.under;
		return kept.sort((x, y) => near(x) - near(y)).slice(0, 2);
	};

	interface Best extends Candidate {
		d: Difficulty;
		tries: Tries;
		e: Expression;
		full: Analysis;
		hasty: number;
		m: number;
	}
	// Not `: Best | null`, which TS would narrow to null, missing the closures' writes.
	let best = null as Best | null;
	// The quick crux search finds a few more cruxes than are there; rank by the thorough one.
	const consider = (list: Candidate[]) => {
		for (const c of list) {
			const d = measure(c.s, games);
			const full = analyze(c.s, { ...THOROUGH, timing: top(lv) });
			const hasty = floor ? hastyWins(c.s, 2 * games) : NaN;
			const { tries, expression: e } = learn(c.s);
			const m = miss(tries, e, full, shortfall(hasty));
			if (!best || m < best.m) best = { ...c, d, tries, e, full, hasty, m };
		}
	};
	const tryPush = (push: number) => {
		const ranked = screenSeeds(push);
		for (const c of ranked.slice(0, targetPips >= 4 ? SEARCHED + 1 : SEARCHED)) {
			// Close enough already: don't spend the time on another seed.
			if (best && best.m < 0.15) break;
			consider(climb(c));
		}
	};
	tryPush(0);
	const b0 = best;
	// Far off: push the tuning harder (or easier) and try again. Early levels only get
	// easier that way when it's the hasty player they're too hard for.
	if (b0 && b0.m > 0.4 && !teaches(lv)) {
		const tooEasy = b0.tries.typical < goal.typical;
		if (b0.hasty < floor) tryPush(-1);
		else if (tooEasy || F.progress(lv.difficulty) > 0.4) tryPush(tooEasy ? 1 : -1);
	}
	const b = best!;
	return {
		index,
		id: lv.id,
		seed: b.seed,
		push: b.push,
		late: b.late,
		hasty: b.hasty,
		deal: b.placement ? b.placement.join('') : '',
		...b.d,
		tries: [b.tries.best, b.tries.typical, b.tries.worst],
		...passFields(b.e),
		...cruxFields(b.full, lv),
		pressure: pressure(b.s),
		screened,
		searched,
		ms: performance.now() - t0
	};
}

/** The level's saved deal, with only its cruxes and attempts measured again. */
function remeasure(index: number): Result {
	const t0 = performance.now();
	const lv = levels[index];
	const s = F.buildPuzzle(lv);
	const full = analyze(s, { ...THOROUGH, timing: top(lv) });
	return {
		index,
		id: lv.id,
		seed: lv.seed ?? 0,
		push: lv.push ?? 0,
		late: !!lv.tuning?.late,
		hasty: NaN,
		deal: lv.deal ?? '',
		...UNMEASURED,
		wins: lv.wins ?? NaN,
		...learned(s),
		...cruxFields(full, lv),
		pressure: pressure(s),
		screened: 0,
		searched: 0,
		ms: performance.now() - t0
	};
}

const wanted = (i: number) => (!only || levels[i].id === only) && (!picked || picked.has(i));

if (worker) {
	// A worker: tune every n-th wanted level, print one JSON line per level. Its deal
	// search plays many near-copies of a deal, which share sends (about 0.7GB a worker).
	rememberSends(4096);
	const [k, n] = worker.split('/').map(Number);
	const mine = levels.map((_, i) => i).filter(wanted);
	const run = args['cruxes-only'] ? remeasure : tune;
	for (let j = k; j < mine.length; j += n) console.log(JSON.stringify(run(mine[j])));
} else {
	const count = levels.filter((_, i) => wanted(i)).length;
	const jobs = Math.max(1, Math.min(count, Number(args.jobs)));
	const script = fileURLToPath(import.meta.url);
	const pass = [
		...['--seeds', String(seeds), '--games', String(games), '--screen', String(screen)],
		...['--climb', String(climbs), '--hard-ms', String(HARD_LEVEL_MS)],
		...(args['cruxes-only'] ? ['--cruxes-only'] : []),
		...(only ? ['--only', only] : []),
		...(args.levels ? ['--levels', args.levels] : [])
	];
	const results: Result[] = [];
	// A worker's NaN (not measured) comes over as null.
	const pc = (x: number | null) => (x === null || Number.isNaN(x) ? '  - ' : pct(x).padStart(4));
	const t0 = performance.now();
	await Promise.all(
		Array.from({ length: jobs }, (_, k) => {
			const child = spawn(process.execPath, [script, '--worker', `${k}/${jobs}`, ...pass], {
				stdio: ['ignore', 'pipe', 'inherit']
			});
			let buffer = '';
			child.stdout.on('data', (chunk) => {
				buffer += chunk;
				const lines = buffer.split('\n');
				buffer = lines.pop()!;
				for (const line of lines) {
					if (!line.trim()) continue;
					const r: Result = JSON.parse(line);
					results.push(r);
					if (args.results) appendFileSync(args.results, line + '\n');
					const lv = levels[r.index];
					const tuned = withLate(lv, r.late);
					if (tuned.tuning) lv.tuning = tuned.tuning;
					else delete lv.tuning;
					lv.seed = r.seed;
					if (r.push) lv.push = r.push;
					else delete lv.push;
					if (r.deal) lv.deal = r.deal;
					else delete lv.deal;
					lv.wins = Math.round(r.wins * 100) / 100;
					if (r.tries.length) lv.tries = r.tries.map((t) => Math.round(t * 10) / 10);
					if (!Number.isNaN(r.focus)) lv.focus = Math.round(r.focus * 100) / 100;
					lv.breaks = r.breaks;
					lv.cruxes = r.cruxes;
					lv.spread = r.spread;
					const pips = levelDifficulty(lv) ?? 0;
					const goal = targetTries(lv.difficulty);
					const n = (t: number) => (t > GIVE_UP ? ' X' : t.toFixed(0).padStart(2));
					const p = r.pressure;
					console.log(
						[
							`${String(r.index + 1).padStart(3)} ${r.id.padEnd(22)}`,
							`tries ${r.tries.map(n).join('/')} (target ${[goal.best, goal.typical, goal.worst].map(n).join('/')})`,
							`${(LABELS[pips - 1] ?? '-').padEnd(9)} (${pips})  focus ${pc(r.focus)} [${r.passes}]`,
							`wins ${pc(r.wins)} (strong ${pc(r.strong)} clean ${pc(r.clean)} look ${pc(r.look)} careless ${pc(r.careless)} hasty ${pc(r.hasty)})`,
							`cruxes ${r.cruxes} breaks ${r.breaks} thirds ${r.byThird.join('/')} sequences ${r.sequences >= 1e6 ? 'many' : r.sequences}${r.timing >= 0 ? ` timing ${r.timing}` : ''}`,
							`seed ${String(r.seed).padStart(2)} push ${r.push >= 0 ? '+' : ''}${r.push}${r.late ? ' late' : ''}${r.deal ? ' searched deal' : ''}`,
							`waits ${p.waits}/${p.sends} held groups ${p.heldPairs}`,
							`[${r.detail}]`,
							`screened ${r.screened} searched ${r.searched} in ${(r.ms / 1000).toFixed(0)}s`
						].join('  ')
					);
				}
			});
			return new Promise((done) => child.on('close', done));
		})
	);
	console.log(`tuned ${results.length} levels in ${((performance.now() - t0) / 1000).toFixed(0)}s`);
	if (args.dry) console.log('dry run: level packs left as they were');
	else {
		// Only the tuning changes. The rest of each file stays as written (its mural, its
		// song settings, each level's own song under them), not as loaded with the pack's merged in.
		const tuned = new Set<string>(F.TUNED);
		for (const p of packs) {
			const file = JSON.parse(readFileSync(p.path, 'utf8')) as { levels: F.Level[] };
			file.levels = file.levels.map((raw, k) => {
				const kept = Object.entries(raw).filter(([key]) => !tuned.has(key));
				const set = Object.entries(p.levels[k]).filter(
					([key, v]) => tuned.has(key) && v !== undefined
				);
				return Object.fromEntries([...kept, ...set]) as F.Level;
			});
			await writePack(p.path, file);
		}
	}
}
