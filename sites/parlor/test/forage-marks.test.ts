import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildPuzzle, type Level } from '../src/lib/forage/engine.ts';
import {
	LOCK_MARKS,
	linkColors,
	rails,
	type Len,
	type RailGrid,
	type Seg,
	type Spot
} from '../src/lib/forage/marks.ts';
import { contrast, inkOn } from '../src/lib/shared/ink.ts';
import { loadLevels, loadPacks } from './levels.ts';

test('forage: every food color gets count ink at WCAG AA (4.5:1) or better', () => {
	for (const pack of loadPacks<Level>('forage')) {
		for (const lv of pack.levels) {
			for (const hex of Object.values(lv.palette)) {
				const ratio = contrast(hex, inkOn(hex));
				assert.ok(ratio >= 4.5, `${lv.id} ${hex}: ${ratio.toFixed(2)}`);
			}
		}
	}
});

/** Five lanes with every spot taken down to `depths[col]`. */
const lanes = (depths = [9, 9, 9, 9, 9]): RailGrid => ({
	cols: depths.length,
	rows: 3,
	taken: (col, depth) => depth < depths[col],
	channels: true
});
/** A length at the desktop sizes: 52px slots, 12px gaps, 8px padding. */
const px = (v: Len) => v.lanes * 64 + v.slots * 52 + v.pads * 8 + v.px;
/** The same at the phone sizes: 44px slots, 12px gaps, 6px padding. */
const phonePx = (v: Len) => v.lanes * 56 + v.slots * 44 + v.pads * 6 + v.px;
const box = (s: Seg) => [px(s.x), px(s.y), px(s.w), px(s.h)];
const join = (members: Spot[], grid = lanes()) => rails([{ g: 1, members }], grid)[0]?.segs ?? [];

test('forage: side-by-side members get one straight rail between their rings', () => {
	const segs = join([
		{ col: 0, depth: 0 },
		{ col: 1, depth: 0 }
	]);
	// From the first ring (colony edge 44 + 2px gap) to the second's (72 - 2), centered on the row.
	assert.deepEqual(segs.map(box), [[46, 24, 24, 4]]);
});

test('forage: members back to back in one lane get one short bar straight between their rings', () => {
	const segs = join([
		{ col: 1, depth: 0 },
		{ col: 1, depth: 1 },
		{ col: 3, depth: 0 }
	]);
	// From the first ring's bottom (26 + 20) to the second's top (78 - 20), down the lane's middle.
	assert.ok(segs.map(box).some((b) => b.join() === [64 + 24, 46, 4, 12].join()));
});

test('forage: members a lane apart at different depths get one step down the gap between', () => {
	const segs = join([
		{ col: 0, depth: 0 },
		{ col: 1, depth: 2 }
	]);
	assert.equal(segs.length, 3);
	// The upright runs down the middle of the 12px gap (52..64).
	const upright = segs.find((s) => px(s.h) > px(s.w))!;
	assert.equal(px(upright.x) + px(upright.w) / 2, 58);
});

test('forage: rails stay whole pixels, off colonies, and in the gaps and the strip above the lanes', () => {
	const cases: Spot[][] = [
		[
			{ col: 0, depth: 0 },
			{ col: 3, depth: 0 }
		],
		[
			{ col: 1, depth: 2 },
			{ col: 4, depth: 0 }
		],
		[
			{ col: 0, depth: 0 },
			{ col: 2, depth: 1 },
			{ col: 3, depth: 5 }
		],
		[
			{ col: 0, depth: 1 },
			{ col: 1, depth: 0 },
			{ col: 2, depth: 2 },
			{ col: 4, depth: 1 }
		]
	];
	for (const members of cases) {
		const segs = join(members);
		assert.ok(segs.length > 0);
		for (const s of segs) {
			for (const v of [s.x, s.y, s.w, s.h]) {
				assert.ok(Number.isInteger(px(v)) && Number.isInteger(phonePx(v)), JSON.stringify(s));
			}
			assert.ok(px(s.w) > 0 && px(s.h) > 0);
			// Never over another colony: a colony (with its ring) spans 4..48 of a lane and of a row.
			for (let col = 0; col < 5; col++) {
				for (let depth = 0; depth < 3; depth++) {
					if (members.some((m) => m.col === col && m.depth === depth)) continue;
					const [x, y] = [col * 64 + 4, depth * 52 + 4];
					const over =
						px(s.x) < x + 44 && px(s.x) + px(s.w) > x && px(s.y) < y + 44 && px(s.y) + px(s.h) > y;
					assert.ok(!over, `${JSON.stringify(members)} crosses ${col}:${depth}`);
				}
			}
		}
	}
	for (const members of cases) {
		for (const s of join(members)) {
			const [x, y, w, h] = box(s);
			// Nothing under the rows, where the lanes' counts are.
			assert.ok(y + h <= 3 * 52, `${members.map((m) => `${m.col}:${m.depth}`)} below the rows`);
			if (w > h) {
				// Across: along the strip above the lanes (6px up), or a step from a colony to a gap.
				const strip = Math.abs(y + h / 2 + 6) <= 3;
				assert.ok(
					strip || w <= 26,
					`${members.map((m) => `${m.col}:${m.depth}`)} across ${box(s)}`
				);
			} else {
				// Down: in a gap (52..64 of each pitch), or up from a front colony to the strip.
				const mid = (((x + w / 2) % 64) + 64) % 64;
				assert.ok(
					(mid >= 52 && mid <= 64) || y + h <= 8,
					`${members.map((m) => `${m.col}:${m.depth}`)} down ${box(s)}`
				);
			}
		}
	}
	// A member out of sight gets no rail: lanes 0 and 2 are joined, and nothing reaches lane 3.
	const segs = join(cases[2]);
	assert.ok(segs.length > 0);
	assert.ok(segs.every((s) => px(s.x) + px(s.w) <= 2 * 64 + 26));
});

test('forage: rails of two groups that share a gap run side by side', () => {
	const laid = rails(
		[
			{
				g: 1,
				members: [
					{ col: 0, depth: 0 },
					{ col: 1, depth: 2 }
				]
			},
			{
				g: 2,
				members: [
					{ col: 0, depth: 2 },
					{ col: 1, depth: 0 }
				]
			}
		],
		lanes()
	);
	const area = (s: Seg) => [px(s.x), px(s.y), px(s.x) + px(s.w), px(s.y) + px(s.h)];
	for (const a of laid[0].segs.map(area)) {
		for (const b of laid[1].segs.map(area)) {
			const overlap = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
			const overlapY = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
			// Crossing is fine; running over each other isn't.
			assert.ok(!(overlap > 4 && overlapY > 4), `${a} over ${b}`);
			assert.ok(
				!(
					overlap > 0 &&
					overlapY > 0 &&
					(a[2] - a[0] === b[2] - b[0] || a[3] - a[1] === b[3] - b[1]) &&
					Math.max(overlap, overlapY) > 4
				),
				`${a} along ${b}`
			);
		}
	}
});

test('forage: every level gives each of its linked groups its own color', () => {
	let levels = 0;
	loadLevels<Level>('forage').forEach((lv, i) => {
		const deal = buildPuzzle(lv, i);
		const colors = linkColors(deal);
		const ids = new Set(deal.columns.flat().flatMap((e) => (e.link === undefined ? [] : [e.link])));
		assert.equal(colors.size, ids.size);
		assert.equal(new Set(colors.values()).size, ids.size, `${lv.id}: ${ids.size} groups`);
		for (const c of colors.values()) assert.ok(!LOCK_MARKS.includes(c));
		levels++;
	});
	assert.ok(levels > 0);
});
