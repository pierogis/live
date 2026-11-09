/*
 * A strong Forage player, to measure how hard a deal is the way a careful person
 * finds it. Random play loses by sending colonies that obviously can't eat; a
 * person doesn't, so random win rates make every level look harder than it is.
 *
 * Each turn it tries every column it could send (a patient pick: send, then wait
 * until nothing more eats) and scores where that leaves the board:
 *   - a send that leaves no move at all loses, and when slots run low it looks a
 *     move or two further, so it doesn't walk into a jam it could see coming
 *   - free slots are worth a lot, and more the fewer there are
 *   - so is having a few columns it can send from: it doesn't empty the one
 *     open column while the other fronts are locked or waiting on a partner
 *   - and having a front or two that would finish right away: it sends some
 *     waiting colonies while easy ones are still around to open food for them,
 *     instead of using up the easy ones first
 *   - a colony left waiting costs more the more ants it still has and the deeper
 *     its color's food is buried, so it doesn't send a big colony early while its
 *     color is still mostly sealed off
 *   - a finished colony held in its slot by its linked partner costs a slot
 *   - opening a lock, or digging toward its key, is worth something
 *   - eating is progress
 * Each game weighs these a little differently, the way people do, and picks at
 * random among moves scoring close to the best, so many games give a win share.
 * It sees every colony a person sees. Looking ahead plays sends out, so it can
 * learn a mystery colony's color one send early: a small edge a person lacks.
 * It doesn't back up and retry; the solver in cruxes.ts does.
 * Imports use `.ts` so node scripts can load this file directly.
 */
import { makeRng, pickOne, type Rng } from '../shared/engine.ts';
import * as F from './engine.ts';

/** How a game went. */
export interface Game {
	won: boolean;
	/** The columns it sent from, in order. */
	path: number[];
}

/** What a few free slots are worth: losing the last ones hurts most. */
const FREE = [0, -30, -12, -4, -1, 0];
/** Moves that score within this of the best are treated as equally good. */
const MARGIN = 2;

/**
 * How much a player cares about each thing it scores. People weigh these
 * differently, so each game jitters them a little (see style()).
 */
interface Style {
	/** Times FREE. */
	free: number;
	/** Per colony left waiting. */
	wait: number;
	/** Per ant a waiting colony still has. */
	ants: number;
	/** Per block its color's nearest food is buried under (up to 10). */
	buried: number;
	/** Per finished colony held in its slot by its partner. */
	held: number;
	/** Per block eaten. */
	eat: number;
	/** Per column unlocked. */
	unlock: number;
	/** Per column it could send from next (up to 3): keeping options open. */
	choice: number;
	/**
	 * Per column whose front could finish right away (up to 2): an easy send kept
	 * for later, so it doesn't use them all up and then have only waiting ones left.
	 */
	ready: number;
	/** Per block a lock's key is buried under (up to 20). */
	key: number;
	/**
	 * 0 to 1: how much less a waiting colony costs while slots are free. Some people
	 * park colonies early, while there's room and food is still opening up; others
	 * hold them back until they have to.
	 */
	early: number;
}

const STYLE: Style = {
	free: 1,
	wait: 3,
	ants: 0.15,
	buried: 1.5,
	held: 4,
	eat: 0.03,
	unlock: 6,
	choice: 3,
	ready: 4,
	key: 0.5,
	early: 0.5
};

/** This game's weights: each one 0.6 to 1.4 times the usual, and any eagerness to park. */
function style(rng: Rng): Style {
	const s = { ...STYLE };
	for (const k of Object.keys(s) as (keyof Style)[]) s[k] *= 0.6 + 0.8 * rng();
	s.early = rng();
	return s;
}

function freeSlots(s: F.State): number {
	return s.slots.filter((e) => !e).length;
}

/** Whether some sequence of `depth` sends from s doesn't run out of moves first. */
function survives(s: F.State, depth: number): boolean {
	if (F.isWon(s)) return true;
	const legal = F.legalPicks(s);
	if (!legal.length) return false;
	if (depth <= 0) return true;
	// A shortcut: with four slots free and two columns to send from, call the next send
	// safe. Most sends take one or two slots; only a linked group of three or four could jam.
	if (freeSlots(s) >= 4 && legal.length >= 2 && depth <= 1) return true;
	const key = boardKey(s);
	for (const col of legal) {
		const sent = sendFrom(s, col, key);
		if (sent && survives(sent.t, depth - 1)) return true;
	}
	return false;
}

