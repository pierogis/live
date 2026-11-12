/*
 * Where a Forage deal is hard: its cruxes, measured with a solver.
 *
 * Walk one winning line. At each position, try every send and ask the solver
 * which ones still win. Sends whose order doesn't matter (either order gives the
 * same board) count as one choice. A position is constrained when some send
 * loses; a crux is a run of constrained positions in a row. Between cruxes,
 * every send wins: you can play on autopilot.
 *
 * Each crux has:
 *   - its size: how many sends in a row have a wrong choice
 *   - its orderings: how many ways through it win (1 = one exact sequence)
 *   - its tightness: the chance a send picked at random at each step goes wrong
 *   - its kind (see Kind)
 * A rule break is a position where the rule of thumb fails: every send that
 * would finish right away loses, so you must park a colony that waits ('park');
 * or you have to park, and most of the parks lose ('choice'). A trap is a rule
 * break, or a send that finishes right away and still loses. A crux counts as
 * real only with a trap in it: one whose only wrong sends are parks is no
 * trouble for anyone who parks only when they must.
 *
 * One crux is one "aha": once seen, the rest is easy. Hard deals have several,
 * spread through the game (see spread). The line follows the rule of thumb
 * where it can: it sends a colony that finishes whenever one still wins, so it
 * counts only the rule breaks you can't avoid.
 *
 * Timing (top levels only, it's slow): the game runs on a clock and lets you
 * send while others are still eating. A hurried send can take food a colony
 * already out was going to eat. `timing` counts the line's sends that only win
 * if you wait for the board to settle first.
 *
 * The solver: playouts by the players in player.ts first (a win proves a
 * position winnable, and every position along it), then a small depth-first
 * search. Both have budgets; a position neither settles counts as a loss, and as
 * `unsure`. Positions are remembered, so the line reuses what playouts found.
 * Imports use `.ts` so node scripts can load this file directly.
 */
import type { Cruxes } from './difficulty.ts';
import * as F from './engine.ts';
import { options, playAs, type Choice, type Player } from './player.ts';

/** How hard the solver tries. */
export interface Budget {
	/** Give up on the whole walk after this long; the counts so far stand. */
	ms: number;
	/** Playouts per position before searching. */
	playouts: number;
	/** Positions a search may expand. */
	nodes: number;
	/** Check timing too. */
	timing?: boolean;
}

/** For forage:tune and `pnpm levels --measure`. */
export const THOROUGH: Budget = { ms: 90_000, playouts: 6, nodes: 40 };

/**
 * What a crux asks of you:
 *   park: send a colony that will wait while ones that finish are around
 *   choice: you have to park, and most parks lose
 *   linked: the right send is a linked group that sits held
 *   lock: the right send opens a lock, or digs toward its key
 *   order: which of the sends that finish, or in what order
 */
export type Kind = 'park' | 'choice' | 'linked' | 'lock' | 'order';

export interface Position {
	/** Sends made before it. */
	step: number;
	/** Share of the food eaten before it, 0 to 1. */
	eaten: number;
	/** Sends that can go. */
	legal: number;
	/** Of those, ones that still win. */
	wins: number;
	/** Winning sends, counting ones whose order doesn't matter as one. */
	ways: number;
	/** Sends that finish right away, and how many of those still win. */
	clean: number;
	cleanWins: number;
	/** Sends the solver couldn't settle (counted as losses). */
	unsure: number;
	/** The column the line sent. */
	col: number;
	/** Ants in the colony it sent (the most in its group, for a linked one). */
	ants: number;
	kind: Kind | null;
	/** The rule of thumb fails here (see the top). */
	broke: 'park' | 'choice' | null;
	/** A rule break, or a send that finishes right away loses. */
	trap: boolean;
}

export interface Crux {
	/** Index into positions of its first. */
	from: number;
	size: number;
	/** Ways through it that win: the product of each position's ways. */
	orderings: number;
	/** Chance random sends go wrong somewhere in it, 0 to 1. */
	tightness: number;
	kinds: Kind[];
	/** Its key send is a colony of 1 or 2 ants: one memorable choke point. */
	tiny: boolean;
	/** Positions in it where the rule of thumb can go wrong (see Position.trap). */
	traps: number;
}

export interface Analysis {
	positions: Position[];
	/** The line it walked, as columns. */
	line: number[];
	cruxes: Crux[];
	/** Cruxes that matter: tight (tightness ≥ TIGHT), with a trap, not a lone tiny choke point. */
	real: number;
	/** Rule breaks: 'park' and 'choice' positions. */
	breaks: number;
	/** Of those, ones where most parks lose too: parking at random won't do. */
	choices: number;
	/** Real cruxes in each third of the game, by food eaten when they start. */
	byThird: [number, number, number];
	/** Thirds of the game with a real crux in them: 0 to 3. */
	spread: number;
	/** Distinct kinds among the real cruxes. */
	kinds: number;
	/**
	 * Ways through the real cruxes: the product of their orderings (capped). 1 is
	 * one exact sequence through every one; the free sends between them don't count.
	 */
	sequences: number;
	/** Sends that lose if made before the board settles (only with Budget.timing). */
	timing: number;
	/** Positions the solver couldn't settle. */
	unsure: number;
	/** Whether it reached the end of a win in time. */
	complete: boolean;
	ms: number;
}

