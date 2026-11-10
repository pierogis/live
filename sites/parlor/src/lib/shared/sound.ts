/*
 * A little synth that plays a tune as you play, no sound files.
 *
 * Each level writes its own song: a key and a mode, and 32 bars in eight
 * phrases, A A′ B B′ C C′ A A′. A is the level's theme over one chord loop;
 * A′ starts the same and comes home to the tonic through the V chord. B goes on
 * over another loop and comes home too; C goes somewhere else, another key or
 * mode, and leaves it open for A to come back. Each time through, the song
 * keeps its A and writes a new B and C. Each thing that lands plays the song's
 * next note right then, so the tune keeps its order and play sets its rhythm;
 * only progress moves it on (Mosaic's dots going to the tray play quietly).
 *
 * The level keeps one beat (`Clock`), in sixteenth notes of the game's pace
 * (100 ms, Forage's ticks and two of Mosaic's dots), and the games land things on its
 * eighth notes: Forage's ants get to their blocks on them and walk in step,
 * Mosaic's dots cascade in on them, a move's first flying a little longer or
 * shorter to land on one. So the tune keeps time from move to move. The beat
 * follows the player, a little quicker when moves come quickly and calmer when
 * they come slowly, changing on a beat so it never jumps. The tune plays on in
 * its own rhythm, a quarter note four sixteenths on, and landings between tune
 * notes play a quiet chord pattern below. (A tune note on every one is too
 * much to hear as a tune.) Each bar brings in its chord, low and soft, in one
 * of a few ways (together, rolled, its bass alone, an eighth late) in the
 * inversion nearest the last, and lets it ring until the next bar's comes in,
 * breathing on the beat, so the pauses between moves sound held, and in time,
 * rather than empty. A pause also ends the phrase: the next note starts the
 * next bar, chord and all, so each burst of moves is a phrase of its own.
 *
 * Quick moves swell it: each warms the music, and the warmth cools over a few
 * seconds. Warm, the tune is brighter and louder and doubled an octave up, and
 * the chords grow and gain an octave.
 *
 * The flourishes are the tune's own, each a different stretch of it: something
 * opening plays a glimpse of its next bar, soft; finishing a color swells the
 * music and sweeps up into the tune running on ahead to a bar's first beat; a
 * finished picture plays the song's own ending, V to I, so it always ends at
 * home. Each starts on a beat.
 *
 * Each color has its own voice, close kin rather than different instruments: see
 * `timbre`.
 */
import { makeRng, pickOne, type Rng } from './engine.ts';
import { lab } from './palette.ts';

/**
 * Scales as semitones above the tonic, with chord loops as scale degrees, and
 * the keys a song's contrasting section can go to: a mode and its tonic, in
 * semitones from home.
 */
const MODES: Record<string, { scale: number[]; loops: number[][]; away: [string, number][] }> = {
	major: {
		scale: [0, 2, 4, 5, 7, 9, 11],
		// I vi IV V, I IV vi V, I V vi IV, I iii IV V, I vi ii V, I IV I V
		loops: [
			[0, 5, 3, 4],
			[0, 3, 5, 4],
			[0, 4, 5, 3],
			[0, 2, 3, 4],
			[0, 5, 1, 4],
			[0, 3, 0, 4]
		],
		// The relative minor, the IV key, the same tonic a little bluesy, ii as a home
		away: [
			['minor', -3],
			['major', 5],
			['mixolydian', 0],
			['dorian', 2]
		]
	},
	mixolydian: {
		scale: [0, 2, 4, 5, 7, 9, 10],
		loops: [
			[0, 6, 3, 0],
			[0, 3, 6, 4],
			[0, 4, 6, 3]
		],
		away: [
			['major', 5],
			['minor', -3],
			['major', 0]
		]
	},
	dorian: {
		scale: [0, 2, 3, 5, 7, 9, 10],
		loops: [
			[0, 3, 0, 6],
			[0, 6, 3, 4],
			[0, 1, 3, 0]
		],
		away: [
			['major', -2],
			['mixolydian', 5],
			['minor', 0]
		]
	},
	minor: {
		scale: [0, 2, 3, 5, 7, 8, 10],
		loops: [
			[0, 5, 6, 4],
			[0, 3, 6, 2],
			[0, 5, 2, 6],
			[0, 6, 5, 4],
			[0, 3, 4, 0]
		],
		away: [
			['major', 3],
			['minor', 5],
			['major', -4],
			['dorian', 0]
		]
	}
};
/** Majors come up more often: the site is calm, not moody. */
const MODE_ODDS = ['major', 'major', 'major', 'mixolydian', 'dorian', 'minor'];
/** Tonics as MIDI notes, C4 to F4, so the tune sits an octave above them. */
const TONICS = [60, 61, 62, 63, 64, 65];

/** About how long a flourish's sixteenth note is, in seconds; it's a whole number of the game's. */
const UNIT = 0.09;
/** How long a bar's chord rings, unless the next bar's comes in first. */
const BAR = 5;
/** The held chord breathes on the beat: at its low, it's this much quieter. */
const BREATH = 0.3;
/** The breath's beat is the shortest of 4, 8, 16... sixteenths at least this long (ms). */
const BREATH_MIN = 300;
/**
 * A pause this long (seconds) ends the bar: the next move starts the next one.
 * (Shorter, and pecking one dot at a time jumps a bar, chord and all, each peck.)
 */
