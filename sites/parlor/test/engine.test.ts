import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as E from '../src/lib/mosaic/engine.ts';
import { reportLevel } from '../src/lib/mosaic/report.ts';
import { loadLevels } from './levels.ts';

const LEVELS = loadLevels();

/** A tiny two-color picture with the dots placed by hand. */
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

			// The top layer uses exactly the picture's colors, just moved around.
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

			// The same solve the build used to keep this shuffle.
			const sol = E.solve(s, 2, s.attempt! + 1);
			assert.ok(sol, `solvable with tray ${s.trayCap}`);
			const r = E.clone(s);
			for (const a of sol.path) assert.ok(E.move(r, a.sel, a.dst).ok);
			assert.ok(E.isWon(r) && r.tray.length === 0, 'picture complete, tray empty');
		});
	});
}

test('two taps: pick up, then put down where it fits', () => {
	// Spots need A B B; dots start as B A B.
	const s = tiny(['ABB'], [1, 0, 1], 1);
	const before = JSON.stringify(s);
	assert.equal(E.move(s, { from: 'board', cell: 0 }, { to: 'spot', cell: 1 }).ok, false);
	assert.equal(JSON.stringify(s), before, 'a failed move changes nothing');

	assert.ok(E.move(s, { from: 'board', cell: 0 }, { to: 'tray' }).ok); // park B, opens the A spot
	const full = E.move(s, { from: 'board', cell: 1 }, { to: 'tray' });
	assert.ok(!full.ok && full.reason === 'tray-full');
	const covered = E.move(s, { from: 'board', cell: 1 }, { to: 'spot', cell: 2 });
	assert.ok(!covered.ok && covered.reason === 'covered');
	assert.ok(E.move(s, { from: 'board', cell: 1 }, { to: 'spot', cell: 0 }).ok); // A into the A spot
	const r = E.move(s, { from: 'tray', color: 1 }, { to: 'spot', cell: 1 });
	assert.ok(r.ok && r.fromTray.length === 1 && s.tray.length === 0);
	assert.ok(E.move(s, { from: 'board', cell: 2 }, { to: 'tray' }).ok);
	const filled = E.move(s, { from: 'tray', color: 1 }, { to: 'spot', cell: 0 });
	assert.ok(!filled.ok && filled.reason === 'filled');
	assert.ok(E.move(s, { from: 'tray', color: 1 }, { to: 'spot', cell: 2 }).ok);
	assert.ok(E.isWon(s));
});

test('more dots than room: the ones closest to the picked dot move', () => {
	// Row 0 needs A A A A B B, row 1 needs B B B B A A. Dots: row 0 all B, row 1 all A.
	const s = tiny(['AAAABB', 'BBBBAA'], [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0], 2);
	let r = E.move(s, { from: 'board', cell: 5 }, { to: 'tray' });
	assert.ok(r.ok && r.toTray.length === 2 && r.left === 4, 'tray takes 2');
	assert.deepEqual(r.toTray.map((p) => p.from).sort(), [4, 5]);
	// The rest of the row-0 B group onto the open B spots (4, 5): 2 move, from the picked end.
	r = E.move(s, { from: 'board', cell: 0 }, { to: 'spot', cell: 5 });
	assert.ok(r.ok && r.toBoard.length === 2 && r.left === 2);
	assert.deepEqual(r.toBoard.map((p) => p.from).sort(), [0, 1], 'dots nearest the picked dot move');
	assert.equal(r.toBoard[0].cell, 5, 'first dot lands on the tapped spot');
	assert.ok(s.top[r.leftCell], 'leftover dot still on the board');
});

test('fewer dots than spots: they fill the spots closest to the tapped one', () => {
	const s = tiny(['AAAAB'], [1, 1, 1, 1, 0], 4);
	assert.ok(E.move(s, { from: 'board', cell: 0 }, { to: 'tray' }).ok); // opens A spots 0..3
	const r = E.move(s, { from: 'board', cell: 4 }, { to: 'spot', cell: 2 });
	assert.ok(r.ok && r.toBoard.length === 1 && r.toBoard[0].cell === 2);
});

