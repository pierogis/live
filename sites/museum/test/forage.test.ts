import assert from 'node:assert/strict';
import { test } from 'node:test';

import { difficultyIndex } from '../src/lib/forage/difficulty.ts';
import * as F from '../src/lib/forage/engine.ts';
import { analyze, QUICK, THOROUGH } from '../src/lib/forage/cruxes.ts';
import { options, playAs, strongGame, winsOf } from '../src/lib/forage/player.ts';
import { measure, pressure, targetWins } from '../src/lib/forage/report.ts';
import { makeRng } from '../src/lib/shared/engine.ts';
import { closePairs } from '../src/lib/shared/palette.ts';
import { loadPacks } from './levels.ts';

const packs = loadPacks<F.Level>('forage');
const LEVELS = packs.flatMap((p) => p.levels);

/** A hand-made state: art rows, colonies per column (front first), as [color, ants]. */
function make(art: string[], columns: [number, number][][], slots = 5): F.State {
	const lv: F.Level = {
		id: 't',
		name: 't',
		palette: { A: '#e63946', B: '#3b7dd8', C: '#ffd23f' },
		art
	};
	const s = F.buildPuzzle(lv, 0, { columns: 3, links: 0, locks: 0, mystery: 0 });
	let id = 0;
	s.columns = columns.map((col) => col.map(([c, n]) => ({ id: id++, c, n })));
	s.locks = s.columns.map(() => -1);
	s.lockAt = s.columns.map(() => 0);
	s.slots = new Array(slots).fill(null);
	return s;
}

/** Whether every slot is empty. */
const slotsFree = (s: F.State) => s.slots.every((e) => !e);

test('only blocks touching the outside are exposed; sealed holes do not count', () => {
	// A ring of A around a hole, with B in the hole's corner.
	const s = make(['AAAAA', 'A...A', 'A.B.A', 'A...A', 'AAAAA'], [[[1, 1]]]);
	assert.equal(F.exposedOf(s, 1).length, 0, 'B sits in a sealed hole');
	assert.equal(F.exposedOf(s, 0).length, 16, 'the whole ring is on the edge');
	const r = F.pick(s, 0);
	assert.ok(r.ok, 'B can wait in a slot');
	assert.equal(s.slots.filter(Boolean).length, 1);
});

test('ants tunnel: eating a block exposes the one behind it', () => {
	const s = make(['AAAAA', 'AAAAA', 'AAAAA'], [[[0, 15]]]);
	const r = F.pick(s, 0);
	assert.ok(r.ok && r.won, 'the inner row opens up and gets eaten too');
	const when = new Map(r.ok ? r.meals[0].eaten.map((e) => [e.cell, e.wave]) : []);
	assert.ok(when.get(7)! > when.get(11)!, 'the sealed middle goes after the food that opened it');
});

test('a waiting colony eats by itself when its color opens up', () => {
	// B is sealed inside A. Send B first (it waits), then A opens the way.
	const s = make(['AAA', 'ABA', 'AAA'], [[[1, 1]], [[0, 8]]]);
	let r = F.pick(s, 0);
	assert.ok(r.ok && r.parked.length === 1);
	r = F.pick(s, 1);
	assert.ok(r.ok && r.won, 'A eats the ring, then the waiting B eats the middle');
	assert.ok(r.ok && r.meals.some((m) => !r.sent.includes(m.id)), 'a colony already out ate');
});

test('every colony out working holds a slot until it has eaten its count', () => {
	// One slot: B waits in it (it can't reach its color), so A can't go out at all.
	const s = make(['AAA', 'ABA', 'AAA'], [[[1, 1]], [[0, 8]]], 1);
	assert.ok(F.send(s, 0).ok);
	const r = F.send(s, 1);
	assert.ok(!r.ok && r.reason === 'no-slot');
	assert.ok(F.isStuck(s), 'nothing can eat and nothing can go');
});