const REST = 4;
/** Moves closer together than this (seconds) swell the music; slower ones barely do. */
const QUICK = 1;
/**
 * The tempo follows the player: its sixteenth stretches from this many times
 * the game's when moves come quickly to this many when they come slowly.
 */
const TEMPO_QUICK = 0.94;
const TEMPO_SLOW = 1.15;
/** Moves this far apart (ms, on average) are quick, and this far slow. */
const PACE_QUICK = 900;
const PACE_SLOW = 3500;
/** How fast the swell cools: it falls to about a third in this many seconds. */
const COOL = 5;
/** The tune's low-pass, cool and fully swelled (Hz). */
const TONE_REST = 4500;
const TONE_HOT = 12000;
/** How much louder the chords get, fully swelled: 1 + this times. */
const PAD_HOT = 0.8;

/** A bar's rhythm, in sixteenths. */
const RHYTHMS = [
	[4, 4, 4, 4],
	[4, 2, 2, 4, 4],
	[2, 2, 4, 2, 2, 4],
	[6, 2, 4, 4],
	[3, 3, 2, 4, 4],
	[2, 2, 2, 2, 4, 4],
	[4, 4, 2, 2, 4]
];
/** A phrase's last bar: it lands and holds. */
const ENDINGS = [
	[4, 4, 8],
	[2, 2, 4, 8],
	[6, 2, 8],
	[8, 8]
];

const mod7 = (d: number) => ((d % 7) + 7) % 7;
const isChordTone = (deg: number, root: number) => [0, 2, 4].includes(mod7(deg - root));

/** What the degrees are in: a tonic (MIDI) and a scale. */
interface Key {
	tonic: number;
	scale: number[];
}

interface Note {
	/** Scale degrees above the tonic. */
	deg: number;
	/** Sixteenths. */
	len: number;
	/** The chord under it, as a scale degree. */
	root: number;
	/** The first note of its bar. */
	downbeat: boolean;
	/** It brings its chord in: a bar's first note, and the tonic closing a cadence. */
	chord: boolean;
	/** Its bar in the song. */
	bar: number;
	key: Key;
	/** How its chord, if it brings one, comes in. */
	strike: Strike;
}

/** A placeholder, until `compose` puts a phrase's notes in its key. */
const NO_KEY: Key = { tonic: 60, scale: [] };

interface Song {
	home: Key;
	notes: Note[];
}

/**
 * How a bar's chord comes in, so they don't all land the same: all at once,
 * rolled up, just its bass (the tune implying the rest), or an eighth late.
 */
type Strike = 'block' | 'roll' | 'bass' | 'late';
const STRIKES: Strike[] = ['block', 'block', 'roll', 'roll', 'roll', 'bass', 'late', 'late'];

/** The nearest degree to `d` in `lo`..`hi` that `ok` takes, higher on a tie. */
function nearest(d: number, lo: number, hi: number, ok: (c: number) => boolean) {
	for (let k = 0; k <= 7; k++) {
		for (const c of [d + k, d - k]) if (c >= lo && c <= hi && ok(c)) return c;
	}
	return d;
}

/**
 * One bar of tune. Notes on the beat (the bar's first and middle) are chord
 * tones near the last note; the rest step along the bar's direction, now and
 * then turning back. A phrase's last bar ends on its chord's root (`open`),
 * or is a cadence (`home`): over the V chord to ti or re, then up or down a
 * step to the tonic, which brings in the I chord.
 */
function bar(
	r: Rng,
	rhythm: number[],
	root: number,
	prev: number,
	lo: number,
	hi: number,
	end?: 'open' | 'home'
): Note[] {
	let dir = r() < 0.5 ? 1 : -1;
	if (prev >= hi - 2) dir = -1;
	if (prev <= lo + 2) dir = 1;
	const out: Note[] = [];
	let pos = 0;
	let d = prev;
	rhythm.forEach((len, i) => {
		const n = {
			root,
			downbeat: i === 0,
			chord: i === 0,
			bar: 0,
			key: NO_KEY,
			strike: 'block' as Strike
		};
		if (end && i === rhythm.length - 1) {
			if (end === 'home') Object.assign(n, { root: 0, chord: true });
			d = nearest(d, lo, hi, (c) => mod7(c) === n.root);
		} else if (end === 'home' && i === rhythm.length - 2) {
			d = nearest(d, lo, hi, (c) => mod7(c) === 1 || mod7(c) === 6);
		} else if (pos % 8 === 0) {
			// A chord tone, a step or two along, rarely the same note twice.
			const near: number[] = [];
			for (let k = -4; k <= 4; k++) {
				const c = d + k;
				if (c >= lo && c <= hi && isChordTone(c, root) && (k !== 0 || i === 0)) near.push(c);
			}
			near.sort((a, b) => Math.abs(a - d - dir) - Math.abs(b - d - dir));
			d = near.length ? near[r() < 0.7 ? 0 : Math.min(1, near.length - 1)] : d;
		} else {
			const turn = r() < 0.2 ? -1 : 1;
			const step = r() < 0.8 ? 1 : 2;
			d += dir * turn * step;
			if (d > hi || d < lo) d -= 2 * dir * turn * step;
		}
		out.push({ ...n, deg: d, len });
		pos += len;
	});
	return out;
}

