import type { Cruxes } from './difficulty.ts';
import * as F from './engine.ts';
import { options, playAs, type Choice, type Player } from './player.ts';

export interface Budget {
	ms: number;
	playouts: number;
	nodes: number;
	timing?: boolean;
}

export const THOROUGH: Budget = { ms: 90_000, playouts: 6, nodes: 40 };

export type Kind = 'park' | 'choice' | 'linked' | 'lock' | 'order';

export interface Position {
	step: number;
	eaten: number;
	legal: number;
	wins: number;
	ways: number;
	clean: number;
	cleanWins: number;
	unsure: number;
	col: number;
	ants: number;
	kind: Kind | null;
	broke: 'park' | 'choice' | null;
	trap: boolean;
}

export interface Crux {
	from: number;
	size: number;
	orderings: number;
	tightness: number;
	kinds: Kind[];
	tiny: boolean;
	traps: number;
}

export interface Analysis {
	positions: Position[];
	line: number[];
	cruxes: Crux[];
	real: number;
	breaks: number;
	choices: number;
	byThird: [number, number, number];
	spread: number;
	kinds: number;
	sequences: number;
	timing: number;
	unsure: number;
	complete: boolean;
	ms: number;
}

export function cruxCounts(a: Analysis): Required<Cruxes> {
	return { breaks: a.breaks, cruxes: a.real, spread: a.spread };
}

const TIGHT = 0.4;
const MANY = 1e6;

export function stateKey(s: F.State): string {
	let k = '';
	for (const col of s.columns) k += col.length + ',';
	k += '|';
	for (const e of s.slots) k += e ? `${e.id}:${e.n},` : '-,';
	return `${k}|${F.blocksKey(s)}`;
}

export class Solver {
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

function antsAt(s: F.State, col: number): number {
	const e = s.columns[col][0];
	return e.link === undefined ? e.n : Math.max(...F.groupOf(s, e.link).map((g) => g.n));
}

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
		if (p.ways === 1 && p.ants <= 2) cur.tiny = true;
	});
	return cruxes;
}

export function isReal(c: Crux): boolean {
	return c.tightness >= TIGHT && c.traps > 0 && !(c.tiny && c.size === 1);
}

function timingPoints(boards: F.State[], line: number[], solver: Solver): number {
	let n = 0;
	for (let j = 1; j < line.length && !solver.late; j++) {
		const t = F.clone(boards[j - 1]);
		if (!F.hurry(t, line[j - 1], 2)) continue;
		if (F.isWon(t) || !F.legalPicks(t).includes(line[j])) continue;
		if (!F.pick(t, line[j]).ok) continue;
		if (solver.canWin(t) !== true) n++;
	}
	return n;
}