test('time: ants leave one at a time and the food goes when they get there', () => {
	const s = make(['AAAA', 'BBBB'], [[[0, 4]], [[1, 4]]]);
	assert.ok(F.send(s, 0).ok && F.send(s, 1).ok);
	const first = F.tick(s);
	assert.equal(first.eaten.length, 0, 'the first ants are still walking');
	assert.deepEqual(s.walking.map((a) => a.c).sort(), [0, 1], 'each colony sent one ant');
	let ticks = 1;
	let most = 0;
	while (!F.isWon(s) && ticks < 50) {
		most = Math.max(most, F.tick(s).eaten.length);
		ticks++;
	}
	assert.ok(F.isWon(s));
	assert.ok(most <= 2, 'at most one food per colony per tick');
	assert.ok(slotsFree(s), 'colonies have left their slots');
});

test('a colony frees its slot as soon as it sends its last ant', () => {
	const s = make(['AAAA', 'BBBB'], [[[0, 1]], [[1, 4]]]);
	assert.ok(F.send(s, 0).ok);
	assert.ok(slotsFree(s), 'one ant, sent right away: the slot is already free');
	assert.equal(s.walking.length, 1, 'the ant is still on its way');
	assert.ok(F.send(s, 1).ok);
	let freedWhileWalking = false;
	for (let t = 0; t < 40 && !F.isWon(s); t++) {
		F.tick(s);
		if (slotsFree(s) && s.walking.length) freedWhileWalking = true;
	}
	assert.ok(freedWhileWalking, 'B left its slot while its last ants were still walking');
});

test('a locked column opens when its key block touches the outside', () => {
	const s = make(['AAA', 'ABA', 'AAA'], [[[0, 8]], [[1, 1]]]);
	s.locks = [-1, 4];
	assert.ok(F.isLocked(s, 1));
	const blocked = F.pick(s, 1);
	assert.ok(!blocked.ok && blocked.reason === 'locked');
	const r = F.pick(s, 0);
	assert.ok(r.ok && r.unlocked.includes(1));
	assert.ok(F.pick(s, 1).ok);
});

test('ants leave one at a time; covered food is claimed only once it is exposed', () => {
	// A 3x3 block: the middle (4) is sealed until a food beside it is eaten.
	const s = make(['AAA', 'AAA', 'AAA'], [[[0, 9]]]);
	assert.ok(F.send(s, 0).ok);
	assert.equal(s.walking.length, 1, 'the first ant leaves right away');
	const claimedAt = new Map<number, number>([[s.walking[0].cell, 0]]);
	const eatenAt = new Map<number, number>();
	for (let t = 1; t < 60 && !F.isWon(s); t++) {
		for (const e of F.tick(s).eaten) eatenAt.set(e.cell, t);
		for (const a of s.walking) if (!claimedAt.has(a.cell)) claimedAt.set(a.cell, t);
	}
	assert.ok(F.isWon(s));
	const order = [...claimedAt.keys()];
	assert.deepEqual(order.slice(0, 3), [6, 7, 8], 'bottom row first, left to right');
	const ticks = [...claimedAt.values()];
	for (let k = 1; k < ticks.length; k++) {
		assert.ok(ticks[k] - ticks[k - 1] >= F.DISPATCH_EVERY, 'one ant every DISPATCH_EVERY ticks');
	}
	const opened = Math.min(...[1, 3, 5, 7].map((i) => eatenAt.get(i)!));
	assert.ok(claimedAt.get(4)! >= opened, 'the middle is claimed only after a side of it opens');
});

test('linked colonies stay linked in their slots until both are done', () => {
	// A has 1 food and finishes fast; B has 3, so it is still working when A is done.
	const s = make(['AB', 'BB'], [[[0, 1]], [[1, 3]]]);
	s.columns[0][0].link = s.columns[1][0].link = s.columns[0][0].id;
	const r = F.send(s, 0);
	assert.ok(r.ok && r.sent.length === 2, 'they go out together');
	const a = () => s.slots.find((e) => e?.c === 0);
	const b = () => s.slots.find((e) => e?.c === 1);
	let sawWaitingPartner = false;
	for (let t = 0; t < 60 && !F.isWon(s); t++) {
		F.tick(s);
		if (a() && F.isDone(a()!) && b() && !F.isDone(b()!)) sawWaitingPartner = true;
	}
	assert.ok(sawWaitingPartner, 'A stayed in its slot, done, while B was still eating');
	assert.ok(F.isWon(s));
	assert.ok(slotsFree(s), 'both left together');
});