/** What difficulty.ts reads from an analysis. */
export function cruxCounts(a: Analysis): Required<Cruxes> {
	return { breaks: a.breaks, cruxes: a.real, spread: a.spread };
}

/** A crux this tight or more counts as real. */
const TIGHT = 0.4;
/** The cap on counted orderings. */
const MANY = 1e6;

/** A board's identity: columns, slots and food left. */
function stateKey(s: F.State): string {
	let k = '';
	for (const col of s.columns) k += col.length + ',';
	k += '|';
	for (const e of s.slots) k += e ? `${e.id}:${e.n},` : '-,';
	return `${k}|${F.blocksKey(s)}`;
}

/** Remembers which boards win; shared by every question in one walk. */
class Solver {
	known = new Map<string, boolean>();
	until: number;
	unsure = 0;
	budget: Budget;
	constructor(budget: Budget, start = performance.now()) {
		this.budget = budget;
		this.until = start + budget.ms;
	}

	get late(): boolean {
		return performance.now() > this.until;
	}

	/** Whether s can still be won: true, false, or null when it couldn't tell. */
	canWin(s: F.State): boolean | null {
		if (F.isWon(s)) return true;
		const k = stateKey(s);
		const hit = this.known.get(k);
		if (hit !== undefined) return hit;
		if (!F.legalPicks(s).length) {
			this.known.set(k, false);
			return false;
		}
		if (this.late) return null;
		// Cheap players first: most boards that win, they win.
		const players: Player[] = ['clean', 'careless', 'look', 'strong'];
		for (let r = 0; r < this.budget.playouts; r++) {
			if (this.playout(s, players[r % players.length], 101 + r * 31)) {
				this.known.set(k, true);
				return true;
			}
			if (this.late) return null;
		}
		let left = this.budget.nodes;
		const found = this.search(s, () => left-- > 0);
		if (found === null) this.unsure++;
		return found;
	}

	/** Mark every board along `path` from s, a known win (like a deal's built-in play). */
	know(s: F.State, path: number[]) {
		const seen: string[] = [stateKey(s)];
		let t = s;
		for (const col of path) {
			t = F.clone(t);
			if (!F.pick(t, col).ok) return;
			seen.push(stateKey(t));
		}
		if (F.isWon(t)) for (const k of seen) this.known.set(k, true);
	}

	/** One game by `player`; a win marks every board along it. */
	private playout(s: F.State, player: Player, seed: number): boolean {
		const seen: string[] = [];
		let ends: boolean | undefined;
		const g = playAs(player, s, seed, (t) => {
			const k = stateKey(t);
			const hit = this.known.get(k);
			if (hit !== undefined) {
				ends = hit;
				return true;
			}
			seen.push(k);
			return false;
		});
		const won = ends ?? g.won;
		if (won) for (const k of seen) this.known.set(k, true);
		return won;
	}

	/** Depth first, sends that finish, open locks and eat most first; null when it ran out of room. */
	private search(s: F.State, room: () => boolean): boolean | null {
		if (F.isWon(s)) return true;
		const k = stateKey(s);
		const hit = this.known.get(k);
		if (hit !== undefined) return hit;
		if (this.late || !room()) return null;
		const opts = options(s).sort(
			(a, b) => +a.parked - +b.parked || b.unlocked - a.unlocked || b.eaten - a.eaten
		);
		let open = false;
		for (const o of opts) {
			const r = this.search(o.t, room);
			if (r) {
				this.known.set(k, true);
				return true;
			}
			if (r === null) open = true;
		}
		if (open) return null;
		this.known.set(k, false);
		return false;
	}
}

/** Group winning sends whose order doesn't matter: either order gives the same board. */
function ways(wins: Choice[]): number {
	const group = wins.map((_, i) => i);
	const root = (i: number): number => (group[i] === i ? i : (group[i] = root(group[i])));
	const after = (o: Choice, col: number) => {
		const t = F.clone(o.t);
		return F.pick(t, col).ok ? stateKey(t) : null;
	};
	for (let i = 0; i < wins.length; i++) {
		for (let j = i + 1; j < wins.length; j++) {
			if (root(i) === root(j)) continue;
			const ab = after(wins[i], wins[j].col);
			if (ab !== null && ab === after(wins[j], wins[i].col)) group[root(j)] = root(i);
		}
	}
	return new Set(wins.map((_, i) => root(i))).size;
}

/** Ants in the colony (or the most in its linked group) sent from col. */
function antsAt(s: F.State, col: number): number {
	const e = s.columns[col][0];
	return e.link === undefined ? e.n : Math.max(...F.groupOf(s, e.link).map((g) => g.n));
}

