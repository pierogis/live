import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as E from '../src/lib/mosaic/engine.ts';
import type { Level, State } from '../src/lib/mosaic/engine.ts';
import { loadLevels } from './levels.ts';

const LEVELS = loadLevels();

/** A tiny two-color picture with the dots placed by hand. */
function tiny(
	art: string[],
	top: number[],
	trayCap: number,
	palette: Record<string, string> = { A: '#000', B: '#fff' }
): State {
	const lv: Level = { id: 't', name: 't', palette, art };
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

			const sol = E.solve(s, 1, 1);
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
	for (const cell of [0, 1, 3, 2, 4])
		assert.ok(E.move(s, { from: 'board', cell }, { to: 'tray' }).ok);
	assert.deepEqual(
		s.tray.map((q) => q.c),
		[1, 1, 2, 2, 0]
	);
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