test('a lock sits in front of the colony it blocks; colonies ahead of it can still go', () => {
	// Column 0: one free colony, then the lock (its key is the B deep in the middle), then B.
	const art = ['AAAAA', 'AAAAA', 'AABAA', 'AAAAA', 'AAAAA'];
	const first: [number, number][] = [
		[0, 4],
		[1, 1]
	];
	const s = make(art, [first, [[0, 20]]]);
	s.locks = [12, -1];
	s.lockAt = [1, 0];
	assert.ok(F.hasLock(s, 0) && !F.isLocked(s, 0), 'the colony ahead of the lock is free');
	assert.ok(F.pick(s, 0).ok);
	assert.ok(F.isLocked(s, 0), 'now the lock is at the front');
	assert.ok(F.pick(s, 1).ok, 'the rest of the ring opens the key');
	assert.ok(!F.hasLock(s, 0));
	assert.ok(F.pick(s, 0).ok && F.isWon(s));
});

test('linked colonies go out together, only when both are at the front', () => {
	const s = make(
		['AABB'],
		[
			[
				[0, 1],
				[0, 1]
			],
			[[1, 2]]
		]
	);
	s.columns[0][1].link = s.columns[1][0].link = s.columns[0][1].id;
	const blocked = F.pick(s, 1);
	assert.ok(!blocked.ok && blocked.reason === 'partner');
	assert.ok(F.pick(s, 0).ok);
	const r = F.pick(s, 1);
	assert.ok(r.ok && r.sent.length === 2 && r.won);
});

test('linked colonies back to back in one column go out as one stack', () => {
	// Column 0: two linked A colonies back to back, then a B. Column 1: their third member, behind a B.
	const s = make(
		['AAAABB'],
		[
			[
				[0, 1],
				[0, 2],
				[1, 1]
			],
			[
				[1, 1],
				[0, 1]
			]
		]
	);
	const g = s.columns[0][0].id;
	s.columns[0][0].link = s.columns[0][1].link = s.columns[1][1].link = g;
	const blocked = F.pick(s, 0);
	assert.ok(!blocked.ok && blocked.reason === 'partner', 'the third is not at its front yet');
	assert.ok(F.pick(s, 1).ok);
	const t = F.clone(s);
	const sent = F.send(t, 1);
	assert.ok(sent.ok && sent.sent.length === 3, 'tapping either lane sends the stack and the third');
	assert.deepEqual(
		t.columns.map((c) => c.length),
		[1, 0],
		'both of the stack left its column'
	);
	const r = F.pick(s, 0);
	assert.ok(r.ok && r.sent.length === 3);
	assert.ok(F.pick(s, 0).ok && F.isWon(s));
});

test('a linked stack waits while another colony sits between its members, or a lock does', () => {
	const s = make(
		['AAAB'],
		[
			[
				[0, 1],
				[1, 1],
				[0, 2]
			]
		]
	);
	s.columns[0][0].link = s.columns[0][2].link = s.columns[0][0].id;
	const apart = F.pick(s, 0);
	assert.ok(!apart.ok && apart.reason === 'partner', 'not back to back');

	const t = make(
		['AAAA', 'ABAA', 'AAAA', 'AAAA'],
		[
			[
				[0, 1],
				[0, 1]
			],
			[[0, 13]],
			[[1, 1]]
		]
	);
	t.columns[0][0].link = t.columns[0][1].link = t.columns[0][0].id;
	// Column 0's lock sits between its two members; its key is the B, still covered.
	t.locks = [5, -1, -1];
	t.lockAt = [1, 0, 0];
	assert.ok(F.hasLock(t, 0));
	const held = F.pick(t, 0);
	assert.ok(!held.ok && held.reason === 'partner', 'a lock splits the stack');
});