/** How good the board looks after a pick that ate `eaten` blocks and opened `unlocked` columns. */
function score(t: F.State, eaten: number, unlocked: number, w: Style): number {
	if (F.isWon(t)) return 1e6;
	const free = freeSlots(t);
	const legal = F.legalPicks(t);
	const choices = legal.length;
	// The fewer slots or columns are left to send from, the further it looks for a jam.
	const ahead = free <= 1 || choices <= 1 ? 2 : free === 2 ? 1 : 0;
	if (!survives(t, ahead)) return -1e6;
	let v =
		w.free * FREE[free] + w.choice * Math.min(3, choices) + w.eat * eaten + w.unlock * unlocked;
	// Fronts whose color has as much exposed as they want: about what finishes right away.
	const food = t.colors.map((_, c) => F.exposedOf(t, c).length);
	const ready = legal.filter((k) => {
		const e = t.columns[k][0];
		return e.n <= food[e.c];
	}).length;
	v += w.ready * Math.min(2, ready);
	// Parking costs less while slots are free, the more eager this player is to park.
	const parking = 1 - w.early * (free / t.slots.length);
	for (const e of t.slots) {
		if (!e) continue;
		if (F.isDone(e)) v -= w.held * parking;
		else v -= parking * (w.wait + w.ants * e.n + w.buried * Math.min(10, buriedOf(t)[e.c]));
	}
	const out = F.outside(t);
	t.locks.forEach((key, k) => {
		if (key >= 0 && F.hasLock(t, k, out)) {
			v -= w.key * Math.min(20, F.digDepth(t)[key]);
		}
	});
	return v;
}

/** buriedOf() for each board's digDepth() array. */
const buriedCache = new WeakMap<Int32Array, Int32Array>();

/** Per color: blocks to eat before it has food exposed. */
function buriedOf(t: F.State): Int32Array {
	const depth = F.digDepth(t);
	const hit = buriedCache.get(depth);
	if (hit) return hit;
	const nearest = new Int32Array(t.colors.length).fill(1 << 30);
	for (let i = 0; i < t.target.length; i++) {
		const k = t.target[i];
		if (k >= 0 && t.alive[i] && depth[i] < nearest[k]) nearest[k] = depth[i];
	}
	buriedCache.set(depth, nearest);
	return nearest;
}

/** One send from a board, played out patiently. */
export interface Choice {
	col: number;
	/** The board after sending it. */
	t: F.State;
	/** Whether it left a colony waiting. */
	parked: boolean;
	/** Blocks eaten and columns opened by the send. */
	eaten: number;
	unlocked: number;
}

/**
 * Every send that can go from s, each played out patiently. The boards it
 * returns are shared (see sendFrom()): read them, or clone before changing one.
 */
export function options(s: F.State): Choice[] {
	const out: Choice[] = [];
	const key = boardKey(s);
	for (const col of F.legalPicks(s)) {
		const sent = sendFrom(s, col, key);
		if (sent) out.push({ col, ...sent });
	}
	return out;
}

/** What a patient send does: the board after it, and what happened on the way. */
type Sent = Omit<Choice, 'col'>;

/**
 * Sends already played out, by board and column, most recently used last. The
 * players and the solver come back to the same boards again and again (every
 * game starts from the deal, and nearby boards are many sends' look ahead), and
 * playing a send out is most of their work. Kept to the last `remember`.
 */
const sends = new Map<string, Sent | null>();
let remember = 1024;

/**
 * How many sends to remember (1024 to start). More helps forage:tune, whose deal
 * search plays many deals that differ by a few colonies; each costs some memory.
 */
export function rememberSends(n: number) {
	remember = n;
	while (sends.size > n) sends.delete(sends.keys().next().value!);
}

/**
 * Drop every remembered send. A fresh build of a deal is a new picture, so
 * nothing from an earlier one can match it again (the editor's checks).
 */
export function forgetSends() {
	sends.clear();
}

/** An id per picture (its target array), so boards of different levels never match. */
const pictures = new WeakMap<number[], number>();
let nextPicture = 0;

/**
 * Everything a patient send from s depends on, as text: the picture, the blocks
 * left, every colony waiting or working, and the locks. Null while ants are
 * still walking (a send from there isn't remembered). A working colony's
 * countdown to its next ant is left out: once nothing more eats, the next tick
 * sends an ant whatever it is. A column is a hash of the colonies left in it,
 * so the same board in another deal of the level (the tuner tries many that
 * differ by a few colonies) matches too.
 */
function boardKey(s: F.State): string | null {
	if (s.walking.length) return null;
	let pic = pictures.get(s.target);
	if (pic === undefined) pictures.set(s.target, (pic = nextPicture++));
	let k = `${pic}|${F.blocksKey(s)}|`;
	for (const col of s.columns) k += col.length ? `${behind(col)},` : '-,';
	for (const e of s.slots) k += e ? `${e.id}.${e.c}.${e.n}.${e.link ?? ''},` : '-,';
	return `${k}|${s.locks.join(',')}|${s.lockAt.join(',')}#`;
}

/**
 * Per colony object: a hash of it and every colony behind it in its column. A
 * deal makes its own colonies and play never changes or moves one in a column,
 * so that's fixed once worked out.
 */
const suffixes = new WeakMap<F.Colony, string>();

