import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { Clock, compose, songProblem, type SongSettings } from '../src/lib/shared/sound.ts';

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

test('most songs stay gentle, about one in five gets adventurous', () => {
	let gentle = 0;
	let wild = 0;
	for (let seed = 1; seed <= 400; seed++) {
		const { spice } = compose(seed).style;
		if (spice < 0.2) gentle++;
		if (spice >= 0.8) wild++;
	}
	assert.ok(gentle > 200 && gentle < 280, `gentle ${gentle}`);
	assert.ok(wild > 50 && wild < 110, `adventurous ${wild}`);
});

test('a level\u2019s song settings take over from its seed', () => {
	const s = compose(7, 0, true, { mode: 'dorian', spice: 'adventurous', meter: 3 });
	assert.equal(s.home.scale.join(), '0,2,3,5,7,9,10');
	assert.equal(s.style.spice, 0.9);
	assert.equal(s.style.meter, 3);
	assert.equal(compose(7, 0, false, { meter: 3 }).style.meter, 4, 'only a game with a feel');
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

test('every level’s song settings are ones a song can have', () => {
	for (const game of ['mosaic', 'forage']) {
		const dir = new URL(`../src/lib/${game}/levels/`, import.meta.url);
		for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
			const { levels } = JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as {
				levels: { id: string; song?: SongSettings }[];
			};
			for (const l of levels) {
				assert.ok(l.song, `${game} ${l.id} has no song settings`);
				assert.equal(songProblem(l.song), null, `${game} ${l.id}`);
			}
		}
	}
});

test('songs that share notes and a theme stay on those notes, on one motif', () => {
	const G = new Set([7, 9, 11, 0, 2, 4, 6]);
	for (const mode of ['major', 'dorian', 'mixolydian', 'lydian', 'minor', 'phrygian']) {
		for (let seed = 1; seed <= 40; seed++) {
			const s = compose(seed, seed % 3, true, { notes: 'G', theme: 'a-mural', mode });
			for (const n of s.notes) {
				const midi = n.key.tonic + n.key.scale[((n.deg % 7) + 7) % 7];
				assert.ok(G.has(((midi % 12) + 12) % 12), `${mode} seed ${seed}`);
			}
		}
	}
	assert.equal(compose(3, 0, false, { notes: 'G', mode: 'dorian' }).home.tonic % 12, 9);
});