/** A board from make() with a dispenser in place of the food at `cell`. */
function withDispenser(s: F.State, cell: number, colors: number[], amounts: number[]): F.State {
	s.target = s.target.slice();
	s.target[cell] = F.DISPENSER;
	s.dispensers = [{ cell, colors, amounts, used: 0 }];
	return s;
}

/** Tick until an ant gets to its food; what it ate. */
function nextMeal(s: F.State) {
	for (let t = 0; t < 50; t++) {
		const r = F.tick(s);
		if (r.eaten.length) return r.eaten;
	}
	throw new Error('nothing eaten');
}

test('a dispenser puts eaten food of its color back at once, so nothing behind it is uncovered', () => {
	// A ring of A around a B; the dispenser takes the bottom right A and holds 3 more A.
	const s = withDispenser(make(['AAA', 'ABA', 'AAA'], [[[0, 10]], [[1, 1]]]), 8, [0], [3]);
	assert.equal(F.blocksLeft(s), 7 + 1 + 3, 'the picture, and the 3 still in the dispenser');
	assert.ok(F.send(s, 0).ok);
	const [first] = nextMeal(s);
	assert.ok(s.alive[first.cell], 'a new A took its place');
	assert.deepEqual(F.dispensing(s.dispensers![0]), { c: 0, left: 2 });
	assert.equal(F.exposedOf(s, 1).length, 0, 'the B is still covered');
	// Then the dispenser runs out and its tile is empty; the rest of the ring goes as usual.
	for (let t = 0; t < 200 && s.slots.some(Boolean); t++) F.tick(s);
	for (let t = 0; t < 50 && s.walking.length; t++) F.tick(s);
	assert.equal(F.dispensing(s.dispensers![0]), null);
	assert.ok(!s.alive[8], 'an empty dispenser is empty space');
	assert.ok(F.pick(s, 1).ok && F.isWon(s));
});

test("a dispenser changes color after its amount, and when empty it can uncover what's beside it", () => {
	// The dispenser is the top middle A, over the B: 1 A, then 1 C.
	const s = withDispenser(
		make(['AAA', 'ABA', 'ACA'], [[[0, 7]], [[2, 2]], [[1, 1]]]),
		1,
		[0, 2],
		[1, 1]
	);
	assert.ok(F.send(s, 0).ok);
	const [first] = nextMeal(s);
	assert.ok(s.alive[first.cell], 'refilled');
	assert.deepEqual(F.dispensing(s.dispensers![0]), { c: 2, left: 1 }, 'C now');
	assert.ok(!F.exposedOf(s, 1).length, 'still covering the B');
	assert.ok(F.send(s, 1).ok);
	let meal = nextMeal(s);
	while (!meal.some((e) => e.c === 2)) meal = nextMeal(s);
	assert.equal(F.dispensing(s.dispensers![0]), null, 'it handed out its last');
	assert.ok(!s.alive[1]);
	assert.deepEqual(F.exposedOf(s, 1), [4], 'its empty tile uncovers the B');
});

test('a linked group of three goes out together and holds its slots until all are done', () => {
	// A ring of A around a C, beside a block of B. Two A colonies: 7 ants, then 1.
	const s = make(
		['AAABB', 'ACABB', 'AAABB'],
		[
			[
				[0, 7],
				[0, 1]
			],
			[[1, 6]],
			[[2, 1]]
		]
	);
	for (const col of s.columns) col[0].link = s.columns[0][0].id;
	assert.ok(!F.isLocked(s, 2) && F.legalPicks(s).length === 3, 'any of the three can be tapped');
	const t = F.clone(s);
	const sent = F.send(t, 1);
	assert.ok(sent.ok && sent.sent.length === 3, 'tapping one sends all three');
	assert.equal(t.slots.filter(Boolean).length, 3, 'three slots taken at once');
	let heldDone = false;
	for (let k = 0; k < 80 && t.slots.some(Boolean); k++) {
		F.tick(t);
		const out = t.slots.filter((e): e is F.Colony => !!e);
		if (out.some(F.isDone) && out.some((e) => !F.isDone(e))) heldDone = true;
	}
	assert.ok(heldDone, 'a finished colony stayed in its slot while the group was busy');
	assert.ok(slotsFree(t), 'then all three left together');
	const full = F.clone(s);
	full.slots = [null, null, { id: 99, c: 1, n: 1 }, { id: 98, c: 1, n: 1 }, { id: 97, c: 1, n: 1 }];
	const r = F.send(full, 0);
	assert.ok(!r.ok && r.reason === 'no-slot', 'three need three free slots');
});