/** One phrase: four bars over the loop; one that comes `home` ends V to I instead. */
function phrase(
	r: Rng,
	loop: number[],
	rhythms: number[][],
	start: number,
	lo: number,
	hi: number,
	home: boolean
): Note[] {
	const out: Note[] = [];
	let prev = start;
	for (let b = 0; b < 4; b++) {
		const last = b === 3;
		const root = last && home ? 4 : loop[b];
		const ns = bar(r, rhythms[b], root, prev, lo, hi, last ? (home ? 'home' : 'open') : undefined);
		out.push(...ns);
		prev = ns[ns.length - 1].deg;
	}
	return out;
}

/** A phrase's bar rhythms: three bars, then an ending. */
function rhythms(r: Rng) {
	return [pickOne(RHYTHMS, r), pickOne(RHYTHMS, r), pickOne(RHYTHMS, r), pickOne(ENDINGS, r)];
}

/**
 * Two phrases over `loop` from the same seed, so they share their first three
 * bars and differ in how they end: `ends` says which come home.
 */
function pair(
	r: Rng,
	loop: number[],
	start: number,
	lo: number,
	hi: number,
	ends: [boolean, boolean]
) {
	const rh = rhythms(r);
	const s = Math.floor(r() * 2 ** 32) || 1;
	return ends.map((home) => phrase(makeRng(s), loop, rh, start, lo, hi, home));
}

/**
 * Pass `pass` through level `seed`'s song, 32 bars: A A′ B B′ C C′ A A′. A
 * is the level's theme, the same every pass, A′ bringing it home. B goes on
 * over another chord loop and comes home too; C goes somewhere else, another
 * key or mode, and leaves it open for A to come back. Each pass writes a new B
 * and C, so the song keeps changing around its theme.
 */
function compose(seed: number, pass = 0): Song {
	const r = makeRng(seed || 1);
	const name = pickOne(MODE_ODDS, r);
	const mode = MODES[name];
	const home: Key = { tonic: pickOne(TONICS, r), scale: mode.scale };
	const loop = pickOne(mode.loops, r);
	const [a, a2] = pair(r, loop, 6, 2, 10, [false, true]);

	const v = makeRng((Math.imul(seed || 1, 31) + Math.imul(pass + 1, 0x9e3779b1)) >>> 0 || 1);
	const loopB = pickOne(
		mode.loops.filter((l) => l !== loop),
		v
	);
	const [b, b2] = pair(v, loopB, a[a.length - 1].deg + 2, 4, 11, [false, true]);
	const [awayName, shift] = pickOne(mode.away, v);
	const away = MODES[awayName];
	const there: Key = { tonic: home.tonic + shift, scale: away.scale };
	const [c, c2] = pair(v, pickOne(away.loops, v), 5, 2, 10, [false, false]);

	const sections: [Note[], Key][] = [
		[a, home],
		[a2, home],
		[b, home],
		[b2, home],
		[c, there],
		[c2, there],
		[a, home],
		[a2, home]
	];
	let n = -1;
	const notes = sections.flatMap(([ns, key]) =>
		ns.map((x) => ({ ...x, key, bar: x.downbeat ? ++n : n }))
	);
	// Each bar's chord comes in its own way (a cadence's I chord, all at once).
	for (const x of notes) if (x.downbeat) x.strike = pickOne(STRIKES, v);
	return { home, notes };
}

// ---------- the synth ----------

/**
 * Where notes go: tune notes through `tone`, chord notes through `pad` and
 * `breath` (which `lfo` swells on the beat), all into `input`.
 */
interface Out {
	ctx: AudioContext;
	tone: BiquadFilterNode;
	pad: GainNode;
	breath: GainNode;
	input: GainNode;
	lfo?: OscillatorNode;
}

let actx: AudioContext | null = null;
/** The echo and limiter, built once: every output feeds them. */
let effects: AudioNode | null = null;
let echo: DelayNode | null = null;
let outs: Out | null = null;

/**
 * A soft echo, a cut below the lowest note (rumble small speakers only buzz
 * with), a gentle compressor that holds a crowd of notes together, and a
 * limiter after it, with headroom, that only catches peaks: so a lot at once
 * gets fuller, not louder or crushed. Returns their input.
 */
