import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Picture } from '../src/lib/shared/level.ts';
import { Clock, compose, songProblem } from '../src/lib/shared/sound.ts';
import { loadLevels } from './levels.ts';

const BAR = { 3: 12, 4: 16, 5: 20, 7: 14 } as const;
const songs = (fn: (s: ReturnType<typeof compose>, seed: number) => void) => {
	for (let seed = 1; seed <= 400; seed++) {
		for (const feel of [false, true])
			for (let pass = 0; pass < 2; pass++) fn(compose(seed, pass, feel), seed);
	}
};

test('every bar of every song fills its meter (its section\u2019s, when that changes)', () => {
	songs((s, seed) => {
		const bars = new Map<number, number>();
		const meters = new Map<number, keyof typeof BAR>();
		for (const n of s.notes) {
			bars.set(n.bar, (bars.get(n.bar) ?? 0) + n.len);
			meters.set(n.bar, n.meter ?? s.style.meter);
		}
		assert.equal(bars.size, 32, `seed ${seed}`);
		for (const [b, len] of bars) assert.equal(len, BAR[meters.get(b)!], `seed ${seed} bar ${b}`);
	});
});

test('a song changes meter rarely, only in C, and only where the game has a feel', () => {
	let turned = 0;
	for (let seed = 1; seed <= 400; seed++) {
		assert.ok(
			compose(seed, 0, false).notes.every((n) => !n.meter),
			`seed ${seed}`
		);
		const s = compose(seed, 0, true);
		const off = s.notes.filter((n) => n.meter);
		if (off.length) turned++;
		for (const n of off) assert.ok(n.bar >= 16 && n.bar < 24, `seed ${seed} bar ${n.bar}`);
	}
	assert.ok(turned > 20 && turned < 100, `${turned} of 400 change meter`);
});

test('each song keeps one tempo, a little quicker or slower than the game\u2019s beat', () => {
	const paces = new Set<number>();
	for (let seed = 1; seed <= 200; seed++) {
		const { pace } = compose(seed, 0, true).style;
		assert.ok(pace >= 0.88 && pace <= 1.12, `seed ${seed}: ${pace}`);
		assert.equal(compose(seed, 3, true).style.pace, pace, 'the same every pass');
		paces.add(Math.round(pace * 20));
	}
	assert.ok(paces.size >= 4, 'tempos spread out');
});

test('a light feel swings only a little', () => {
	let swung = 0;
	for (let seed = 1; seed <= 400; seed++) {
		const { swing } = compose(seed, 0, 'light').style;
		assert.ok(swing <= 0.16, `seed ${seed}: ${swing}`);
		if (swing) swung++;
	}
	assert.ok(swung > 20, `${swung} swung`);
});

test('the tune rests now and then, and A comes back changed but recognizable', () => {
	let rests = 0;
	let notes = 0;
	for (let seed = 1; seed <= 200; seed++) {
		const s = compose(seed, 0, true);
		rests += s.notes.filter((n) => n.rest).length;
		notes += s.notes.length;
		const bar = (b: number) =>
			s.notes.filter((n) => n.bar === b).map((n) => `${n.deg}:${n.len}:${!!n.rest}`);
		const lens = (b: number) => s.notes.filter((n) => n.bar === b).map((n) => n.len);
		assert.deepEqual(lens(24), lens(0), `seed ${seed}`);
		const rest = (from: number) => [1, 2, 3, 4, 5, 6, 7].map((k) => bar(from + k).join()).join('|');
		if (seed <= 50) assert.notEqual(rest(24), rest(0), `seed ${seed}`);
	}
	assert.ok(rests / notes > 0.03, `${((100 * rests) / notes).toFixed(1)}% rests`);
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
	for (const game of ['mosaic', 'forage'] as const) {
		for (const l of loadLevels<Picture>(game)) {
			assert.ok(l.song, `${game} ${l.id} has no song settings`);
			assert.equal(songProblem(l.song), null, `${game} ${l.id}`);
		}
	}
});

test('songs that share notes and a theme stay on those notes, on one motif', () => {
	const G = new Set([7, 9, 11, 0, 2, 4, 6]);
	const modes = ['major', 'dorian', 'mixolydian', 'lydian', 'minor', 'phrygian'];
	for (const mode of [...modes, 'pentatonic', 'minor-pentatonic', 'yo', 'in']) {
		for (let seed = 1; seed <= 40; seed++) {
			const spice = seed % 2 ? 'gentle' : 'lively';
			const s = compose(seed, seed % 3, true, { notes: 'G', theme: 'a-mural', mode, spice });
			for (const n of s.notes) {
				const midi = n.key.tonic + n.key.scale[((n.deg % 7) + 7) % 7];
				assert.ok(G.has(((midi % 12) + 12) % 12), `${mode} seed ${seed}`);
			}
		}
	}
	assert.equal(compose(3, 0, false, { notes: 'G', mode: 'dorian' }).home.tonic % 12, 9);
});

test('an adventurous song colors outside its key a little, passing notes off the beat', () => {
	const G = new Set([7, 9, 11, 0, 2, 4, 6]);
	let outside = 0;
	let total = 0;
	let colored = 0;
	for (let seed = 1; seed <= 200; seed++) {
		const fix = { notes: 'G', theme: 'a-mural', mode: 'major', spice: 'adventurous' };
		const s = compose(seed, seed % 3, true, fix);
		let pos = 0;
		let any = false;
		for (const n of s.notes) {
			pos = n.downbeat ? 0 : pos;
			if (!n.rest) {
				const midi = n.key.tonic + n.key.scale[((n.deg % 7) + 7) % 7] + (n.alt ?? 0);
				total++;
				if (!G.has(((midi % 12) + 12) % 12)) {
					outside++;
					any = true;
				}
				if (n.alt) assert.ok(!n.downbeat && pos % 4 !== 0, `seed ${seed}: passing note on a beat`);
			}
			pos += n.len;
		}
		if (any) colored++;
	}
	assert.ok(outside / total < 0.2, `${((100 * outside) / total).toFixed(1)}% of notes outside`);
	assert.ok(colored > 120, `${colored} of 200 colored`);
});

test('songs on one theme open on its motif, in its rhythm', () => {
	const opening = (seed: number) => {
		const s = compose(seed, 0, false, { notes: 'G', theme: 'a-mural', mode: 'dorian' });
		return s.notes
			.filter((n) => n.bar < 2)
			.map((n) => n.len)
			.join();
	};
	const all = new Set(Array.from({ length: 20 }, (_, k) => opening(k + 1)));
	assert.equal(all.size, 1, [...all].join(' / '));
});