test('dig depth: blocks to eat before each cell is exposed', () => {
	// B sits under one ring of A; C under two.
	const s = make(['AAAAA', 'ABBBA', 'ABCBA', 'ABBBA', 'AAAAA'], [[[0, 16]]]);
	const d = F.digDepth(s);
	assert.equal(d[0], 0, 'the edge is exposed');
	assert.equal(d[6], 1, 'B is under one block');
	assert.equal(d[12], 2, 'C is under two');
});

test('a patient pick times ants the same way the board does, tick by tick', () => {
	// pick() skips making the walks the board draws ants along; it must still match send + tick.
	const lv = packs[0].levels[3];
	const s0 = F.buildPuzzle(lv, 3);
	const a = F.clone(s0);
	const b = F.clone(s0);
	const rng = makeRng(5);
	for (let step = 0; step < 12 && !F.isWon(a); step++) {
		const legal = F.legalPicks(a);
		const col = legal[Math.floor(rng() * legal.length)];
		assert.ok(F.pick(a, col).ok);
		assert.ok(F.send(b, col).ok);
		// Tick until nothing is walking and every colony out is done or has nothing to eat.
		while (b.walking.length || b.slots.some((e) => e && e.n > 0 && !F.isWaiting(b, e))) {
			for (const d of F.tick(b).dispatched) {
				const path = F.antPath(b, d);
				assert.deepEqual(path[path.length - 1], { x: d.cell % b.w, y: Math.floor(d.cell / b.w) });
			}
		}
		assert.deepEqual(b.alive, a.alive, `same food left after send ${step + 1}`);
		assert.deepEqual(
			b.slots.map((e) => e && [e.id, e.n]),
			a.slots.map((e) => e && [e.id, e.n])
		);
	}
});

test('difficulty: the first levels are easy, the last very hard, with breathers', () => {
	for (let i = 0; i < 5; i++) assert.equal(difficultyIndex(targetWins(i)), 1, `level ${i + 1}`);
	const last = LEVELS.length - 1;
	/** The level `part` of the way through play, after the teaching levels. */
	const at = (part: number) => 4 + Math.round(part * (last - 4));
	assert.equal(difficultyIndex(targetWins(last)), 5);
	// The top tier is about the last sixth of play; the middle of the game is around 3.
	assert.equal(difficultyIndex(targetWins(at(0.85))), 5);
	assert.equal(difficultyIndex(targetWins(at(0.7))), 4);
	assert.equal(difficultyIndex(targetWins(at(0.4))), 3);
	for (let i = 11; i < last; i += 6) {
		assert.ok(targetWins(i) > targetWins(i - 1), `level ${i + 1} is a breather`);
	}
	for (let i = 6; i <= last; i++) {
		if (i % 6 !== 5 && (i - 1) % 6 !== 5) assert.ok(targetWins(i) <= targetWins(i - 1));
	}
});

test('the strong player clears a teaching level, and its path replays to a win', () => {
	const lv = packs[0].levels[0];
	const s = F.buildPuzzle(lv, 0);
	assert.equal(winsOf('strong', s, 6), 1);
	const t = F.clone(s);
	for (const col of strongGame(s, 1).path) assert.ok(F.pick(t, col).ok);
	assert.ok(F.isWon(t));
});

