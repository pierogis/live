import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Clock, compose } from '../src/lib/shared/sound.ts';

const BAR = { 3: 12, 4: 16, 5: 20, 7: 14 } as const;
const songs = (fn: (s: ReturnType<typeof compose>, seed: number) => void) => {
	for (let seed = 1; seed <= 400; seed++) {
		for (const feel of [false, true])
			for (let pass = 0; pass < 2; pass++) fn(compose(seed, pass, feel), seed);
	}
};

test('every bar of every song fills its meter', () => {
	songs((s, seed) => {
		const bars = new Map<number, number>();
		for (const n of s.notes) bars.set(n.bar, (bars.get(n.bar) ?? 0) + n.len);
		assert.equal(bars.size, 32, `seed ${seed}`);
		for (const [b, len] of bars) assert.equal(len, BAR[s.style.meter], `seed ${seed} bar ${b}`);
	});
});

test('notes stay in a singable range and start bars on chords', () => {
	songs((s, seed) => {
		for (const n of s.notes) {
			const midi = n.key.tonic + 12 * Math.floor(n.deg / 7) + n.key.scale[((n.deg % 7) + 7) % 7];
			assert.ok(Number.isFinite(midi) && midi >= 48 && midi <= 100, `seed ${seed}: ${midi}`);
			if (n.downbeat) assert.ok(n.chord && !n.rest, `seed ${seed}`);
		}
	});
});

test('every song ends on its tonic over the I chord', () => {
	songs((s, seed) => {
		const last = s.notes[s.notes.length - 1];
		assert.equal(last.root, 0, `seed ${seed}`);
		assert.equal(((last.deg % 7) + 7) % 7, 0, `seed ${seed}`);
		assert.ok(last.chord && !last.rest, `seed ${seed}`);
	});
});

test('some songs stay gentle and some get adventurous', () => {
	let gentle = 0;
	let rich = 0;
	for (let seed = 1; seed <= 400; seed++) {
		const s = compose(seed);
		if (s.style.spice < 0.2) gentle++;
		if (s.notes.some((n) => n.seventh || n.rest)) rich++;
	}
	assert.ok(gentle > 80 && gentle < 200, `gentle ${gentle}`);
	assert.ok(rich > 200, `rich ${rich}`);
});

test('the gear follows the pace of moves, without flickering', () => {
	const c = new Clock();
	c.start(0, 100);
	assert.equal(c.gear, 2);
	let t = 1e6;
	const tap = (...gaps: number[]) => {
		for (const g of gaps) c.paced((t += g));
	};
	tap(0, 3000, 3000);
	assert.equal(c.gear, 4, 'slow moves land in quarter notes');
	tap(2000, 2000);
	assert.equal(c.gear, 4, 'a little quicker stays in quarters');
	tap(1500, 1500);
	assert.equal(c.gear, 2, 'back to eighths');
	tap(300, 300);
	assert.equal(c.gear, 2, 'never quicker than eighths');
	tap(5000);
	assert.equal(c.gear, 2, 'one pause doesn\u2019t change the gear');
});

test('the gear follows how many things are on their way', () => {
	const c = new Clock();
	c.start(0, 100);
	c.crowd(2);
	assert.equal(c.gear, 4);
	c.crowd(5);
	assert.equal(c.gear, 4, 'stays in quarters until clearly busier');
	c.crowd(8);
	assert.equal(c.gear, 2);
	c.crowd(30);
	assert.equal(c.gear, 2, 'never quicker than eighths');
	c.crowd(4);
	assert.equal(c.gear, 2, 'stays in eighths until clearly quieter');
	c.crowd(3);
	assert.equal(c.gear, 4);
});
