// Pick each Forage level's deal so it's about as hard as its place in play order asks for:
//   pnpm -F parlor forage:tune [--seeds 16] [--games 16] [--screen 4] [--climb 80] [--hard-ms 420000] [--jobs 8]
//                              [--only <id>] [--levels 0,5,20] [--dry] [--cruxes-only] [--results <file>]
// Hard has two parts (see src/lib/forage/report.ts and cruxes.ts):
//   - how often a good player wins: the best of a strong player, two that follow the rule
//     of thumb (send a colony that finishes right away), and a careless one, `--games` each
//   - its cruxes: stretches where only some sends win, found with a solver, and its rule
//     breaks, where every send that finishes right away loses. Each place in play order
//     wants a number of them (see want()): none while the game teaches, one in the middle,
//     several spread through the game at the end.
// For each level it deals `--seeds` seeds and screens each with a quick look (`--screen`
// games each, a fast crux search). The closest few then have their deal searched: colonies
// moved between columns (the play and so the way to win stay the same) until the cruxes are
// what the level wants, for up to `--climb` tries. The deals that come out of that are
// measured properly and the closest to the target kept. When nothing lands near it, it
// pushes the tuning harder (or easier) and tries again.
// Writes `seed`, `push`, `deal` (the columns found), the measured win share `wins` and the
// crux counts `breaks`, `cruxes` and `spread` into the level packs; together they set the
// level's difficulty index. `--dry` only prints. `--cruxes-only` keeps each level's deal and
// win share and only measures its cruxes again. Levels are shared out to `--jobs` workers.
// `--results <file>` also appends each level's result to that file as a JSON line, as it
// comes in, so a long run's work isn't lost if it stops early.
import { spawn } from 'node:child_process';
import { appendFileSync } from 'node:fs';
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
import { crux, difficultyIndex, levelDifficulty } from '../src/lib/forage/difficulty.ts';
import * as F from '../src/lib/forage/engine.ts';
import { rememberSends } from '../src/lib/forage/player.ts';
import {
	measure,
	paceProof,
	pressure,
	targetWins,
	UNMEASURED,
	type Difficulty,
	type Pressure
} from '../src/lib/forage/report.ts';
import { hashStr, makeRng } from '../src/lib/shared/engine.ts';
import { LABELS } from '../src/lib/shared/difficulty.ts';
import { pct } from '../src/lib/shared/editor/checks.ts';
import { loadPacks } from '../test/levels.ts';
import { writePack } from './write-pack.ts';

