import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as E from '../src/lib/mosaic/engine.ts';
import { loadLevels } from './levels.ts';

const LEVELS = loadLevels();

function tiny(
	art: string[],
	top: number[],
	trayCap: number,
	palette: Record<string, string> = { A: '#000', B: '#fff' }
): E.State {
	const lv: E.Level = { id: 't', name: 't', palette, art };
	const s = E.buildPuzzle(lv, 0);
	s.top = top.map((c, id) => ({ id, c }));
	s.tray = [];
	s.trayCap = trayCap;
	return s;
}

for (const relaxed of [false, true]) {
	LEVELS.forEach((lv, i) => {
		test(`${lv.id}${relaxed ? ' (relaxed)' : ''}: builds and solves`, () => {
			const s = E.buildPuzzle(lv, i, { relaxed });

			const need: Record<number, number> = {};
			const have: Record<number, number> = {};
			s.target.forEach((c, k) => {
				if (c >= 0) need[c] = (need[c] || 0) + 1;
				const q = s.top[k];
				if (q) have[q.c] = (have[q.c] || 0) + 1;
				assert.equal(c >= 0, !!q, 'every picture spot starts covered');
			});
			assert.deepEqual(have, need, 'same colors in both layers');
			assert.ok(s.attempt! >= 0, 'fits the standard tray without growing it');

			const sol = E.solve(s, 2, s.attempt! + 1);
			assert.ok(sol, `solvable with tray ${s.trayCap}`);
			const r = E.clone(s);
			for (const a of sol.path) assert.ok(E.move(r, a.sel, a.dst).ok);
			assert.ok(E.isWon(r) && r.tray.length === 0, 'picture complete, tray empty');
		});
	});
}

test('a move lifts a group into the tray or onto open spots of its color', () => {
	const s = tiny(['ABB'], [1, 0, 1], 1);
	const before = JSON.stringify(s);
	assert.equal(E.move(s, { from: 'board', cell: 0 }, { to: 'spot', cell: 1 }).ok, false);
	assert.equal(JSON.stringify(s), before, 'a failed move changes nothing');

	assert.ok(E.move(s, { from: 'board', cell: 0 }, { to: 'tray' }).ok);
	const full = E.move(s, { from: 'board', cell: 1 }, { to: 'tray' });
	assert.ok(!full.ok && full.reason === 'tray-full');
	const covered = E.move(s, { from: 'board', cell: 1 }, { to: 'spot', cell: 2 });
	assert.ok(!covered.ok && covered.reason === 'covered');
	assert.ok(E.move(s, { from: 'board', cell: 1 }, { to: 'spot', cell: 0 }).ok);
	const r = E.move(s, { from: 'tray', color: 1 }, { to: 'spot', cell: 1 });
	assert.ok(r.ok && r.fromTray.length === 1 && s.tray.length === 0);
	assert.ok(E.move(s, { from: 'board', cell: 2 }, { to: 'tray' }).ok);
	const filled = E.move(s, { from: 'tray', color: 1 }, { to: 'spot', cell: 0 });
	assert.ok(!filled.ok && filled.reason === 'filled');
	assert.ok(E.move(s, { from: 'tray', color: 1 }, { to: 'spot', cell: 2 }).ok);
	assert.ok(E.isWon(s));
});

test('more dots than room: the ones closest to the picked dot move', () => {
	const s = tiny(['AAAABB', 'BBBBAA'], [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0], 2);
	let r = E.move(s, { from: 'board', cell: 5 }, { to: 'tray' });
	assert.ok(r.ok && r.toTray.length === 2 && r.left === 4, 'tray takes 2');
	assert.deepEqual(r.toTray.map((p) => p.from).sort(), [4, 5]);
	r = E.move(s, { from: 'board', cell: 0 }, { to: 'spot', cell: 5 });
	assert.ok(r.ok && r.toBoard.length === 2 && r.left === 2);
	assert.deepEqual(r.toBoard.map((p) => p.from).sort(), [0, 1], 'dots nearest the picked dot move');
	assert.equal(r.toBoard[0].cell, 5, 'first dot lands on the tapped spot');
	assert.ok(s.top[r.leftCell], 'leftover dot still on the board');
});

test('fewer dots than spots: they fill the spots closest to the tapped one', () => {
	const s = tiny(['AAAAB'], [1, 1, 1, 1, 0], 4);
	assert.ok(E.move(s, { from: 'board', cell: 0 }, { to: 'tray' }).ok);
	const r = E.move(s, { from: 'board', cell: 4 }, { to: 'spot', cell: 2 });
	assert.ok(r.ok && r.toBoard.length === 1 && r.toBoard[0].cell === 2);
});

test("dots that the tapped area has no room for go on to the color's other open spots", () => {
	const s = tiny(['ABABA', 'CCCCC'], [2, 1, 2, 1, 2, 0, 0, 0, 1, 1], 5, {
		A: '#000',
		B: '#fff',
		C: '#f00'
	});
	const lift = E.move(s, { from: 'board', cell: 0 }, { to: 'tray' });
	assert.ok(lift.ok && lift.toTray.length === 3);
	assert.deepEqual(E.dropSpots(s, 4), [4, 2, 0]);
	const r = E.move(s, { from: 'board', cell: 5 }, { to: 'spot', cell: 4 });
	assert.ok(r.ok && r.left === 0);
	assert.deepEqual(
		r.toBoard.map((p) => p.cell),
		[4, 2, 0]
	);
});