function buildEffects(ctx: AudioContext): AudioNode {
	const level = ctx.createGain();
	level.gain.value = 0.85;
	level.connect(ctx.destination);
	const limit = ctx.createDynamicsCompressor();
	limit.threshold.value = -3;
	limit.knee.value = 0;
	limit.ratio.value = 20;
	limit.attack.value = 0.002;
	limit.release.value = 0.1;
	limit.connect(level);
	const glue = ctx.createDynamicsCompressor();
	glue.threshold.value = -20;
	glue.knee.value = 12;
	glue.ratio.value = 3;
	glue.attack.value = 0.01;
	glue.release.value = 0.25;
	glue.connect(limit);
	const low = ctx.createBiquadFilter();
	low.type = 'highpass';
	low.frequency.value = 110;
	low.connect(glue);
	const dry = ctx.createGain();
	echo = ctx.createDelay(1);
	const back = ctx.createGain();
	const wet = ctx.createGain();
	back.gain.value = 0.25;
	wet.gain.value = 0.12;
	dry.connect(low);
	dry.connect(echo);
	echo.connect(back).connect(echo);
	echo.connect(wet).connect(low);
	return dry;
}

/**
 * The output: tune notes through a low-pass that opens as the music swells,
 * chords through a gain that grows with it and one that breathes, then the
 * effects. `hush` cuts it off and the next call makes a fresh one.
 */
function out(): Out {
	if (!outs) {
		const ctx = (actx ??= new AudioContext());
		effects ??= buildEffects(ctx);
		const input = ctx.createGain();
		input.connect(effects);
		const tone = ctx.createBiquadFilter();
		tone.type = 'lowpass';
		tone.frequency.value = TONE_REST;
		tone.Q.value = 0.5;
		tone.connect(input);
		const breath = ctx.createGain();
		breath.connect(input);
		const pad = ctx.createGain();
		pad.connect(breath);
		outs = { ctx, tone, pad, breath, input };
	}
	if (outs.ctx.state === 'suspended') void outs.ctx.resume();
	return outs;
}

/**
 * How a color sounds: close kin, not different instruments. Its lightness sets
 * the brightness (light colors thinner and crisper, dark ones rounder, softer
 * and a little longer), its hue the kind of tone (warm colors a little hollow,
 * cool ones full), its colorfulness a shimmer (a second voice a few cents off;
 * grays have none). Without a color, a triangle with a quiet octave; chords are
 * sines with a few quiet harmonics, so their pitch carries on small speakers,
 * through the pad.
 */
interface Timbre {
	wave: PeriodicWave;
	attack: number;
	/** Times the note's length. */
	len: number;
	/** The shimmer voice: how far off, in cents, and how loud. */
	detune: number;
	chorus: number;
	/** Played through the pad (chords) rather than the tone filter (tune). */
	pad: boolean;
}

/** Timbres by color, for the level being played (so the cache stays small). */
const timbres = new Map<string, Timbre>();
const PLAIN = 'plain';
const CHORD = 'chord';

/** A wave from its harmonics' levels (index 1 is the fundamental). */
function wave(ctx: AudioContext, levels: number[]): PeriodicWave {
	return ctx.createPeriodicWave(new Float32Array(levels.length), Float32Array.from(levels));
}

function timbre(ctx: AudioContext, key: string = PLAIN): Timbre {
	let t = timbres.get(key);
	if (t) return t;
	const plain = { attack: 0.006, len: 1, detune: 0, chorus: 0, pad: false };
	if (key === PLAIN) {
		// A triangle's odd harmonics, with a quiet octave on top.
		const tri = (n: number) => (8 / Math.PI ** 2 / n ** 2) * (n % 4 === 1 ? 1 : -1);
		t = { ...plain, wave: wave(ctx, [0, tri(1), 0.25, tri(3), 0, tri(5), 0, tri(7)]) };
	} else if (key === CHORD) {
		// A slow attack: chords swell in under the tune rather than hit.
		t = { ...plain, attack: 0.07, pad: true, wave: wave(ctx, [0, 1, 0.3, 0.12, 0.05]) };
	} else {
		const [L, a, b] = lab(key);
		const light = Math.min(1, Math.max(0, L / 100));
		// Warm: reds, oranges and yellows, 1; blues and greens, near 0.
		const warm = (Math.cos(Math.atan2(b, a) - (50 * Math.PI) / 180) + 1) / 2;
		const vivid = Math.min(1, Math.hypot(a, b) / 70);
		// Harmonics fall off faster when dark, slower when light; warm ones lose some even harmonics.
		// (Losing them all sounds reedy and throaty, like a clarinet.)
		const fall = 1.9 - 0.8 * light;
		const levels = [0];
		for (let n = 1; n <= 8; n++) levels.push(n ** -fall * (n % 2 ? 1 : 1 - 0.35 * warm));
		t = {
			wave: wave(ctx, levels),
			attack: 0.012 - 0.008 * light,
			len: 1.15 - 0.3 * light,
			detune: 3 + 4 * vivid,
			chorus: 0.35 * vivid,
			pad: false
		};
	}
	timbres.set(key, t);
	return t;
}

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/**
 * A plucked note in voice `tb`, falling away over `len` seconds (times the
 * voice's own). Tune notes start bright and mellow as they fall, like a
 * plucked string, rather than keeping one tone throughout like an organ.
 */