const { values: args } = parseArgs({
	options: {
		seeds: { type: 'string', default: '16' },
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
/**
 * Seeds whose deal gets searched. A deal's win share tends to be all or nothing,
 * so the few that land near the target are worth searching from.
 */
const SEARCHED = 4;
/** Levels from here on are the top tier (the last 20): their timing is checked too (it's slow). */
const TOP = 180;

/** How many cruxes a level wants: at least `min`, at most `max`. */
interface Want {
	min: { real: number; breaks: number; spread: number };
	max: { real: number; breaks: number };
}

/**
 * What a level at this place in play order wants, from the difficulty its target
 * win share asks for: none while the game teaches, a rule break or so in the middle,
 * several spread through the game at the end (more for the top tier).
 */
function want(index: number): Want {
	const pips = difficultyIndex(targetWins(index))!;
	const none = { real: 0, breaks: 0, spread: 0 };
	if (index < 5) return { min: none, max: { real: 0, breaks: 0 } };
	if (pips === 1) return { min: none, max: { real: 1, breaks: 0 } };
	if (pips === 2) return { min: none, max: { real: 2, breaks: 1 } };
	if (pips === 3) return { min: { real: 1, breaks: 1, spread: 1 }, max: { real: 3, breaks: 2 } };
	if (pips === 4) return { min: { real: 2, breaks: 2, spread: 2 }, max: { real: 9, breaks: 9 } };
	if (index >= TOP)
		return { min: { real: 4, breaks: 3, spread: 3 }, max: { real: 99, breaks: 99 } };
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
	index: number;
	id: string;
	seed: number;
	push: number;
	/** Whether it uses late pressure (Tuning.late). */
	late: boolean;
	/** The columns the deal search found, or '' for the seed's own deal. */
	deal: string;
	/** Whether its way to win also wins played hurried (see paceProof()). */
	paced: boolean;
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

function cruxFields(a: Analysis, index: number): CruxFields {
	return {
		...cruxCounts(a),
		byThird: a.byThird,
		sequences: a.sequences,
		timing: index >= TOP ? a.timing : -1,
		detail: describe(a)
	};
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
	const target = targetWins(index);
	const w = want(index);
	const targetPips = difficultyIndex(target)!;
	/** Why a deal is unfair: its way to win loses when played hurried (see paceProof()). */
	const unfair = (s: F.State, a: Analysis) => (a.complete && paceProof(s, a.line) ? 0 : 1);
	/** How far a measured deal is from the level's target: lower is better. */
	const miss = (s: F.State, wins: number, a: Analysis) => {
		const pips = difficultyIndex(wins, cruxCounts(a))!;
		return (
			unfair(s, a) +
			Math.abs(wins - target) +
			(wins > target ? 0.02 : 0) +
			(wins === 0 ? 1 : 0) +
			0.25 * short(a, w) +
			0.15 * Math.abs(pips - targetPips)
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
			const { plan, s } = F.buildWithPlan(level, index, {}, seed);
			const a = analyze(s, FAST);
			out.push({ seed, push, late, plan, s, placement: null, a, quick: measure(s, screen).wins });
			screened++;
		}
		const rough = (c: Candidate) =>
			unfair(c.s, c.a) +
			Math.abs(c.quick - target) +
			// Searching fixes cruxes more easily than it moves the win share.
			0.08 * short(c.a, w) +
			(c.quick === 0 ? 1 : 0);
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
		if (short(c.a, w) === 0 && !harder && !unfair(c.s, c.a)) return [c];
		const rng = makeRng(hashStr(lv.id) + c.seed * 7 + c.push * 131);
		const groups = [...c.plan.groups];
		let place = F.placementOf(c.s);
		/** Whether each linked group is linked in the seed's deal: the search keeps it so. */
		const linkedAt = groups.map(([j, g]) => new Set(place.slice(j, j + g)).size === g);
		let dist = short(c.a, w);
		let hard = hardness(c.a);
		/** Whether the deal it's at is fair; an unfair one gives way to the first fair one found. */
		let fair = !unfair(c.s, c.a);
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
			if (unfair(s, a)) continue;
			const d = short(a, w);
			const h = hardness(a);
			// Closer to the cruxes it wants; at the same distance, harder or easier as it needs.
			const sideways = harder ? h >= hard : h <= hard;
			if (fair && !(d < dist || (d === dist && sideways))) continue;
			const step = !fair || d < dist || h !== hard;
			place = p;
			dist = d;
			hard = h;
			fair = true;
			if (d > 0 || !step) continue;
			// Right cruxes, and a real step: see how often it's won.
			const next = { ...c, s, placement: p, a, quick: measure(s, screen).wins };
			kept.push(next);
			if (harder ? next.quick <= target : next.quick >= target) break;
			if (kept.length > 8) break;
		}
		// The two whose quick look is closest to the target.
		const near = (k: Candidate) => Math.abs(k.quick - target) + short(k.a, w);
		return kept.sort((x, y) => near(x) - near(y)).slice(0, 2);
	};

	interface Best extends Candidate {
		d: Difficulty;
		full: Analysis;
		m: number;
	}
	// Not `: Best | null`, which TS would narrow to null, missing the closures' writes.
	let best = null as Best | null;
	// The quick crux search finds a few more cruxes than are there; rank by the thorough one.
	const consider = (list: Candidate[]) => {
		for (const c of list) {
			const d = measure(c.s, games);
			const full = analyze(c.s, { ...THOROUGH, timing: index >= TOP });
			const m = miss(c.s, d.wins, full);
			if (!best || m < best.m) best = { ...c, d, full, m };
		}
	};
	const tryPush = (push: number) => {
		const ranked = screenSeeds(push);
		for (const c of ranked.slice(0, targetPips >= 4 ? SEARCHED + 1 : SEARCHED)) {
			// Close enough already: don't spend the time on another seed.
			if (best && best.m < 0.08) break;
			consider(climb(c));
		}
	};
	tryPush(0);
	const b0 = best;
	// Far off: push the tuning harder (or easier) and try again.
	if (b0 && b0.m > 0.15) {
		const tooEasy = b0.d.wins > target;
		if (index >= 5 && (tooEasy || index > 40)) tryPush(tooEasy ? 1 : -1);
	}
	const b = best!;
	return {
		index,
		id: lv.id,
		seed: b.seed,
		push: b.push,
		late: b.late,
		deal: b.placement ? b.placement.join('') : '',
		paced: !unfair(b.s, b.full),
		...b.d,
		...cruxFields(b.full, index),
		pressure: pressure(b.s),
		screened,
		searched,
		ms: performance.now() - t0
	};
}

/** The level's saved deal, with only its cruxes measured again. */
function remeasure(index: number): Result {
	const t0 = performance.now();
	const lv = levels[index];
	const s = F.buildPuzzle(lv, index);
	const full = analyze(s, { ...THOROUGH, timing: index >= TOP });
	return {
		index,
		id: lv.id,
		seed: lv.seed ?? 0,
		push: lv.push ?? 0,
		late: !!lv.tuning?.late,
		deal: lv.deal ?? '',
		paced: full.complete && paceProof(s, full.line),
		...UNMEASURED,
		wins: lv.wins ?? NaN,
		...cruxFields(full, index),
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
	const pc = (x: number) => (Number.isNaN(x) ? '  - ' : pct(x).padStart(4));
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
					lv.breaks = r.breaks;
					lv.cruxes = r.cruxes;
					lv.spread = r.spread;
					const pips = levelDifficulty(lv)!;
					const cap = crux(lv);
					const p = r.pressure;
					console.log(
						[
							`${String(r.index + 1).padStart(3)} ${r.id.padEnd(22)}`,
							`target ${pc(targetWins(r.index))}  wins ${pc(r.wins)} (strong ${pc(r.strong)} clean ${pc(r.clean)} look ${pc(r.look)} careless ${pc(r.careless)})`,
							`${LABELS[pips - 1].padEnd(9)} (${pips}, cruxes allow ${cap.least}-${cap.most})`,
							`cruxes ${r.cruxes} breaks ${r.breaks} thirds ${r.byThird.join('/')} sequences ${r.sequences >= 1e6 ? 'many' : r.sequences}${r.timing >= 0 ? ` timing ${r.timing}` : ''}`,
							`seed ${String(r.seed).padStart(2)} push ${r.push >= 0 ? '+' : ''}${r.push}${r.late ? ' late' : ''}${r.deal ? ' searched deal' : ''}`,
							r.paced ? 'paced' : 'LOSES HURRIED',
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
	const hurried = results.filter((r) => !r.paced).map((r) => r.index + 1);
	if (hurried.length) console.log(`their way to win loses played hurried: ${hurried.join(', ')}`);
	if (args.dry) console.log('dry run: level packs left as they were');
	else {
		for (const p of packs) await writePack(p.path, { name: p.name, levels: p.levels });
	}
}
