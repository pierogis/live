/*
 * People who retry. A person who loses a Forage level plays it again, remembering
 * where it went wrong, so how hard a level feels is how many attempts it takes to win,
 * not how often one fresh game wins.
 *
 * A learner picks its sends like the strong player (player.ts), with its own style,
 * but plays at a person's pace: a tap every second or two (`PACE`), while the ants
 * of earlier sends are still eating, waiting only when nothing can go. When it loses,
 * it works out which send doomed it: the solver (cruxes.ts) says the first after which
 * the board can't be won, even by stopping to let it settle. Then it learns, the way a
 * person does:
 *   - a timing mistake (that send would have done if it had let the board settle
 *     first) teaches it to slow down there: next time it waits for the board, then sends
 *   - a wrong send teaches it not to make that send there
 * It remembers each lesson by situation (which colonies are out, how far down each
 * column is), so it carries over when the sends before come in another order. Memory
 * builds up the way a person's does: a new lesson comes back to mind at its moment only
 * some of the time (`RECALL`), and every time the learner reaches that moment again it
 * sticks harder, until it's nearly sure. The opening is played every attempt, so its
 * lessons firm up fast; a lesson far into the level is rehearsed only when the learner
 * gets that far, so it stays shaky longer. Forgetting one means making the mistake again,
 * which teaches it again. Learners differ the way people do:
 *   - keenness: a keen learner blames the send that doomed it; otherwise it blames a
 *     later one, between that send and the jam, and wastes the attempt. Mistakes made
 *     long before the jam cost the less keen more.
 *   - pace: some tap faster than others, and no two taps are the same
 *   - luck: each attempt breaks near-ties and keeps time afresh, so a learner can
 *     stumble onto the right path, or off it.
 * A level that needs exact timing at many points takes many attempts, so the tuner
 * passes it over; one moment where you must wait is a crux like any other.
 * `LEARNERS` learners, from not keen to very keen, each up to `GIVE_UP` attempts, give
 * a spread: the sharp and lucky (`best`), the typical, and the worst.
 * Imports use `.ts` so node scripts can load this file directly.
 */
import { makeRng } from '../shared/engine.ts';
import { Solver, type Budget } from './cruxes.ts';
import * as F from './engine.ts';
import { best, options, style } from './player.ts';

/** Learners per level. */
export const LEARNERS = 12;
/** Attempts before a learner gives up; one that does counts as one more than this. */
export const GIVE_UP = 30;
/** The solver's budget for one level's learners: they share what it finds. */
export const LEARN: Budget = { ms: 120_000, playouts: 6, nodes: 40 };

/** How many attempts it took, across a level's learners. */
export interface Tries {
	/** The sharp and lucky: the 20th percentile. */
	best: number;
	/** The median. */
	typical: number;
	/** The 80th percentile. */
	worst: number;
}

/**
 * A board as a person recalls it, to learn from: which colonies are out in the slots
 * and how far down each column is, not exactly what food is left. The same colonies
 * sent in another order is the same situation, so a lesson carries over to it.
 */
function situation(s: F.State): string {
	const out = s.slots.flatMap((e) => (e ? [e.id] : [])).sort((a, b) => a - b);
	return `${out.join(',')}|${s.columns.map((c) => c.length).join(',')}`;
}

/** Keenness of learner `i` of `LEARNERS`: from 0.25 (blames the wrong send most times) to 1. */
const keenOf = (i: number) => 0.25 + (0.75 * i) / (LEARNERS - 1);

/** One lost attempt: where it was doomed, and how long until it showed. */
export interface Loss {
	/** Sends made before the send that doomed it. */
	at: number;
	/** Sends from that one until the jam: how far back the mistake was when it showed. */
	gap: number;
}

/** How one learner did. */
export interface Learned {
	/** Attempts to win, up to `GIVE_UP` (one more when it gave up). */
	attempts: number;
	/** Each attempt it lost. */
	losses: Loss[];
}

/** Ticks (0.1s each) between a learner's taps: from one a second to one every 2.5 seconds. */
const PACE = { fastest: 10, slowest: 25 };

/**
 * How likely a lesson met once comes back to mind at its moment. Each time the learner
 * is back at that moment (or learns it again), the chance it's forgotten is that much
 * less again: 60%, then 84%, 94%, 97%.
 */
const RECALL = 0.6;