let index = 0;
for (const pack of packs) {
	for (const lv of pack.levels) {
		const i = index++;
		test(`forage ${pack.id}/${lv.id}: builds, counts add up, the built-in play wins`, () => {
			const used = new Set(lv.art.join('').replace(/\./g, ''));
			assert.deepEqual(closePairs(lv.palette, used), []);
			const s = F.buildPuzzle(lv, i);
			const blocks: number[] = s.colors.map(() => 0);
			s.target.forEach((c) => c >= 0 && blocks[c]++);
			for (const d of s.dispensers ?? []) d.colors.forEach((c, k) => (blocks[c] += d.amounts[k]));
			const ants: number[] = s.colors.map(() => 0);
			s.columns.flat().forEach((e) => (ants[e.c] += e.n));
			assert.deepEqual(
				ants,
				blocks,
				"each color's ants match its blocks and what dispensers hand out"
			);
			const r = F.clone(s);
			for (const col of s.intended!) assert.ok(F.pick(r, col).ok);
			assert.ok(F.isWon(r));
			// Games are slow on big pictures, so check every tenth tuned level: these are
			// the games forage:tune measured, and it avoids deals that lose them all.
			if (i % 10 === 0 && lv.wins !== undefined) {
				assert.ok(measure(s).wins > 0, 'a measured game wins');
			}
			assert.deepEqual(F.buildPuzzle(lv, i).columns, s.columns, 'same level, same deal');
		});
	}
}

test('later deals make you wait: waits and long-held linked pairs are common', () => {
	const later = LEVELS.map((lv, i) => ({ lv, i })).slice(60);
	let waits = 0;
	let sends = 0;
	let withHeld = 0;
	for (const { lv, i } of later) {
		const p = pressure(F.buildPuzzle(lv, i));
		waits += p.waits;
		sends += p.sends;
		if (p.heldPairs) withHeld++;
	}
	assert.ok(waits / sends >= 0.1, `${waits} of ${sends} sends wait`);
	assert.ok(withHeld >= later.length * 0.7, `${withHeld} of ${later.length} hold a pair long`);
});

test('forage level ids are unique, and LAST_LEVEL is the last level', () => {
	const ids = LEVELS.map((l) => l.id);
	assert.equal(new Set(ids).size, ids.length);
	assert.equal(
		F.LAST_LEVEL,
		LEVELS.length - 1,
		'set LAST_LEVEL in engine.ts, then run forage:tune'
	);
});

test('difficulty: cruxes cap and floor the rating from wins', () => {
	assert.equal(difficultyIndex(0.1), 5, 'untuned: wins alone');
	assert.equal(
		difficultyIndex(0.1, { breaks: 0, cruxes: 4, spread: 3 }),
		2,
		'no rule break: at most 2'
	);
	assert.equal(difficultyIndex(0.1, { breaks: 2, cruxes: 4, spread: 1 }), 3, 'all in one third');
	assert.equal(difficultyIndex(0.1, { breaks: 1, cruxes: 4, spread: 3 }), 3, 'one rule break');
	assert.equal(difficultyIndex(0.1, { breaks: 2, cruxes: 2, spread: 2 }), 4, '5 takes 3 cruxes');
	assert.equal(difficultyIndex(0.1, { breaks: 2, cruxes: 3, spread: 2 }), 5);
	assert.equal(
		difficultyIndex(1, { breaks: 3, cruxes: 4, spread: 3 }),
		3,
		'real cruxes: at least 3'
	);
});

test('the rule-of-thumb player never parks while a send that finishes can go', () => {
	const lv = packs[2].levels[3];
	const s0 = F.buildPuzzle(lv, 40);
	// Replay its choices: whenever one finishes, the one it took did.
	let s = s0;
	const g = playAs('clean', s0, 7);
	assert.ok(g.path.length > 10);
	for (const col of g.path) {
		const all = options(s);
		const took = all.find((o) => o.col === col)!;
		if (all.some((o) => !o.parked)) assert.ok(!took.parked, 'took a send that finishes');
		s = took.t;
	}
});

