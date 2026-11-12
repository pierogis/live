import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fromTries } from '../src/lib/forage/difficulty.ts';
import { expression, GIVE_UP, triesOf } from '../src/lib/forage/learner.ts';
import * as F from '../src/lib/forage/engine.ts';
import { targetTries, targetWins } from '../src/lib/forage/report.ts';
import { makeRng } from '../src/lib/shared/engine.ts';
import { closePairs } from '../src/lib/shared/palette.ts';
import { loadPacks } from './levels.ts';

const packs = loadPacks<F.Level>('forage');
const LEVELS = packs.flatMap((p) => p.levels);

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

const slotsFree = (s: F.State) => s.slots.every((e) => !e);

test('only blocks touching the outside are exposed; sealed holes do not count', () => {
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
	const s = make(['AAA', 'ABA', 'AAA'], [[[1, 1]], [[0, 8]]]);
	let r = F.pick(s, 0);
	assert.ok(r.ok && r.parked.length === 1);
	r = F.pick(s, 1);
	assert.ok(r.ok && r.won, 'A eats the ring, then the waiting B eats the middle');
	assert.ok(r.ok && r.meals.some((m) => !r.sent.includes(m.id)), 'a colony already out ate');
});

test('every colony out working holds a slot until it has eaten its count', () => {
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
	t.locks = [5, -1, -1];
	t.lockAt = [1, 0, 0];
	assert.ok(F.hasLock(t, 0));
	const held = F.pick(t, 0);
	assert.ok(!held.ok && held.reason === 'partner', 'a lock splits the stack');
});

function withDispenser(s: F.State, cell: number, colors: number[], amounts: number[]): F.State {
	s.target = s.target.slice();
	s.target[cell] = F.DISPENSER;
	s.dispensers = [{ cell, colors, amounts, used: 0 }];
	return s;
}

function nextMeal(s: F.State) {
	for (let t = 0; t < 50; t++) {
		const r = F.tick(s);
		if (r.eaten.length) return r.eaten;
	}
	throw new Error('nothing eaten');
}

test('a dispenser puts eaten food of its color back at once, so nothing behind it is uncovered', () => {
	const s = withDispenser(make(['AAA', 'ABA', 'AAA'], [[[0, 10]], [[1, 1]]]), 8, [0], [3]);
	assert.equal(F.blocksLeft(s), 7 + 1 + 3, 'the picture, and the 3 still in the dispenser');
	assert.ok(F.send(s, 0).ok);
	const [first] = nextMeal(s);
	assert.ok(s.alive[first.cell], 'a new A took its place');
	assert.deepEqual(F.dispensing(s.dispensers![0]), { c: 0, left: 2 });
	assert.equal(F.exposedOf(s, 1).length, 0, 'the B is still covered');
	for (let t = 0; t < 200 && s.slots.some(Boolean); t++) F.tick(s);
	for (let t = 0; t < 50 && s.walking.length; t++) F.tick(s);
	assert.equal(F.dispensing(s.dispensers![0]), null);
	assert.ok(!s.alive[8], 'an empty dispenser is empty space');
	assert.ok(F.pick(s, 1).ok && F.isWon(s));
});

test("a dispenser changes color after its amount, and when empty it can uncover what's beside it", () => {
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

test('a patient pick times ants the same way the board does, tick by tick', () => {
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

test('difficulty: teaching levels take one try, the hardest several, the sharpest never grind', () => {
	for (const d of [0, 0.01, 0.02, 0.03, 0.04, F.TEACH]) {
		assert.deepEqual(targetTries(d), { best: 1, typical: 1, worst: 1 }, `difficulty ${d}`);
	}
	assert.deepEqual(targetTries(1), { best: 5, typical: 8, worst: 15 });
	const at = (part: number) => F.TEACH + part * (1 - F.TEACH);
	const pips = (d: number) => fromTries(targetTries(d).typical);
	assert.equal(pips(1), 5);
	assert.equal(pips(at(0.5)), 3);
	for (let k = 1; k <= 100; k++) {
		const [a, b] = [targetTries((k - 1) / 100), targetTries(k / 100)];
		assert.ok(b.best >= a.best && b.typical >= a.typical && b.worst >= a.worst);
		assert.ok(b.best <= b.typical && b.typical <= b.worst);
		assert.ok(targetWins(k / 100) <= targetWins((k - 1) / 100));
	}
});

test("a level's deal comes from its own difficulty, not its place in play", () => {
	const lv = LEVELS.find((l) => (l.difficulty ?? 0) >= F.TEACH)!;
	assert.deepEqual(F.buildPuzzle(lv, 3).columns, F.buildPuzzle(lv, 70).columns);
	const harder = F.tuning({ ...lv, difficulty: 0.9 });
	assert.ok(harder.links > F.tuning(lv).links && harder.waitChance > F.tuning(lv).waitChance);
});

test('passes: losses bunched in a few sends, soon seen, are a crux; spread thin or seen late, not', () => {
	const at = (n: number, from: number, gap: number) =>
		Array.from({ length: n }, (_, k) => ({ at: from + (k % 2), gap }));
	const e = expression([...at(6, 10, 3), ...at(4, 30, 12)]);
	assert.deepEqual(
		e.passes.map((p) => [p.from, p.to, p.share, p.learnable]),
		[
			[10, 11, 0.6, true],
			[30, 31, 0.4, false]
		]
	);
	assert.equal(e.focus, 0.6);
	const thin = expression(Array.from({ length: 20 }, (_, k) => ({ at: 5 * k, gap: 2 })));
	assert.equal(thin.focus, 0);
	assert.equal(expression([]).focus, 1);
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
			if (i % 10 === 0 && lv.tries) {
				const t = triesOf(s);
				const saved = [t.best, t.typical, t.worst].map((x) => Math.round(x * 10) / 10);
				assert.deepEqual(saved, lv.tries, 'the attempts saved are this deal\u2019s');
				assert.ok(t.worst <= GIVE_UP, 'learners win it');
			}
			assert.deepEqual(F.buildPuzzle(lv, i).columns, s.columns, 'same level, same deal');
		});
	}
}

test('tuned levels: no level takes the slowest learners past what the hardest asks', () => {
	const ceiling = targetTries(1).worst;
	for (const l of LEVELS) {
		if (l.tries) assert.ok(l.tries[2] <= ceiling, `${l.id}: ${l.tries.join('/')} attempts`);
	}
});