function pluck(o: Out, tb: Timbre, midi: number, t: number, gain: number, len: number): GainNode {
	len *= tb.len;
	const g = o.ctx.createGain();
	g.gain.setValueAtTime(0.0001, t);
	g.gain.exponentialRampToValueAtTime(gain, t + tb.attack);
	g.gain.exponentialRampToValueAtTime(0.0001, t + len);
	g.connect(tb.pad ? o.pad : o.tone);
	let into: AudioNode = g;
	if (!tb.pad) {
		const f = o.ctx.createBiquadFilter();
		f.type = 'lowpass';
		f.Q.value = -3;
		f.frequency.setValueAtTime(Math.min(16000, hz(midi) * 10), t);
		f.frequency.exponentialRampToValueAtTime(hz(midi) * 2.5, t + len * 0.6);
		f.connect(g);
		into = f;
	}
	const osc = (cents: number) => {
		const v = o.ctx.createOscillator();
		v.setPeriodicWave(tb.wave);
		v.frequency.value = hz(midi);
		v.detune.value = cents;
		v.start(t);
		v.stop(t + len + 0.02);
		return v;
	};
	osc(0).connect(into);
	if (tb.chorus) {
		const level = o.ctx.createGain();
		level.gain.value = tb.chorus;
		osc(tb.detune).connect(level).connect(into);
	}
	return g;
}

/** Move `p` toward `peak` quickly from `t`, then let it settle back to `rest` as the heat cools. */
function swell(p: AudioParam, t: number, peak: number, rest: number) {
	p.cancelScheduledValues(t);
	p.setValueAtTime(p.value, t);
	p.setTargetAtTime(peak, t, 0.12);
	p.setTargetAtTime(rest, t + 0.4, COOL);
}

/** How a game's landings come: its sixteenth note, and whether the ones between tune notes play. */
export interface Rhythm {
	/** Milliseconds: Mosaic's dots, Forage's ticks. */
	beat: number;
	/** Fill the beats between tune notes with a quiet chord pattern, rather than rest. */
	fill: boolean;
	/**
	 * How much each landing warms the music, as a move does: for a game whose
	 * landings come on their own (Forage's ants), so a busy board swells it.
	 */
	warm?: number;
}

/** The quiet pattern between tune notes: root, fifth, third, fifth of the chord. */
const FILL = [0, 4, 2, 4];
/** The chord's notes above its root (hot, its root again on top). */
const TRIAD = [0, 2, 4];
/** After the song's last note, the home chord rolled up above it. */
const RING = [2, 4, 7];

/**
 * A level's steady beat, in `performance.now()` milliseconds: sixteenth notes
 * `ms` long from `origin`. Games time what they land by it.
 */
export class Clock {
	/** A line of the grid, which sixteenth it is, and how long they are from it on. */
	origin = 0;
	base = 0;
	ms = 100;

	/** Start counting sixteenths `ms` long from time `at`. */
	start(at: number, ms: number) {
		this.origin = at;
		this.base = 0;
		this.ms = ms;
	}

	/**
	 * From line `at` on, sixteenths `ms` long: the beat speeds up or slows down
	 * there without a jump. `at` should be a line of every few sixteenths, so
	 * the lines of every two, four... carry on from it.
	 */
	retime(at: number, ms: number) {
		this.base = this.step(at);
		this.origin = at;
		this.ms = ms;
	}

	/** The sixteenth nearest time `at`. */
	step(at: number) {
		return this.base + Math.round((at - this.origin) / this.ms);
	}

	/** The line every `n` sixteenths nearest time `at`. */
	nearest(at: number, n = 1) {
		const p = n * this.ms;
		return this.origin + Math.round((at - this.origin) / p) * p;
	}

	/** The first line every `n` sixteenths at or after time `at`. */
	next(at: number, n = 1) {
		const p = n * this.ms;
		return this.origin + Math.ceil((at - this.origin) / p - 1e-9) * p;
	}
}

/** Turns a `performance.now()` time into the audio clock's (never before now). */
type When = (ms: number) => number;

export class Music {
	/** The level's beat, kept even while the sound is off, so play lands on it either way. */
	readonly clock = new Clock();
	#seed = 1;
	/** The level's song, written the first time it plays. */
	#written: Song | null = null;
	#fill = false;
	#warmBy = 0;
	/** Sixteenths to the breath's beat, and to a flourish's sixteenth note. */
	#pulse = 4;
	#six = 1;
	/** Which time through the song this is: each writes a new B and C. */
	#pass = 0;
	/** The next note to play, as an index into the song. */
	#i = 0;
	/** The key and chord under the last note played. */
	#key: Key = NO_KEY;
	#root = 0;
	/** The game's own sixteenth (ms), and about how far apart the player's moves come. */
	#beat = 100;
	#pace = 1500;
	/** When the last thing landed, and the sixteenth the next tune note is due. */
	#last = -Infinity;
	#due = 0;
	/** The ringing chord's notes, faded out when the next one comes in. */
	#held: GainNode[] = [];
	/** Until this time a flourish is playing the tune: landings don't play it. */
	#quiet = -Infinity;
	/** How swelled the music is, 0 to 1, as of `#heatAt`; it cools from there. */
	#heat = 0;
	#heatAt = 0;
	/** When the last move was made. */
	#lastMove = -Infinity;