/** The colonies in a column, as a hash: worked out once per colony object, from the back. */
function behind(col: F.Colony[]): string {
	const hit = suffixes.get(col[0]);
	if (hit !== undefined) return hit;
	let a = 2166136261;
	let b = 0;
	let key = '';
	for (let i = col.length - 1; i >= 0; i--) {
		const e = col[i];
		const known = suffixes.get(e);
		if (known !== undefined) {
			key = known;
			[a, b] = known.split('.').map(Number);
			continue;
		}
		for (const v of [e.id, e.c, e.n, e.link ?? -1]) {
			a = Math.imul(a ^ (v + 1), 16777619);
			b = (Math.imul(b, 31) + Math.imul(v + 7, 2654435761)) | 0;
		}
		key = `${a >>> 0}.${b >>> 0}`;
		a >>>= 0;
		b >>>= 0;
		suffixes.set(e, key);
	}
	return key;
}

/** The send from column `col` of board s (whose boardKey() is `key`): remembered, or played out and remembered. */
function sendFrom(s: F.State, col: number, key: string | null): Sent | null {
	const k = key === null ? null : key + col;
	if (k !== null) {
		const hit = sends.get(k);
		if (hit !== undefined) {
			sends.delete(k);
			sends.set(k, hit);
			return hit;
		}
	}
	const t = F.clone(s);
	const r = F.pick(t, col);
	const sent = r.ok
		? {
				t,
				parked: r.parked.length > 0,
				eaten: r.meals.reduce((sum, m) => sum + m.eaten.length, 0),
				unlocked: r.unlocked.length
			}
		: null;
	if (k !== null) {
		if (sends.size >= remember) sends.delete(sends.keys().next().value!);
		sends.set(k, sent);
	}
	return sent;
}

/** The best-looking of `list`, at random among those within MARGIN of it; null if empty. */
function best(list: Choice[], rng: Rng, w: Style): Choice | null {
	if (!list.length) return null;
	const scored = list.map((o) => ({ o, v: score(o.t, o.eaten, o.unlocked, w) }));
	const top = Math.max(...scored.map((x) => x.v));
	const close = scored.filter((x) => x.v >= top - MARGIN);
	return close[Math.floor(rng() * close.length)].o;
}

/**
 * How a player picks its sends:
 *   strong: the best-looking send (see score())
 *   clean: the rule of thumb. Any send that finishes without waiting, at random;
 *     only when none would, a strong pick of where to park.
 *   look: the same rule, choosing among the sends that finish with the strong
 *     player's look ahead: a careful person who still never parks by choice.
 *   careless: any send that can go (carelessGame(), but on this board's
 *     choices; the solver uses it for variety)
 */
export type Player = 'strong' | 'clean' | 'look' | 'careless';

/** Pick a move the way `player` does; null when nothing can go. */
function choose(s: F.State, rng: Rng, w: Style, player: Player): Choice | null {
	const all = options(s);
	if (player === 'careless') return all.length ? all[Math.floor(rng() * all.length)] : null;
	if (player === 'strong') return best(all, rng, w);
	const clean = all.filter((o) => !o.parked);
	if (!clean.length) return best(all, rng, w);
	if (player === 'clean') return clean[Math.floor(rng() * clean.length)];
	return best(clean, rng, w);
}

/**
 * Play a whole game as `player`; `seed` sets its style and how it breaks
 * near-ties. `visit` sees each board after a send; returning true stops there.
 */
export function playAs(
	player: Player,
	s0: F.State,
	seed: number,
	visit?: (s: F.State) => boolean
): Game {
	let s = s0;
	const rng = makeRng(seed);
	const w = style(rng);
	const path: number[] = [];
	while (!F.isWon(s)) {
		const next = choose(s, rng, w, player);
		if (!next) return { won: false, path };
		path.push(next.col);
		s = next.t;
		if (visit?.(s)) break;
	}
	return { won: F.isWon(s), path };
}

/** The k-th (1, 2, …) of the strong games measuring a deal; each has its own style. */
export function strongGame(s: F.State, k: number): Game {
	return playAs('strong', s, k * 7919 + 17);
}

/** The k-th (1, 2, …) game of `player` measuring a deal. */
function gameOf(player: Player, s: F.State, k: number): Game {
	if (player === 'strong') return strongGame(s, k);
	return playAs(player, s, k * 6007 + (player === 'clean' ? 3 : 5));
}

/** Share of the first `games` games of `player` won, 0 to 1. */
export function winsOf(player: Player, s: F.State, games: number): number {
	let won = 0;
	for (let k = 1; k <= games; k++) if (gameOf(player, s, k).won) won++;
	return won / games;
}

/**
 * One careless game, the way report.ts measures them: any colony that can go,
 * patiently, on the board itself. The columns it sent from if it won, else null.
 */
export function carelessGame(s0: F.State, seed: number): number[] | null {
	const s = F.clone(s0);
	const rng = makeRng(seed);
	const path: number[] = [];
	while (!F.isWon(s)) {
		const legal = F.legalPicks(s);
		if (!legal.length) return null;
		const col = pickOne(legal, rng);
		F.pick(s, col);
		path.push(col);
	}
	return path;
}