test("dots that the tapped area has no room for go on to the color's other open spots", () => {
	// Row 0 needs A B A B A, row 1 needs C x5. Dots: row 0 C B C B C, row 1 A A A B B.
	const s = tiny(['ABABA', 'CCCCC'], [2, 1, 2, 1, 2, 0, 0, 0, 1, 1], 5, {
		A: '#000',
		B: '#fff',
		C: '#f00'
	});
	// Lifting one C to the tray gathers the other two (it has room).
	const lift = E.move(s, { from: 'board', cell: 0 }, { to: 'tray' });
	assert.ok(lift.ok && lift.toTray.length === 3);
	// A spots 0, 2 and 4 are open and don't touch. The three A dots dropped on spot 4 fill
	// it, then the others, nearest first.
	assert.deepEqual(E.dropSpots(s, 4), [4, 2, 0]);
	const r = E.move(s, { from: 'board', cell: 5 }, { to: 'spot', cell: 4 });
	assert.ok(r.ok && r.left === 0);
	assert.deepEqual(
		r.toBoard.map((p) => p.cell),
		[4, 2, 0]
	);
});

test("with room to spare, more of the color's board dots come too, nearest first, never the tray's", () => {
	// Row 0 needs A x6, row 1 needs B x6. Dots: row 0 all B, row 1 A B B A B A.
	const s = tiny(['AAAAAA', 'BBBBBB'], [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0], 12);
	// An A in the tray: with one slot free, only the picked one goes.
	s.trayCap = 1;
	assert.ok(E.move(s, { from: 'board', cell: 11 }, { to: 'tray' }).ok);
	s.trayCap = 12;
	assert.ok(E.move(s, { from: 'board', cell: 0 }, { to: 'tray' }).ok); // opens A spots 0..5
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
	const s = tiny(['AB', 'BA'], [1, 0, 0, 1], 4); // dots B A / A B
	assert.equal(E.groupAt(s, 0)!.cells.length, 2, 'B dots touching at the corner form one group');
	assert.ok(E.move(s, { from: 'board', cell: 0 }, { to: 'tray' }).ok); // opens spots 0 and 3
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
	// One slot free: just the picked B. Then the rest, each gathering its color's others.
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
	// Dots: A B A B A, the A's apart. Picking up the middle A with 2 slots free takes it and
	// one of the others.
	const s = tiny(['ABABA'], [0, 1, 0, 1, 0], 2);
	assert.equal(E.parkCount(s, { from: 'board', cell: 2 }), 2);
	const r = E.move(s, { from: 'board', cell: 2 }, { to: 'tray' });
	assert.ok(r.ok && r.toTray.length === 2 && r.toTray[0].from === 2);
	assert.ok(s.top[0] || s.top[4], 'one A is left on the board');
});

test('leftovers stay in hand, even when a drop splits them apart', () => {
	// Row 0 needs A x5, row 1 needs B x5. Dots: row 0 all B, row 1 all A.
	const s = tiny(['AAAAA', 'BBBBB'], [1, 1, 1, 1, 1, 0, 0, 0, 0, 0], 1);
	assert.ok(E.move(s, { from: 'board', cell: 7 }, { to: 'tray' }).ok); // opens B spot 7
	const g = E.groupAt(s, 2)!.cells;
	const r = E.move(s, { from: 'board', cell: 2, cells: g }, { to: 'spot', cell: 7 });
	assert.ok(
		r.ok && r.toBoard.length === 1 && r.toBoard[0].from === 2,
		'the picked-up dot goes first'
	);
	assert.equal(r.leftCells!.length, 4, 'four dots stay in hand');
	const hand = E.selectionDots(s, { from: 'board', cell: r.leftCell, cells: r.leftCells });
	assert.equal(hand!.length, 4);
	assert.ok(E.groupAt(s, r.leftCell)!.cells.length < 4, 'they no longer touch');
});

test('same level always gives the same puzzle', () => {
	const a = E.buildPuzzle(LEVELS[0], 0);
	const b = E.buildPuzzle(LEVELS[0], 0);
	assert.deepEqual(a.top, b.top);
});

