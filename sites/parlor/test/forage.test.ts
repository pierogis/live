import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as F from '../src/lib/forage/engine.ts';
import { closePairs } from '../src/lib/shared/palette.ts';
import { loadPacks } from './levels.ts';

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

test('only blocks touching the outside are exposed; sealed holes do not count', () => {
	// A ring of A around a hole, with B in the hole's corner.
	const s = make(['AAAAA', 'A...A', 'A.B.A', 'A...A', 'AAAAA'], [[[1, 1]]]);
	assert.equal(F.exposedOf(s, 1).length, 0, 'B sits in a sealed hole');
	assert.equal(F.exposedOf(s, 0).length, 16, 'the whole ring is on the edge');
	const r = F.pick(s, 0);
	assert.ok(!r.ok && r.reason === 'no-slot' ? false : r.ok, 'B can wait in a slot');
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
	assert.ok(r.ok && r.meals.some((m) => m.from === 'slot'));
});

test('every colony out working holds a slot until it has eaten its count', () => {
	// One slot: B waits in it (it can't reach its color), so A can't go out at all.
	const s = make(['AAA', 'ABA', 'AAA'], [[[1, 1]], [[0, 8]]], 1);
	assert.ok(F.send(s, 0).ok);
	const r = F.send(s, 1);
	assert.ok(!r.ok && r.reason === 'no-slot');
	assert.ok(F.isStuck(s), 'nothing can eat and nothing can go');
});

test('time: ants leave one per tick and the food goes when they get there', () => {
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
	assert.ok(
		s.slots.every((e) => !e),
		'colonies have left their slots'
	);
});

test('a colony frees its slot as soon as it sends its last ant', () => {
	const s = make(['AAAA', 'BBBB'], [[[0, 1]], [[1, 4]]]);
	assert.ok(F.send(s, 0).ok);
	assert.ok(
		s.slots.every((e) => !e),
		'one ant, sent right away: the slot is already free'
	);
	assert.equal(s.walking.length, 1, 'the ant is still on its way');
	assert.ok(F.send(s, 1).ok);
	let freedWhileWalking = false;
	for (let t = 0; t < 40 && !F.isWon(s); t++) {
		F.tick(s);
		if (s.slots.every((e) => !e) && s.walking.length) freedWhileWalking = true;
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

test('ants leave one at a time; uncovered food is claimed only once it is exposed', () => {
	// A 3x3 block: the middle (4) is sealed until an ant picks up a food beside it.
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
	s.columns[0][0].link = s.columns[1][0].id;
	s.columns[1][0].link = s.columns[0][0].id;
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
	assert.ok(
		s.slots.every((e) => !e),
		'both left together'
	);
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
	s.columns[0][1].link = s.columns[1][0].id;
	s.columns[1][0].link = s.columns[0][1].id;
	const blocked = F.pick(s, 1);
	assert.ok(!blocked.ok && blocked.reason === 'partner');
	assert.ok(F.pick(s, 0).ok);
	const r = F.pick(s, 1);
	assert.ok(r.ok && r.sent.length === 2 && r.won);
});

const packs = loadPacks<F.Level>('forage');
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
			const ants: number[] = s.colors.map(() => 0);
			s.columns.flat().forEach((e) => (ants[e.c] += e.n));
			assert.deepEqual(ants, blocks, "each color's ants match its blocks");
			const r = F.clone(s);
			for (const col of s.intended!) assert.ok(F.pick(r, col).ok);
			assert.ok(F.isWon(r));
			// The solver is slow on big pictures, so check it on a sample of levels.
			if (i % 10 === 0) assert.ok(F.solve(s), 'the solver finds a win from the start');
			assert.deepEqual(F.buildPuzzle(lv, i).columns, s.columns, 'same level, same deal');
		});
	}
}

test('forage level ids are unique and there are about 100 levels', () => {
	const ids = packs.flatMap((p) => p.levels.map((l) => l.id));
	assert.equal(new Set(ids).size, ids.length);
	assert.ok(ids.length >= 100);
});