	/**
	 * A new level: its own song, from the top, cool, with anything still ringing
	 * cut off, and its beat starting now.
	 */
	seed(seed: number, rhythm: Rhythm) {
		this.#seed = seed;
		this.#pass = 0;
		this.#written = null;
		this.#key = this.#song.home;
		this.#beat = rhythm.beat;
		this.#pace = 1500;
		this.clock.start(performance.now(), rhythm.beat);
		this.#fill = rhythm.fill;
		this.#warmBy = rhythm.warm ?? 0;
		this.#pulse = 4;
		while (this.#pulse * rhythm.beat < BREATH_MIN) this.#pulse *= 2;
		this.#six = Math.max(1, Math.round((UNIT * 1000) / rhythm.beat));
		this.#i = 0;
		this.#root = 0;
		this.#last = -Infinity;
		this.#due = 0;
		this.#quiet = -Infinity;
		this.#heat = 0;
		this.#lastMove = -Infinity;
		timbres.clear();
		this.hush();
	}

	get #song() {
		return (this.#written ??= compose(this.#seed, this.#pass));
	}

	/** Go on to note `j` of the song; past its end, a new pass from the top. */
	#advance(j: number) {
		const len = this.#song.notes.length;
		if (j >= len) {
			this.#pass++;
			this.#written = null;
		}
		this.#i = j % len;
	}

	/** Stop what's ringing: later notes go to a fresh output. */
	hush() {
		outs?.input.disconnect();
		outs?.lfo?.stop();
		outs = null;
		this.#held = [];
	}

