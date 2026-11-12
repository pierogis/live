// People who retry: play at a person's pace, ask the solver which send doomed a loss, and
// remember the lesson (slow down, or not that send) better each time they're back there.
import { makeRng } from '../shared/engine.ts';
import { Solver, type Budget } from './cruxes.ts';
import * as F from './engine.ts';
import { best, options, style } from './player.ts';

export const LEARNERS = 12;
export const GIVE_UP = 30;
export const LEARN: Budget = { ms: 120_000, playouts: 6, nodes: 40 };

export interface Tries {
	best: number;
	typical: number;
	worst: number;
}

function situation(s: F.State): string {
	const out = s.slots.flatMap((e) => (e ? [e.id] : [])).sort((a, b) => a - b);
	return `${out.join(',')}|${s.columns.map((c) => c.length).join(',')}`;
}

const keenOf = (i: number) => 0.25 + (0.75 * i) / (LEARNERS - 1);

export interface Loss {
	at: number;
	gap: number;
}

export interface Learned {
	attempts: number;
	losses: Loss[];
}

const PACE = { fastest: 10, slowest: 25 };

const RECALL = 0.6;

interface Lesson {
	careful: boolean;
	wrong: Set<number>;
	met: number;
}

function recall(lesson: Lesson | undefined, rng: () => number): Lesson | undefined {
	if (!lesson) return undefined;
	const remembered = rng() < 1 - (1 - RECALL) ** lesson.met;
	lesson.met++;
	return remembered ? lesson : undefined;
}

function settled(s: F.State): F.State {
	const t = F.clone(s);
	F.settle(t);
	return t;
}

export function learnerGame(s0: F.State, solver: Solver, seed: number, keen: number): Learned {
	const losses: Loss[] = [];
	const own = makeRng(seed * 7919 + 13);
	const w = style(own);
	const pace = PACE.fastest + (PACE.slowest - PACE.fastest) * own();
	const lessons = new Map<string, Lesson>();
	const lessonAt = (k: string) => {
		let l = lessons.get(k);
		if (!l) lessons.set(k, (l = { careful: false, wrong: new Set(), met: 0 }));
		l.met++;
		return l;
	};
	for (let attempt = 1; attempt <= GIVE_UP; attempt++) {
		const rng = makeRng(seed * 104729 + attempt * 7919);
		const s = F.clone(s0);
		const path: { s: F.State; col: number }[] = [];
		const mind = new Map<string, Lesson | undefined>();
		while (!F.isWon(s)) {
			const k = situation(s);
			if (!mind.has(k)) mind.set(k, recall(lessons.get(k), rng));
			const lesson = mind.get(k);
			if (lesson?.careful) F.settle(s);
			const next = best(
				options(s).filter((o) => !lesson?.wrong.has(o.col)),
				rng,
				w
			);
			if (!next) {
				if (F.isQuiet(s)) break;
				F.tick(s);
				continue;
			}
			path.push({ s: F.clone(s), col: next.col });
			F.hurry(s, next.col, Math.round(pace * (0.7 + 0.6 * rng())));
		}
		if (F.isWon(s)) return { attempts: attempt, losses };
		if (!path.length) break;
		const after = (j: number) => (j + 1 < path.length ? path[j + 1].s : s);
		let doomed = path.findIndex((_, j) => solver.canWin(settled(after(j))) === false);
		if (doomed < 0) doomed = path.length - 1;
		losses.push({ at: doomed, gap: path.length - doomed });
		let blamed = doomed;
		if (rng() >= keen && doomed < path.length - 1) {
			blamed = doomed + 1 + Math.floor(rng() * (path.length - 1 - doomed));
		}
		const { s: before, col } = path[blamed];
		const lesson = lessonAt(situation(before));
		const calm = settled(before);
		const r = F.pick(calm, col);
		if (!lesson.careful && r.ok && solver.canWin(calm) === true) lesson.careful = true;
		else lesson.wrong.add(col);
	}
	return { attempts: GIVE_UP + 1, losses };
}

function quantile(xs: number[], q: number): number {
	const at = q * (xs.length - 1);
	const lo = Math.floor(at);
	return xs[lo] + (xs[Math.min(xs.length - 1, lo + 1)] - xs[lo]) * (at - lo);
}

const PASS_SPAN = 4;
const VISIBLE = 6;
const MAIN = 0.1;

export interface Pass {
	from: number;
	to: number;
	share: number;
	gap: number;
	learnable: boolean;
}

export interface Expression {
	passes: Pass[];
	focus: number;
	losses: number;
}

const median = (xs: number[]) =>
	quantile(
		[...xs].sort((a, b) => a - b),
		0.5
	);

export function expression(losses: Loss[]): Expression {
	if (!losses.length) return { passes: [], focus: 1, losses: 0 };
	let left = losses;
	const passes: Pass[] = [];
	while (left.length) {
		let start = 0;
		let most = 0;
		for (const { at } of left) {
			const n = left.filter((l) => l.at >= at && l.at < at + PASS_SPAN).length;
			if (n > most) [start, most] = [at, n];
		}
		if (most / losses.length < MAIN) break;
		const inside = left.filter((l) => l.at >= start && l.at < start + PASS_SPAN);
		left = left.filter((l) => l.at < start || l.at >= start + PASS_SPAN);
		const gap = median(inside.map((l) => l.gap));
		passes.push({
			from: Math.min(...inside.map((l) => l.at)),
			to: Math.max(...inside.map((l) => l.at)),
			share: inside.length / losses.length,
			gap,
			learnable: gap <= VISIBLE
		});
	}
	const focus = passes.filter((p) => p.learnable).reduce((a, p) => a + p.share, 0);
	return { passes, focus, losses: losses.length };
}

export function learn(
	s: F.State,
	budget: Budget = LEARN
): { tries: Tries; expression: Expression } {
	const solver = new Solver(budget);
	if (s.intended) solver.know(s, s.intended);
	const runs = Array.from({ length: LEARNERS }, (_, i) => learnerGame(s, solver, i + 1, keenOf(i)));
	const all = runs.map((r) => r.attempts).sort((a, b) => a - b);
	return {
		tries: { best: quantile(all, 0.2), typical: quantile(all, 0.5), worst: quantile(all, 0.8) },
		expression: expression(runs.flatMap((r) => r.losses))
	};
}

export function triesOf(s: F.State, budget: Budget = LEARN): Tries {
	return learn(s, budget).tries;
}