test('cruxes: a teaching level has none, and the walked line wins', () => {
	const lv = packs[0].levels[1];
	const s = F.buildPuzzle(lv, 1);
	const a = analyze(s, THOROUGH);
	assert.ok(a.complete);
	assert.equal(a.breaks, 0);
	assert.equal(a.real, 0);
	const t = F.clone(s);
	for (const col of a.line) assert.ok(F.pick(t, col).ok);
	assert.ok(F.isWon(t));
	// Cheap enough for a quick look: it stops on time, with what it found so far.
	const quick = analyze(F.buildPuzzle(LEVELS.at(-1)!, LEVELS.length - 1), {
		...QUICK,
		ms: 300
	});
	assert.ok(quick.ms < 1500, `quick check took ${quick.ms.toFixed(0)}ms`);
});

test("a level's deal string says which column each colony goes to; a bad one is ignored", () => {
	const lv = { ...packs[3].levels[2], deal: undefined };
	const i = 62;
	const plan = F.planPlay(lv, i);
	const random = F.buildPuzzle(lv, i);
	const placement = F.placementOf(random);
	const same = F.buildPuzzle({ ...lv, deal: placement.join('') }, i);
	assert.deepEqual(same.columns, random.columns);
	// Move the last colony to another column: still a winning deal, now with it there.
	const moved = placement.slice();
	const last = moved.length - 1;
	for (let k = 0; k < plan.tune.columns; k++) {
		moved[last] = k;
		const s = F.dealAs(plan, moved);
		if (k === placement[last] || !s || !F.wins(s)) continue;
		const built = F.buildPuzzle({ ...lv, deal: moved.join('') }, i);
		assert.equal(F.placementOf(built)[last], k);
		break;
	}
	const bad = F.buildPuzzle({ ...lv, deal: '9'.repeat(placement.length) }, i);
	assert.deepEqual(bad.columns, random.columns, 'falls back to the seed’s own deal');
});

test('tuned levels: each mural is about as hard as the one before or harder', () => {
	if (LEVELS.some((l) => l.cruxes === undefined)) return; // not tuned yet
	// Panels vary within a mural; the murals' averages climb.
	const means = packs.map((p) => {
		const pips = p.levels.map((l) => difficultyIndex(l.wins, l)!);
		return pips.reduce((a, b) => a + b) / pips.length;
	});
	means.slice(1).forEach((m, k) => {
		assert.ok(
			m >= means[k] - 0.25,
			`${packs[k + 1].id} averages ${m.toFixed(2)}, after ${means[k].toFixed(2)}`
		);
	});
	assert.ok(
		means.at(-1)! - means[0] >= 2,
		`from ${means[0].toFixed(2)} to ${means.at(-1)!.toFixed(2)}`
	);
});

test('tuned levels: teaching ones have no cruxes, late ones several rule breaks', () => {
	if (LEVELS.some((l) => l.cruxes === undefined)) return; // not tuned yet
	for (const l of LEVELS.slice(0, 5)) assert.equal(l.cruxes, 0, l.id);
	// Places in play as parts of the whole: the last fifth is "late".
	const at = (part: number) => Math.round(part * LEVELS.length);
	const late = LEVELS.slice(at(0.8));
	const breaks = late.reduce((n, l) => n + (l.breaks ?? 0), 0) / late.length;
	assert.ok(breaks >= 2, `late levels average ${breaks.toFixed(1)} rule breaks`);
	const pips = LEVELS.map((l) => difficultyIndex(l.wins, l)!);
	const avg = (from: number, to: number) =>
		pips.slice(from, to).reduce((a, b) => a + b) / (to - from);
	const last = avg(at(0.8), LEVELS.length);
	assert.ok(avg(0, 5) <= 1.2 && last >= 4, 'rises from 1 to about 5');
	assert.ok(avg(at(0.3), at(0.5)) < last - 0.8, 'the first half ends in the middle of the curve');
});