	/**
	 * Run `f` with the output, the time now (performance ms) and a way to turn
	 * such times into the audio clock's; a browser without audio stays quiet.
	 * A fresh output starts breathing on the beat, its echo a whole number of
	 * sixteenths long.
	 */
	#play(f: (o: Out, now: number, when: When) => void) {
		try {
			const o = out();
			const now = performance.now();
			const at = o.ctx.currentTime;
			const when: When = (ms) => Math.max(at, at + (ms - now) / 1000);
			if (!o.lfo) this.#breathe(o, now, when);
			f(o, now, when);
		} catch {
			/* audio not available */
		}
	}

	/** Swell the held chord on every breath's beat, from the next one. */
	#breathe(o: Out, now: number, when: When) {
		const { ctx, breath } = o;
		const period = this.#pulse * this.clock.ms;
		// A cosine with a little sharpening: loudest right on the beat.
		const lfo = ctx.createOscillator();
		lfo.setPeriodicWave(
			ctx.createPeriodicWave(Float32Array.from([0, 1, 0.5, 0.25]), new Float32Array(4))
		);
		lfo.frequency.value = 1000 / period;
		const depth = ctx.createGain();
		depth.gain.value = BREATH;
		breath.gain.value = 1 - BREATH;
		lfo.connect(depth).connect(breath.gain);
		lfo.start(when(this.clock.next(now, this.#pulse)));
		o.lfo = lfo;
		if (echo) echo.delayTime.value = (3 * this.#six * this.clock.ms) / 1000;
	}

	/** Degree `deg` in the key that's playing, as a MIDI note. */
	#midi(deg: number) {
		const { tonic, scale } = this.#key;
		return tonic + 12 * Math.floor(deg / 7) + scale[mod7(deg)];
	}

	/** The heat at time `ms`. */
	#warmth(ms: number) {
		return this.#heat * Math.exp(-(ms - this.#heatAt) / 1000 / COOL);
	}

	/** Set the heat at audio time `t` (`ms`): the tune's filter opens and the chords grow to match, then both cool. */
	#heatTo(o: Out, ms: number, t: number, h: number) {
		this.#heat = Math.min(1, h);
		this.#heatAt = ms;
		swell(o.tone.frequency, t, TONE_REST + (TONE_HOT - TONE_REST) * this.#heat, TONE_REST);
		swell(o.pad.gain, t, 1 + PAD_HOT * this.#heat, 1);
	}

	/**
	 * A move went through: the music warms a lot when it comes quickly after the
	 * last one, a little when it doesn't, so a quick run of moves swells it.
	 */
	move() {
		this.#play((o, now, when) => {
			const gap = now - this.#lastMove;
			this.#lastMove = now;
			this.#heatTo(o, now, when(now), this.#warmth(now) + (gap < QUICK * 1000 ? 0.2 : 0.06));
			this.#follow(o, now, when, gap);
		});
	}

	/**
	 * Follow the player's pace: quicker moves, a quicker beat; slower, a calmer
	 * one. It changes a little at a time, on the breath's next beat.
	 */
	#follow(o: Out, now: number, when: When, gap: number) {
		if (!Number.isFinite(gap)) return;
		this.#pace = 0.7 * this.#pace + 0.3 * Math.min(Math.max(gap, 300), 5000);
		const slow = Math.log(this.#pace / PACE_QUICK) / Math.log(PACE_SLOW / PACE_QUICK);
		const k = TEMPO_QUICK + (TEMPO_SLOW - TEMPO_QUICK) * Math.min(1, Math.max(0, slow));
		const { ms } = this.clock;
		const to = Math.min(ms * 1.03, Math.max(ms * 0.97, this.#beat * k));
		if (Math.abs(to - ms) < ms * 0.01) return;
		const line = this.clock.next(now, this.#pulse);
		this.clock.retime(line, to);
		o.lfo?.frequency.setValueAtTime(1000 / (this.#pulse * to), when(line));
		echo?.delayTime.setTargetAtTime((3 * this.#six * to) / 1000, when(line), 0.05);
	}

	/** Fade the ringing chord out quickly from `t`, so it never clashes with the next. */
	#release(t: number) {
		for (const g of this.#held) {
			const p = g.gain;
			// Firefox has no cancelAndHoldAtTime; cancelling there may click, softly.
			const hold = (p as Partial<AudioParam>).cancelAndHoldAtTime;
			if (hold) hold.call(p, t);
			else p.cancelScheduledValues(t);
			p.setTargetAtTime(0.0001, t, 0.06);
		}
		this.#held = [];
	}

	/** Degree `deg` placed in the octave just above the tonic, where the chords sit. */
	#voice(deg: number) {
		const low = this.#key.tonic + 3;
		return low + ((((this.#midi(deg) - low) % 12) + 12) % 12);
	}

	/**
	 * Bring chord `root` in at `t` as `strike` says: its root an octave below the
	 * tonic, its notes soft in one octave above, so each takes the inversion
	 * nearest the last and the changes glide, a high root more when hot. (Lower,
	 * small speakers only rumble.)
	 */
	#chord(o: Out, t: number, root: number, h: number, strike: Strike = 'block') {
		this.#release(t);
		const tb = timbre(o.ctx, CHORD);
		this.#held.push(pluck(o, tb, this.#midi(root) - 12, t, 0.07, BAR));
		if (strike === 'bass') return;
		const tones = TRIAD.map((k) => this.#voice(root + k)).sort((x, y) => x - y);
		if (h > 0.5) tones.push(this.#voice(root) + 12);
		const six = (this.#six * this.clock.ms) / 1000;
		tones.forEach((m, i) => {
			const at = strike === 'roll' ? t + (i * six) / 2 : strike === 'late' ? t + 2 * six : t;
			this.#held.push(pluck(o, tb, m, at, 0.02, BAR));
		});
	}

	/** Sing song note `n` at `t`: doubled an octave up when hot, bringing its chord in unless `bare`. */
	#sing(
		o: Out,
		tb: Timbre,
		n: Note,
		t: number,
		gain: number,
		len: number,
		h: number,
		bare = false
	) {
		this.#key = n.key;
		const m = this.#midi(n.deg);
		pluck(o, tb, m, t, gain, len);
		if (h > 0.3) pluck(o, tb, m + 12, t, gain * 0.6 * (h - 0.2), len);
		if (n.chord && !bare) this.#chord(o, t, n.root, h, n.downbeat ? n.strike : 'block');
	}

	/**
	 * Play song `notes` from time `ms` in their own rhythm, a flourish's
	 * sixteenths, the last ringing `hold` seconds. Returns when the last starts.
	 */
	#flourish(
		o: Out,
		when: When,
		tb: Timbre,
		notes: Note[],
		ms: number,
		gain: number,
		hold: number,
		h: number,
		bare = false
	) {
		notes.forEach((n, i) => {
			const last = i === notes.length - 1;
			this.#sing(o, tb, n, when(ms), gain, last ? hold : 0.4, h, bare);
			if (!last) ms += n.len * this.#six * this.clock.ms;
		});
		return ms;
	}

	/** Bar `b` of the song. */
	#bar(b: number) {
		return this.#song.notes.filter((n) => n.bar === b);
	}

	/** The song's bars. */
	get #bars() {
		return this.#song.notes[this.#song.notes.length - 1].bar + 1;
	}

	/**
	 * Something landed in `color`'s voice (a hex), `soft`er for a side landing
	 * (Mosaic's tray), meant `at` this time (ms; now, by default) on the beat.
	 * The song's next note plays once the last one's length has gone by, and on
	 * the sixteenths between, the game's fill, or nothing. Things landing
	 * together play once. Hot, the tune is louder and doubled an octave up.
	 */
	note(color?: string, soft = false, at?: number) {
		this.#play((o, now, when) => {
			at ??= now;
			const gap = at - this.#last;
			if (gap < this.clock.ms * 0.75) return;
			this.#last = at;
			const step = this.clock.step(at);
			const t = when(at);
			const tb = timbre(o.ctx, color);
			if (this.#warmBy && !soft) this.#heatTo(o, now, t, this.#warmth(now) + this.#warmBy);
			const h = this.#warmth(now);
			const gain = (soft ? 0.055 : 0.08) * (1 + 0.25 * h);
			// Only progress moves the song on: a side landing plays the quiet pattern. The first
			// landing after a lull always plays the tune, so pecking one at a time walks through it.
			const lull = gap > 6 * this.clock.ms;
			if (soft || at < this.#quiet || (step < this.#due && !lull)) {
				if (this.#fill)
					pluck(o, tb, this.#midi(this.#root + FILL[((step % 4) + 4) % 4]), t, gain * 0.4, 0.12);
				return;
			}
			// After a pause, pick up at the next bar rather than mid-phrase.
			if (gap > REST * 1000) {
				while (!this.#song.notes[this.#i].downbeat) this.#advance(this.#i + 1);
			}
			const n = this.#song.notes[this.#i];
			this.#advance(this.#i + 1);
			this.#root = n.root;
			this.#due = step + n.len;
			// Held notes in the song ring a little longer.
			this.#sing(o, tb, n, t, gain, n.len >= 8 ? 0.7 : 0.45, h);
		});
	}

	/** A move that sets things going (an ant sent off): a short quiet note on the chord's root. */
	tap(color?: string) {
		this.#play((o, now, when) => {
			pluck(o, timbre(o.ctx, color), this.#midi(this.#root), when(now), 0.04, 0.12);
		});
	}

	/** A move that can't go: a short low note on the chord's root. */
	nope() {
		this.#play((o, now, when) => {
			pluck(o, timbre(o.ctx, CHORD), this.#midi(this.#root) - 12, when(now), 0.06, 0.14);
		});
	}

	/** The first line of two flourish sixteenths at least `lead` ms from `now`. */
	#onBeat(now: number, lead: number) {
		return this.clock.next(now + lead, 2 * this.#six);
	}

	/**
	 * The song's notes from the next one on, to a bar's first beat at least two
	 * notes along, and where the song goes on after them (past its end, maybe).
	 */
	#ahead(): { run: Note[]; next: number } {
		const notes = this.#song.notes;
		const run: Note[] = [];
		for (let j = this.#i; ; j++) {
			const n = notes[j % notes.length];
			run.push(n);
			if (run.length >= 3 && n.downbeat) return { run, next: j + 1 };
		}
	}

	/**
	 * Something opened (or the sound came on): a glimpse of the tune's next bar,
	 * soft, moved onto the chord that's ringing. The tune doesn't move on, so
	 * the next moves play that bar again.
	 */
	chime() {
		this.#play((o, now, when) => {
			const notes = this.#song.notes;
			const next = notes[this.#i];
			const bar = this.#bar(next.downbeat ? next.bar : (next.bar + 1) % this.#bars);
			// The nearer way, up or down, from its chord's root to the ringing one's, in its key.
			const shift = mod7(this.#root - bar[0].root + 3) - 3;
			const moved = bar.map((n) => ({ ...n, deg: n.deg + shift, key: this.#key }));
			this.#flourish(o, when, timbre(o.ctx), moved, this.#onBeat(now, 20), 0.05, 0.6, 0, true);
		});
	}

	/**
	 * A color finished: the music swells and the tune runs on ahead. In that
	 * color's voice, just after the note that finished it, a sweep comes up the
	 * chord into the tune's next notes, which play on a beat through to the
	 * first of a bar and hold there. The tune goes on from after it, so each
	 * color's flourish is a different stretch of it.
	 */
	done(color?: string) {
		this.#play((o, now, when) => {
			this.#heatTo(o, now, when(now), this.#warmth(now) + 0.35);
			const tb = timbre(o.ctx, color);
			const { run, next } = this.#ahead();
			const [first, last] = [run[0], run[run.length - 1]];
			this.#key = first.key;
			const sweep: number[] = [];
			for (let d = first.deg - 7; d < first.deg; d++) if (isChordTone(d, first.root)) sweep.push(d);
			// The sweep in thirty-seconds, up to the run's first note.
			const gap = (this.#six * this.clock.ms) / 2;
			const from = this.#onBeat(now, 30 + sweep.length * gap);
			sweep.forEach((d, i) => {
				pluck(o, tb, this.#midi(d), when(from - (sweep.length - i) * gap), 0.045, 0.4);
			});
			// Its first note brings in its chord, if it's not a bar's first already.
			if (!first.chord) this.#chord(o, when(from), first.root, this.#heat);
			this.#quiet = this.#flourish(o, when, tb, run, from, 0.075, 1.4, this.#heat);
			this.#advance(next);
			this.#root = last.root;
		});
	}

	/**
	 * A finished picture: the song's own ending, V to I, from the breath's next
	 * beat, the home chord rolled up above its last note, and the song back to
	 * the top.
	 */
	cadence() {
		this.#play((o, now, when) => {
			const tb = timbre(o.ctx);
			const end = this.#bar(this.#bars - 1);
			const from = this.clock.next(now + 2 * this.#six * this.clock.ms, this.#pulse);
			const at = this.#flourish(o, when, tb, end, from, 0.08, 2.4, this.#warmth(now));
			const top = end[end.length - 1].deg;
			const six = this.#six * this.clock.ms;
			RING.forEach((k, i) => pluck(o, tb, this.#midi(top + k), when(at + (i + 1) * six), 0.035, 2));
			this.#quiet = at;
			this.#i = 0;
			this.#root = 0;
			this.#key = this.#song.home;
		});
	}
}

export const music = new Music();