/** Walk a winning line and find its cruxes; see the top of the file. */
export function analyze(s0: F.State, budget: Budget = THOROUGH): Analysis {
	const t0 = performance.now();
	const solver = new Solver(budget, t0);
	solver.know(s0, s0.intended ?? []);
	const total = Math.max(1, F.blocksLeft(s0));
	const positions: Position[] = [];
	const boards: F.State[] = [];
	const line: number[] = [];
	let s = s0;
	let complete = true;
	while (!F.isWon(s)) {
		const opts = options(s);
		const verdicts = opts.map((o) => solver.canWin(o.t));
		const wins = opts.filter((_, i) => verdicts[i] === true);
		if (!wins.length || solver.late) {
			complete = false;
			break;
		}
		const clean = opts.filter((o) => !o.parked);
		const cleanWins = wins.filter((o) => !o.parked);
		const parks = opts.length - clean.length;
		const parkWins = wins.length - cleanWins.length;
		const broke: Position['broke'] =
			clean.length && !cleanWins.length
				? 'park'
				: !clean.length && parks >= 2 && parkWins / parks < 0.5
					? 'choice'
					: null;
		// The rule of thumb where it still wins; otherwise a park that wins.
		const next = cleanWins[0] ?? wins[0];
		const front = s.columns[next.col][0];
		const linked = front.link !== undefined && next.parked;
		const kind: Kind | null =
			wins.length === opts.length
				? null
				: linked
					? 'linked'
					: broke
						? broke
						: next.unlocked
							? 'lock'
							: 'order';
		positions.push({
			step: line.length,
			eaten: 1 - F.blocksLeft(s) / total,
			legal: opts.length,
			wins: wins.length,
			ways: wins.length === opts.length ? wins.length : ways(wins),
			clean: clean.length,
			cleanWins: cleanWins.length,
			unsure: verdicts.filter((v) => v === null).length,
			col: next.col,
			ants: antsAt(s, next.col),
			kind,
			broke,
			trap: !!broke || cleanWins.length < clean.length
		});
		boards.push(s);
		line.push(next.col);
		s = next.t;
	}
	const cruxes = findCruxes(positions);
	const real = cruxes.filter(isReal);
	const byThird: [number, number, number] = [0, 0, 0];
	for (const c of real) byThird[Math.min(2, Math.floor(positions[c.from].eaten * 3))]++;
	let sequences = 1;
	for (const c of real) sequences = Math.min(MANY, sequences * c.orderings);
	const timing = budget.timing && complete ? timingPoints(boards, line, solver) : 0;
	return {
		positions,
		line,
		cruxes,
		real: real.length,
		breaks: positions.filter((p) => p.broke).length,
		choices: positions.filter((p) => p.broke && p.wins / p.legal < 0.5).length,
		byThird,
		spread: byThird.filter(Boolean).length,
		kinds: new Set(real.flatMap((c) => c.kinds)).size,
		sequences,
		timing,
		unsure: solver.unsure,
		complete,
		ms: performance.now() - t0
	};
}

/** Runs of positions in a row where some send loses. */
function findCruxes(positions: Position[]): Crux[] {
	const cruxes: Crux[] = [];
	let cur: Crux | null = null;
	let pass = 1;
	positions.forEach((p, i) => {
		if (!p.kind) {
			cur = null;
			return;
		}
		if (!cur) {
			cur = { from: i, size: 0, orderings: 1, tightness: 0, kinds: [], tiny: false, traps: 0 };
			pass = 1;
			cruxes.push(cur);
		}
		cur.size++;
		cur.orderings = Math.min(MANY, cur.orderings * Math.max(1, p.ways));
		pass *= p.wins / p.legal;
		cur.tightness = 1 - pass;
		if (!cur.kinds.includes(p.kind)) cur.kinds.push(p.kind);
		if (p.trap) cur.traps++;
		// A forced send (one way through) of a colony of 1 or 2 ants: a choke point.
		if (p.ways === 1 && p.ants <= 2) cur.tiny = true;
	});
	return cruxes;
}

/**
 * A crux that matters: tight, with a trap for the rule of thumb in it, and not
 * just one tiny colony to spot. A single forced send of 1 or 2 ants is one
 * choke point, easy once seen.
 */
export function isReal(c: Crux): boolean {
	return c.tightness >= TIGHT && c.traps > 0 && !(c.tiny && c.size === 1);
}

/** Sends on the line that lose if made while the previous send is still eating. */
function timingPoints(boards: F.State[], line: number[], solver: Solver): number {
	let n = 0;
	for (let j = 1; j < line.length && !solver.late; j++) {
		const t = F.clone(boards[j - 1]);
		// The previous send goes out, and two ticks later (its colony still eating) this one.
		if (!F.hurry(t, line[j - 1], 2)) continue;
		if (F.isWon(t) || !F.legalPicks(t).includes(line[j])) continue;
		if (!F.pick(t, line[j]).ok) continue;
		if (solver.canWin(t) !== true) n++;
	}
	return n;
}