/** What a learner has learned at one situation. */
interface Lesson {
	/** Wait for the board to settle before sending here. */
	careful: boolean;
	/** Sends that lose here. */
	wrong: Set<number>;
	/** Times it has met this lesson: learning it, or being back at its moment. */
	met: number;
}

/** Whether a lesson comes to mind now; being back at its moment makes it stick harder. */
function recall(lesson: Lesson | undefined, rng: () => number): Lesson | undefined {
	if (!lesson) return undefined;
	const remembered = rng() < 1 - (1 - RECALL) ** lesson.met;
	lesson.met++;
	return remembered ? lesson : undefined;
}

/** A copy of s let settle: what a patient player could still do from it. */
function settled(s: F.State): F.State {
	const t = F.clone(s);
	F.settle(t);
	return t;
}

/**
 * How one learner does from s0. `keen` is its chance of blaming the send that really
 * doomed it.
 */
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
		/** Each send: the board just before it, and where it came from. */
		const path: { s: F.State; col: number }[] = [];
		/** What came to mind at each moment this attempt: once a moment, however long it waits there. */
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
				// Nothing it would send: wait for the board, unless nothing more will happen.
				if (F.isQuiet(s)) break;
				F.tick(s);
				continue;
			}
			path.push({ s: F.clone(s), col: next.col });
			F.hurry(s, next.col, Math.round(pace * (0.7 + 0.6 * rng())));
		}
		if (F.isWon(s)) return { attempts: attempt, losses };
		if (!path.length) break;
		// The send that doomed it: the first after which the board can't be won, even by
		// stopping to let it settle. When the solver can't tell, the last send.
		const after = (j: number) => (j + 1 < path.length ? path[j + 1].s : s);
		let doomed = path.findIndex((_, j) => solver.canWin(settled(after(j))) === false);
		if (doomed < 0) doomed = path.length - 1;
		losses.push({ at: doomed, gap: path.length - doomed });
		// A less keen learner blames a later send, between that one and the jam.
		let blamed = doomed;
		if (rng() >= keen && doomed < path.length - 1) {
			blamed = doomed + 1 + Math.floor(rng() * (path.length - 1 - doomed));
		}
		const { s: before, col } = path[blamed];
		const lesson = lessonAt(situation(before));
		// Too quick, or the wrong send? The same send after letting the board settle says.
		const calm = settled(before);
		const r = F.pick(calm, col);
		if (!lesson.careful && r.ok && solver.canWin(calm) === true) lesson.careful = true;
		else lesson.wrong.add(col);
	}
	return { attempts: GIVE_UP + 1, losses };
}

/** The value `q` (0 to 1) of the way through sorted `xs`, between neighbors. */
function quantile(xs: number[], q: number): number {
	const at = q * (xs.length - 1);
	const lo = Math.floor(at);
	return xs[lo] + (xs[Math.min(xs.length - 1, lo + 1)] - xs[lo]) * (at - lo);
}

/** The most sends a pass spans: one thing to learn. */
const PASS_SPAN = 4;
/** The most sends a learnable pass's mistakes take to show (the median), so you can see what went wrong. */
const VISIBLE = 6;
/** The least share of a level's losses a pass holds; losses outside passes are spread thin. */
const MAIN = 0.1;

/** A stretch of play where learners keep getting doomed. */
export interface Pass {
	/** First and last send (sends made before) its losses were doomed at. */
	from: number;
	to: number;
	/** Share of all the level's losses doomed in it. */
	share: number;
	/** The median sends until its mistakes showed. */
	gap: number;
	/** Its mistakes show soon (`VISIBLE`): something you learn, not grind. */
	learnable: boolean;
}

/**
 * Where a level's attempts go: its losses grouped into passes, the busiest stretches of
 * `PASS_SPAN` sends, each holding at least `MAIN` of them. Difficulty from a few such
 * passes, each soon seen, is a crux you learn; losses spread thin, or doomed long before
 * they show, are grinding.
 */
export interface Expression {
	passes: Pass[];
	/** Share of the losses in learnable passes; 1 with no losses. */
	focus: number;
	losses: number;
}

const median = (xs: number[]) =>
	quantile(
		[...xs].sort((a, b) => a - b),
		0.5
	);

/** Group losses into passes, busiest first: take the busiest window of sends left, again and again. */
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

/** How `LEARNERS` learners do on a deal: how many attempts, and where they lost. */
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

/** How many attempts `LEARNERS` learners take to win a deal. */
export function triesOf(s: F.State, budget: Budget = LEARN): Tries {
	return learn(s, budget).tries;
}
