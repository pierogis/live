import { makeRng, pickOne, type Rng } from '../shared/engine.ts';
import * as F from './engine.ts';

export interface Game {
	won: boolean;
	path: number[];
}

const FREE = [0, -30, -12, -4, -1, 0];
const MARGIN = 2;

export interface Style {
	free: number;
	wait: number;
	ants: number;
	buried: number;
	held: number;
	eat: number;
	unlock: number;
	choice: number;
	ready: number;
	key: number;
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

export function style(rng: Rng): Style {
	const s = { ...STYLE };
	for (const k of Object.keys(s) as (keyof Style)[]) s[k] *= 0.6 + 0.8 * rng();
	s.early = rng();
	return s;
}

function freeSlots(s: F.State): number {
	return s.slots.filter((e) => !e).length;
}

function survives(s: F.State, depth: number): boolean {
	if (F.isWon(s)) return true;
	const legal = F.legalPicks(s);
	if (!legal.length) return false;
	if (depth <= 0) return true;
	if (freeSlots(s) >= 4 && legal.length >= 2 && depth <= 1) return true;
	const key = boardKey(s);
	for (const col of legal) {
		const sent = sendFrom(s, col, key);
		if (sent && survives(sent.t, depth - 1)) return true;
	}
	return false;
}

function score(t: F.State, eaten: number, unlocked: number, w: Style): number {
	if (F.isWon(t)) return 1e6;
	const free = freeSlots(t);
	const legal = F.legalPicks(t);
	const choices = legal.length;
	const ahead = free <= 1 || choices <= 1 ? 2 : free === 2 ? 1 : 0;
	if (!survives(t, ahead)) return -1e6;
	let v =
		w.free * FREE[free] + w.choice * Math.min(3, choices) + w.eat * eaten + w.unlock * unlocked;
	const food = t.colors.map((_, c) => F.exposedOf(t, c).length);
	const ready = legal.filter((k) => {
		const e = t.columns[k][0];
		return e.n <= food[e.c];
	}).length;
	v += w.ready * Math.min(2, ready);
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

const buriedCache = new WeakMap<Int32Array, Int32Array>();

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

export interface Choice {
	col: number;
	t: F.State;
	parked: boolean;
	eaten: number;
	unlocked: number;
}

/** The boards it returns are shared with a cache: clone one before changing it. */
export function options(s: F.State): Choice[] {
	const out: Choice[] = [];
	const key = boardKey(s);
	for (const col of F.legalPicks(s)) {
		const sent = sendFrom(s, col, key);
		if (sent) out.push({ col, ...sent });
	}
	return out;
}

type Sent = Omit<Choice, 'col'>;

const sends = new Map<string, Sent | null>();
let remember = 1024;

export function rememberSends(n: number) {
	remember = n;
	while (sends.size > n) sends.delete(sends.keys().next().value!);
}

export function forgetSends() {
	sends.clear();
}

const pictures = new WeakMap<number[], number>();
let nextPicture = 0;

function boardKey(s: F.State): string | null {
	if (s.walking.length) return null;
	let pic = pictures.get(s.target);
	if (pic === undefined) pictures.set(s.target, (pic = nextPicture++));
	let k = `${pic}|${F.blocksKey(s)}|`;
	for (const col of s.columns) k += col.length ? `${behind(col)},` : '-,';
	for (const e of s.slots) k += e ? `${e.id}.${e.c}.${e.n}.${e.link ?? ''},` : '-,';
	return `${k}|${s.locks.join(',')}|${s.lockAt.join(',')}#`;
}

const suffixes = new WeakMap<F.Colony, string>();

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

export function best(list: Choice[], rng: Rng, w: Style): Choice | null {
	if (!list.length) return null;
	const scored = list.map((o) => ({ o, v: score(o.t, o.eaten, o.unlocked, w) }));
	const top = Math.max(...scored.map((x) => x.v));
	const close = scored.filter((x) => x.v >= top - MARGIN);
	return close[Math.floor(rng() * close.length)].o;
}

export type Player = 'strong' | 'clean' | 'look' | 'careless';

function choose(s: F.State, rng: Rng, w: Style, player: Player): Choice | null {
	const all = options(s);
	if (player === 'careless') return all.length ? all[Math.floor(rng() * all.length)] : null;
	if (player === 'strong') return best(all, rng, w);
	const clean = all.filter((o) => !o.parked);
	if (!clean.length) return best(all, rng, w);
	if (player === 'clean') return clean[Math.floor(rng() * clean.length)];
	return best(clean, rng, w);
}

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

export function strongGame(s: F.State, k: number): Game {
	return playAs('strong', s, k * 7919 + 17);
}

function gameOf(player: Player, s: F.State, k: number): Game {
	if (player === 'strong') return strongGame(s, k);
	return playAs(player, s, k * 6007 + (player === 'clean' ? 3 : 5));
}

export function wonShare(games: number, won: (k: number) => boolean): number {
	let n = 0;
	for (let k = 1; k <= games; k++) if (won(k)) n++;
	return n / games;
}

export function winsOf(player: Player, s: F.State, games: number): number {
	return wonShare(games, (k) => gameOf(player, s, k).won);
}

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

export function hastyGame(s0: F.State, seed: number, ticks: number): boolean {
	const s = F.clone(s0);
	const rng = makeRng(seed);
	while (!F.isWon(s)) {
		const all = options(s);
		if (!all.length) {
			if (F.isStuck(s)) return false;
			F.tick(s);
			continue;
		}
		const clean = all.filter((o) => !o.parked);
		F.hurry(s, pickOne(clean.length ? clean : all, rng).col, ticks);
	}
	return true;
}