test("with room to spare, more of the color's board dots come too, nearest first, never the tray's", () => {
	const s = tiny(['AAAAAA', 'BBBBBB'], [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0], 12);
	s.trayCap = 1;
	assert.ok(E.move(s, { from: 'board', cell: 11 }, { to: 'tray' }).ok);
	s.trayCap = 12;
	assert.ok(E.move(s, { from: 'board', cell: 0 }, { to: 'tray' }).ok);
	assert.equal(E.dropCount(s, { from: 'board', cell: 6 }, 0), 2);
	const r = E.move(s, { from: 'board', cell: 6 }, { to: 'spot', cell: 0 });
	assert.ok(r.ok && r.left === 0);
	assert.deepEqual(
		r.toBoard.map((p) => [p.from, p.cell, p.order]),
		[
			[6, 0, 0],
			[9, 1, 1]
		],
		'the picked dot, then the other board dot'
	);
	assert.equal(r.fromTray.length, 0, 'none from the tray');
	assert.ok(
		s.tray.some((q) => q.c === 0),
		'the tray keeps its A'
	);
});

test('diagonal spots count as touching', () => {
	const s = tiny(['AB', 'BA'], [1, 0, 0, 1], 4);
	assert.equal(E.groupAt(s, 0)!.cells.length, 2, 'B dots touching at the corner form one group');
	assert.ok(E.move(s, { from: 'board', cell: 0 }, { to: 'tray' }).ok);
	assert.deepEqual(
		E.openRegion(s, 0).sort(),
		[0, 3],
		'open spots touching at the corner form one area'
	);
	const r = E.move(s, { from: 'board', cell: 1 }, { to: 'spot', cell: 0 });
	assert.ok(r.ok && r.toBoard.length === 2 && r.left === 0);
});

test('the tray keeps dots grouped by color', () => {
	const s = tiny(['ABCABC'], [1, 2, 0, 1, 2, 0], 6, { A: '#000', B: '#fff', C: '#f00' });
	s.trayCap = 1;
	assert.ok(E.move(s, { from: 'board', cell: 0 }, { to: 'tray' }).ok);
	s.trayCap = 6;
	for (const cell of [1, 3, 2]) assert.ok(E.move(s, { from: 'board', cell }, { to: 'tray' }).ok);
	assert.deepEqual(
		s.tray.map((q) => q.c),
		[1, 1, 2, 2, 0, 0]
	);
});

test('with room to spare, the tray takes more of the color, nearest first', () => {
	const s = tiny(['ABABA'], [0, 1, 0, 1, 0], 2);
	assert.equal(E.parkCount(s, { from: 'board', cell: 2 }), 2);
	const r = E.move(s, { from: 'board', cell: 2 }, { to: 'tray' });
	assert.ok(r.ok && r.toTray.length === 2 && r.toTray[0].from === 2);
	assert.ok(s.top[0] || s.top[4], 'one A is left on the board');
});

test('taps: a direct hit wins, a near miss snaps to the nearest useful cell', () => {
	const g: E.TapGrid = { w: 4, h: 1, cell: 40, step: 44, reach: 42 };
	const isDot = (i: number) => i === 0 || i === 3;
	const isDrop = (i: number) => i === 1;
	assert.equal(E.tapCell(g, 38, 20, isDot, isDrop), 0);
	assert.equal(E.tapCell(g, 46, 20, isDot, isDrop), 1, 'a direct hit on the open spot');
	assert.equal(E.tapCell(g, 42, 20, isDot, isDrop), 1);
	assert.equal(E.tapCell(g, 50, 20, isDot, null), 0);
	assert.equal(E.tapCell(g, 110, 20, isDot, isDrop), 3);
	assert.equal(E.tapCell(g, 20, 120, isDot, isDrop), -1);
});

test("taps on a dot by a bigger group's edge take the bigger group", () => {
	const g: E.TapGrid = { w: 4, h: 1, cell: 40, step: 44, reach: 42 };
	const isDot = () => true;
	const size = (i: number) => (i === 1 ? 1 : 3);
	const near = 44 * 0.75;
	assert.equal(E.tapCell(g, 64, 20, isDot, null, size, near), 1);
	assert.equal(E.tapCell(g, 82, 20, isDot, null, size, near), 2);
	assert.equal(E.tapCell(g, 47, 20, isDot, null, size, near), 0);
	assert.equal(E.tapCell(g, 82, 20, isDot, null), 1);
});

test('the tray always holds as many dots as there are open spots, so play never sticks', () => {
	const lv = LEVELS[LEVELS.length - 1];
	const { state, solution } = E.buildSolved(lv);
	const s = E.clone(state);
	const open = () => s.target.filter((c, k) => c >= 0 && !s.top[k] && !s.filled[k]).length;
	for (const a of solution.path) {
		assert.ok(E.move(s, a.sel, a.dst).ok);
		assert.equal(open(), s.tray.length);
		assert.equal(E.isStuck(s), false);
	}
});

test('a level\u2019s tray grows with its picture, tightens a little with difficulty, and the bigger one doubles it', () => {
	assert.ok(E.trayFor(528, 0) > E.trayFor(288, 0), 'a bigger picture, more room');
	assert.ok(E.trayFor(528, 1) < E.trayFor(528, 0), 'tighter when harder');
	assert.ok(E.trayFor(528, 1) >= 0.8 * E.trayFor(528, 0), 'but only a little');
	LEVELS.slice(0, 5).forEach((lv, i) => {
		const s = E.buildPuzzle(lv, i);
		const dots = s.target.filter((c) => c >= 0).length;
		assert.equal(s.trayCap, E.trayFor(dots, lv.difficulty ?? 0), lv.id);
		assert.equal(E.buildPuzzle(lv, i, { relaxed: true }).trayCap, 2 * s.trayCap, lv.id);
	});
});

test('a level is the same puzzle wherever it sits in play', () => {
	const lv = LEVELS[30];
	assert.deepEqual(E.buildPuzzle(lv, 30), E.buildPuzzle(lv, 3));
});