test('the report judges a level by the solve that kept its shuffle', () => {
	LEVELS.slice(0, 3).forEach((lv, i) => {
		const { state, solution } = E.buildSolved(lv, i);
		assert.equal(state.trayCap, E.BUILD_TRAY);
		assert.deepEqual(
			{ ...state, trayCap: E.TRAY },
			E.buildPuzzle(lv, i),
			'the same puzzle the game plays, with its wider tray'
		);
		// Replaying the build's own path wins, even if plain greedy play would not.
		const r = E.clone(state);
		for (const a of solution.path) assert.ok(E.move(r, a.sel, a.dst).ok);
		assert.ok(E.isWon(r));
		const rep = reportLevel(lv, i);
		assert.deepEqual(rep.problems, []);
		assert.equal(rep.moves, solution.path.length);
		assert.equal(rep.parks, solution.path.filter((a) => a.dst.to === 'tray').length);
		assert.equal(rep.shuffle, state.attempt);
	});
});

test('taps: a direct hit wins, a near miss snaps to the nearest useful cell', () => {
	// One row: a dot, an open spot for the dots in hand, a filled spot, a dot.
	// Cells are 40px with 4px gaps; centers at 20, 64, 108, 152.
	const g: E.TapGrid = { w: 4, h: 1, cell: 40, step: 44, reach: 42 };
	const isDot = (i: number) => i === 0 || i === 3;
	const isDrop = (i: number) => i === 1;
	// Inside the dot's square, near its edge: still the dot, though near misses prefer the open spot.
	assert.equal(E.tapCell(g, 38, 20, isDot, isDrop), 0);
	assert.equal(E.tapCell(g, 46, 20, isDot, isDrop), 1, 'a direct hit on the open spot');
	// In the gap between them: the open spot gets the preference.
	assert.equal(E.tapCell(g, 42, 20, isDot, isDrop), 1);
	// Nothing in hand: the open spot isn't useful, so a tap on it snaps to the nearest dot.
	assert.equal(E.tapCell(g, 50, 20, isDot, null), 0);
	// A filled spot isn't useful: the nearest useful cell wins.
	assert.equal(E.tapCell(g, 110, 20, isDot, isDrop), 3);
	// Off the board and out of reach: nothing.
	assert.equal(E.tapCell(g, 20, 120, isDot, isDrop), -1);
});

test('greedy play takes the first listed action, without listing the rest', () => {
	LEVELS.slice(0, 4).forEach((lv, i) => {
		const s = E.buildPuzzle(lv, i);
		for (let step = 0; step < 120 && !E.isWon(s); step++) {
			const best = E.bestAction(s);
			assert.deepEqual(best, E.actions(s)[0] ?? null, `${lv.id} step ${step}`);
			assert.ok(E.move(s, best!.sel, best!.dst).ok);
		}
	});
});

test('the tray always holds as many dots as there are open spots, so play never sticks', () => {
	const lv = LEVELS[LEVELS.length - 1];
	const { state, solution } = E.buildSolved(lv, LEVELS.length - 1);
	const s = E.clone(state);
	const open = () => s.target.filter((c, k) => c >= 0 && !s.top[k] && !s.filled[k]).length;
	for (const a of solution.path) {
		assert.ok(E.move(s, a.sel, a.dst).ok);
		assert.equal(open(), s.tray.length);
		assert.equal(E.isStuck(s), false);
	}
});

test('blobs grow all through play, from about half the tray to over twice it', () => {
	let last = E.blobSizes(0);
	assert.ok(last.max < 2 * E.BUILD_TRAY && last.min < E.BUILD_TRAY);
	for (let i = 1; i <= E.LAST_LEVEL; i++) {
		const b = E.blobSizes(i);
		assert.ok(b.min >= last.min && b.max >= last.max && b.min < b.max, `level ${i + 1}`);
		last = b;
	}
	assert.ok(E.blobSizes(E.LAST_LEVEL).max > E.blobSizes(150).max, 'still growing late in play');
	assert.ok(last.max > 2 * E.BUILD_TRAY);
	assert.deepEqual(E.blobSizes(E.LAST_LEVEL + 50), last, 'and stops at the last level');
});
