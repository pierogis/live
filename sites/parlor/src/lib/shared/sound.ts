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
 * never changes: a tempo following the player's pace blurred it, and so did
 * an echo gliding along with it. The tune plays on in
 * its own rhythm, a quarter note four sixteenths on, and landings between tune
 * notes play a quiet chord pattern below. (A tune note on every one is too
 * much to hear as a tune.) Each bar brings in its chord, low and soft, in one
 * of a few ways (together, rolled, its bass alone, an eighth late), on the
 * breath's beat even when its first note lands between, in the
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
 * opening rings the chord in a bell's voice of its own, high up, which then
 * harmonizes the tune above it for a bar or so; finishing a color swells the
 * music and sweeps up into the tune running on ahead to a bar's first beat (or,
 * in Mosaic, the color joins in the same way the bell does, in its own voice); a
 * finished picture plays the song's own ending, V to I, so it always ends at
 * home. Each starts on a beat, after any still playing, so two colors
 * finishing together run on as one longer stretch. In Forage, foods of two
 * colors picked up together bend the echo.
 *
 * Each color plays its own instrument, picked by its hue and lightness (a
 * dozen, from electric piano and brass to harp and glass), no two colors of
 * a level the same while there are instruments to go round: see `voiceOf`.
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
/** How fast the swell cools: it falls to about a third in this many seconds. */
const COOL = 5;
/**
 * How far (s) the echo stretches when things of different colors land together, and how
 * fast (s): the echo dips by about their ratio, here 2.5%, under half a semitone.
 */
const BEND = 0.0025;
const BEND_IN = 0.1;
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
	// Gentle and slow, so a chord coming in doesn't duck the tune and swell it back (a pump).
	const glue = ctx.createDynamicsCompressor();
	glue.threshold.value = -16;
	glue.knee.value = 12;
	glue.ratio.value = 2;
	glue.attack.value = 0.03;
	glue.release.value = 0.5;
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
	/** The note's own filter opens at this many times its pitch and closes to this many. */
	bright: number;
	mellow: number;
	/** A wavering pitch, in cents, and a wavering loudness (0 to 1), coming in as the note sounds. */
	vibrato?: number;
	tremolo?: number;
	/** How loud it plays, so the soft and short instruments carry like the full ones. */
	level?: number;
}

type Voice =
	| 'keys'
	| 'brass'
	| 'kalimba'
	| 'mallet'
	| 'flute'
	| 'organ'
	| 'harp'
	| 'vibes'
	| 'reed'
	| 'pizz'
	| 'glass'
	| 'string';

type VoiceSpec = Omit<Timbre, 'wave' | 'pad' | 'detune' | 'chorus'> &
	Partial<Pick<Timbre, 'detune' | 'chorus'>> & { levels: number[] };

/** The instruments colors play: harmonic levels (index 1 the fundamental) and how they sound. */
const VOICES: Record<Voice, VoiceSpec> = {
	// Electric piano: a round body with a soft bell in its fourth harmonic.
	keys: {
		levels: [0, 1, 0.45, 0.12, 0.22, 0.05, 0.04],
		attack: 0.004,
		len: 1.4,
		detune: 5,
		chorus: 0.3,
		bright: 7,
		mellow: 2.2
	},
	// Brass: full, its filter opening as it speaks rather than closing, a soft "bwah".
	brass: {
		levels: [0, 1, 0.7, 0.5, 0.35, 0.25, 0.18, 0.12],
		level: 0.85,
		attack: 0.03,
		len: 0.9,
		bright: 1.6,
		mellow: 6
	},
	// Kalimba: a thumb's pluck, with a high overtone that dies first.
	kalimba: {
		levels: [0, 1, 0.05, 0, 0, 0, 0.3],
		level: 1.15,
		attack: 0.002,
		len: 0.75,
		bright: 9,
		mellow: 1.5
	},
	// Marimba: the fundamental with its fourth and tenth harmonics, short and woody.
	mallet: {
		levels: [0, 1, 0, 0, 0.4, 0, 0, 0, 0, 0, 0.12],
		level: 1.15,
		attack: 0.002,
		len: 0.55,
		bright: 12,
		mellow: 1.5
	},
	// Flute: nearly pure, breathing in, steady, with a vibrato.
	flute: {
		levels: [0, 1, 0.18, 0.06, 0.03],
		level: 1.25,
		attack: 0.035,
		len: 1.25,
		bright: 5,
		mellow: 4,
		vibrato: 9
	},
	// Organ: drawbars at the octaves, steady, a little chorus like a turning speaker.
	organ: {
		levels: [0, 1, 0.5, 0, 0.3, 0, 0, 0, 0.15],
		attack: 0.012,
		len: 1.1,
		detune: 4,
		chorus: 0.3,
		bright: 9,
		mellow: 8
	},
	// Harp: every harmonic, falling off, bright when plucked and mellowing.
	harp: {
		levels: [0, 1, 0.31, 0.15, 0.09, 0.06, 0.05, 0.04, 0.03],
		attack: 0.004,
		len: 1.2,
		detune: 3,
		chorus: 0.2,
		bright: 10,
		mellow: 2.5
	},
	// Vibraphone: a soft bar ringing long, its loudness wavering.
	vibes: {
		levels: [0, 1, 0, 0, 0.2, 0, 0, 0, 0, 0, 0.04],
		attack: 0.003,
		len: 1.6,
		bright: 8,
		mellow: 3,
		tremolo: 0.5
	},
	// Accordion: a full reed, and a second reed a little sharp beating against it.
	reed: {
		levels: [0, 1, 0.65, 0.45, 0.3, 0.22, 0.15, 0.1, 0.07],
		level: 0.85,
		attack: 0.018,
		len: 0.85,
		detune: 12,
		chorus: 0.55,
		bright: 6,
		mellow: 4
	},
	// Pizzicato strings: plucked and stopped short.
	pizz: {
		levels: [0, 1, 0.6, 0.4, 0.3, 0.2, 0.15, 0.1],
		level: 1.2,
		attack: 0.002,
		len: 0.35,
		bright: 8,
		mellow: 1.5
	},
	// Glass: a rubbed rim, nearly pure with a shimmer, fading in and ringing.
	glass: {
		levels: [0, 1, 0.1, 0, 0.15],
		level: 1.25,
		attack: 0.02,
		len: 1.5,
		detune: 8,
		chorus: 0.4,
		bright: 6,
		mellow: 4
	},
	// A nylon string: very bright as it's plucked, quickly mellowing.
	string: {
		levels: [0, 1, 0.8, 0.55, 0.4, 0.3, 0.22, 0.15, 0.1, 0.07],
		level: 0.9,
		attack: 0.002,
		len: 0.75,
		bright: 16,
		mellow: 2
	}
};

/** The order a color tries instruments in when its own is taken. */
const VOICE_ORDER = Object.keys(VOICES) as Voice[];

/**
 * The instrument for a color by its Lab hue (degrees), colorfulness and
 * lightness: each family of hues has a light instrument and a dark one. Reds
 * and pinks keys or brass, oranges and yellows kalimba or marimba, greens
 * flute or organ, cyans and blues harp or vibraphone, purples accordion or
 * pizzicato, grays glass or nylon string.
 */
function voiceOf(hue: number, chroma: number, light: number): Voice {
	const dark = light < 60 ? 1 : 0;
	if (chroma < 12) return (['glass', 'string'] as const)[dark];
	const h = (hue + 360) % 360;
	if (h >= 345 || h < 50) return (['keys', 'brass'] as const)[dark];
	if (h < 115) return (['kalimba', 'mallet'] as const)[dark];
	if (h < 180) return (['flute', 'organ'] as const)[dark];
	if (h < 280) return (['harp', 'vibes'] as const)[dark];
	return (['reed', 'pizz'] as const)[dark];
}

/** Timbres by color, for the level being played (so the cache stays small), and the instruments they've taken. */
const timbres = new Map<string, Timbre>();
const voices = new Set<Voice>();
const PLAIN = 'plain';
const CHORD = 'chord';
const BELL = 'bell';

/** A wave from its harmonics' levels (index 1 is the fundamental). */
function wave(ctx: AudioContext, levels: number[]): PeriodicWave {
	return ctx.createPeriodicWave(new Float32Array(levels.length), Float32Array.from(levels));
}

function timbre(ctx: AudioContext, key: string = PLAIN): Timbre {
	let t = timbres.get(key);
	if (t) return t;
	const plain = {
		attack: 0.006,
		len: 1,
		detune: 0,
		chorus: 0,
		pad: false,
		bright: 10,
		mellow: 2.5
	};
	if (key === PLAIN) {
		// A triangle's odd harmonics, with a quiet octave on top.
		const tri = (n: number) => (8 / Math.PI ** 2 / n ** 2) * (n % 4 === 1 ? 1 : -1);
		t = { ...plain, wave: wave(ctx, [0, tri(1), 0.25, tri(3), 0, tri(5), 0, tri(7)]) };
	} else if (key === CHORD) {
		// A slow attack: chords swell in under the tune rather than hit.
		t = { ...plain, attack: 0.07, pad: true, wave: wave(ctx, [0, 1, 0.3, 0.12, 0.05]) };
	} else if (key === BELL) {
		// A celesta's: the fundamental, a strong double octave and a little sixth
		// harmonic, struck quickly and left ringing, with a shimmer.
		t = {
			...plain,
			attack: 0.003,
			len: 1.6,
			detune: 6,
			chorus: 0.4,
			wave: wave(ctx, [0, 1, 0, 0.12, 0.5, 0, 0.2, 0, 0.08])
		};
	} else {
		const [L, a, b] = lab(key);
		const light = Math.min(1, Math.max(0, L / 100));
		const chroma = Math.hypot(a, b);
		// Its own instrument, or the next free one, so a level's colors all sound different.
		const own = voiceOf((Math.atan2(b, a) * 180) / Math.PI, chroma, L);
		const k = VOICE_ORDER.indexOf(own);
		const voice =
			[...VOICE_ORDER.slice(k), ...VOICE_ORDER.slice(0, k)].find((v) => !voices.has(v)) ?? own;
		voices.add(voice);
		const { levels, detune = 0, chorus = 0, ...rest } = VOICES[voice];
		// Lighter colors play a little brighter, more colorful ones with more shimmer.
		t = {
			...rest,
			wave: wave(ctx, levels),
			pad: false,
			detune,
			bright: rest.bright * (0.85 + 0.3 * light),
			chorus: chorus && chorus + 0.15 * Math.min(1, chroma / 70)
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
	// Never so short it clicks.
	len = Math.max(len * tb.len, tb.attack + 0.08);
	gain *= tb.level ?? 1;
	const g = o.ctx.createGain();
	g.gain.setValueAtTime(0.0001, t);
	g.gain.exponentialRampToValueAtTime(gain, t + tb.attack);
	g.gain.exponentialRampToValueAtTime(0.0001, t + len);
	g.connect(tb.pad ? o.pad : o.tone);
	let into: AudioNode = g;
	if (tb.tremolo) {
		const lfo = o.ctx.createOscillator();
		lfo.frequency.value = 5.5;
		const trem = o.ctx.createGain();
		trem.gain.value = 1 - tb.tremolo / 2;
		const depth = o.ctx.createGain();
		depth.gain.value = tb.tremolo / 2;
		lfo.connect(depth).connect(trem.gain);
		lfo.start(t);
		lfo.stop(t + len + 0.02);
		trem.connect(into);
		into = trem;
	}
	if (!tb.pad) {
		const f = o.ctx.createBiquadFilter();
		f.type = 'lowpass';
		f.Q.value = -3;
		f.frequency.setValueAtTime(Math.min(16000, hz(midi) * tb.bright), t);
		f.frequency.exponentialRampToValueAtTime(hz(midi) * tb.mellow, t + len * 0.6);
		f.connect(into);
		into = f;
	}
	let vibrato: GainNode | null = null;
	if (tb.vibrato) {
		const lfo = o.ctx.createOscillator();
		lfo.frequency.value = 5.2;
		vibrato = o.ctx.createGain();
		vibrato.gain.setValueAtTime(0, t);
		vibrato.gain.linearRampToValueAtTime(tb.vibrato, t + 0.25);
		lfo.connect(vibrato);
		lfo.start(t);
		lfo.stop(t + len + 0.02);
	}
	const osc = (cents: number) => {
		const v = o.ctx.createOscillator();
		v.setPeriodicWave(tb.wave);
		v.frequency.value = hz(midi);
		v.detune.value = cents;
		vibrato?.connect(v.detune);
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
	/** Things of different colors landing together bend the echo, a dip in pitch, rather than one going unheard. */
	bend?: boolean;
	/**
	 * Doubles (a landing a sixteenth after a tune note) take the tune's next note early,
	 * so it skips in sixteenths. Not a bar's first note, and not twice running.
	 */
	doubles?: boolean;
	/**
	 * A finished color joins in, as an unlock's bell does: a quick sweep up the chord in
	 * its voice, which then harmonizes the tune for a bar or so, rather than the tune
	 * running on ahead in a flourish over the player's landings.
	 */
	harmonize?: boolean;
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
	/** When the level's beat started, and how long its sixteenths are. */
	origin = 0;
	ms = 100;

	/** Start counting sixteenths `ms` long from time `at`. */
	start(at: number, ms: number) {
		this.origin = at;
		this.ms = ms;
	}

	/** The sixteenth nearest time `at`. */
	step(at: number) {
		return Math.round((at - this.origin) / this.ms);
	}

	/** When sixteenth `step` is. */
	time(step: number) {
		return this.origin + step * this.ms;
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
	/** When the last thing landed, and the sixteenth the next tune note is due. */
	#last = -Infinity;
	#due = 0;
	/** The sixteenth the last tune note played on, and whether it came early on a double. */
	#sung = -Infinity;
	#early = false;
	#doubles = false;
	/** The ringing chord's notes, faded out when the next one comes in. */
	#held: GainNode[] = [];
	/**
	 * The flourish playing (when each note starts) and when it's over: until
	 * then landings play the quiet pattern on its chords, the next flourish
	 * waits for it and the tempo holds.
	 */
	#run: { at: number; n: Note }[] = [];
	#ends = -Infinity;
	#bend = false;
	/** The color of the last thing that landed, and when the echo last bent. */
	#color: string | undefined;
	#bent = -Infinity;
	/**
	 * How many more tune notes get a harmony, after something opened or (`#joins`) a
	 * color finished; in whose voice, and how many degrees up it sits from the tune's.
	 */
	#harmony = 0;
	#harmonist: { voice: string; up: number; gain: number } = { voice: BELL, up: 7, gain: 0.035 };
	#joins = false;
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
		this.#sung = -Infinity;
		this.#early = false;
		this.#doubles = rhythm.doubles ?? false;
		this.#run = [];
		this.#ends = -Infinity;
		this.#bend = rhythm.bend ?? false;
		this.#color = undefined;
		this.#bent = -Infinity;
		this.#harmony = 0;
		this.#joins = rhythm.harmonize ?? false;
		this.#heat = 0;
		this.#lastMove = -Infinity;
		timbres.clear();
		voices.clear();
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
	 * A fresh output starts breathing on the beat, its echo three of the
	 * level's sixteenths long.
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
		if (echo) echo.delayTime.value = this.#echo;
	}

	/** Degree `deg` in the key that's playing, as a MIDI note. */
	#midi(deg: number, key = this.#key) {
		const { tonic, scale } = key;
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
		});
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

	/**
	 * Sing song note `n` at `t`: doubled an octave up when hot, bringing its
	 * chord in at `chord` (with it, by default; not at all if false). A chord
	 * that waits for its beat comes straight in on it.
	 */
	#sing(
		o: Out,
		tb: Timbre,
		n: Note,
		t: number,
		gain: number,
		len: number,
		h: number,
		chord: number | false = t
	) {
		this.#key = n.key;
		const m = this.#midi(n.deg);
		pluck(o, tb, m, t, gain, len);
		if (h > 0.3) pluck(o, tb, m + 12, t, gain * 0.6 * (h - 0.2), len);
		if (!n.chord || chord === false) return;
		const strike = !n.downbeat || (chord > t && n.strike === 'late') ? 'block' : n.strike;
		this.#chord(o, chord, n.root, h, strike);
	}

	/**
	 * Play song `notes` from time `ms` in their own rhythm, a flourish's
	 * sixteenths, the last ringing `hold` seconds, on the clock's lines.
	 * Returns when the last starts; `#ends` is when it's over.
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
		let step = this.clock.step(ms);
		this.#run = [];
		notes.forEach((n, i) => {
			const last = i === notes.length - 1;
			ms = this.clock.time(step);
			this.#run.push({ at: ms, n });
			this.#sing(o, tb, n, when(ms), gain, last ? hold : 0.4, h, !bare && when(ms));
			step += n.len * this.#six;
		});
		this.#ends = this.clock.time(step);
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
	 * together play once (or bend the echo, colors apart, if the game's rhythm
	 * says). A chord comes in on the breath's beat. Hot, the tune is louder and
	 * doubled an octave up.
	 */
	note(color?: string, soft = false, at?: number) {
		this.#play((o, now, when) => {
			at ??= now;
			// Late: the tab was hidden, so what was landing waited. It plays on the next
			// sixteenth, and the rest that waited with it merge into that note, rather than
			// all sounding at once off the beat.
			if (at < now - this.clock.ms / 2) at = this.clock.next(now);
			const gap = at - this.#last;
			if (gap < this.clock.ms * 0.75) {
				if (this.#bend && !soft && color !== this.#color && this.#bent !== this.#last) {
					this.#bent = this.#last;
					this.#bendEcho(when(this.#last));
				}
				return;
			}
			this.#last = at;
			this.#color = color;
			const step = this.clock.step(at);
			const t = when(at);
			const tb = timbre(o.ctx, color);
			if (this.#warmBy && !soft) this.#heatTo(o, now, t, this.#warmth(now) + this.#warmBy);
			const h = this.#warmth(now);
			const gain = (soft ? 0.055 : 0.08) * (1 + 0.25 * h);
			// Only progress moves the song on: a side landing plays the quiet pattern. The first
			// landing after a lull always plays the tune, so pecking one at a time walks through it.
			const lull = gap > 6 * this.clock.ms;
			// A double: a sixteenth after the tune's note, it takes the next one early. That note
			// holds to where it was due to end, so the bar stays where it was: an anticipation.
			const early =
				this.#doubles &&
				!soft &&
				!this.#early &&
				at >= this.#ends &&
				step === this.#sung + 1 &&
				step < this.#due &&
				!this.#song.notes[this.#i].downbeat;
			if (!early && (soft || at < this.#ends || (step < this.#due && !lull))) {
				const { root, key } = this.#sounding(at);
				if (this.#fill)
					pluck(o, tb, this.#midi(root + FILL[((step % 4) + 4) % 4], key), t, gain * 0.4, 0.12);
				return;
			}
			// After a pause, pick up at the next bar rather than mid-phrase.
			if (gap > REST * 1000) {
				while (!this.#song.notes[this.#i].downbeat) this.#advance(this.#i + 1);
			}
			const n = this.#song.notes[this.#i];
			this.#advance(this.#i + 1);
			this.#root = n.root;
			this.#due = (early ? this.#due : step) + n.len;
			this.#sung = step;
			this.#early = early;
			// Held notes in the song ring a little longer. A new chord waits for the breath's beat, so
			// changes come in time however the landings fall, and the old one rings on until it
			// does: stopped at the note, the gap to the beat sounded like the music ducking.
			const beat = this.clock.next(at - this.clock.ms / 2, this.#pulse);
			this.#sing(o, tb, n, t, gain, n.len >= 8 ? 0.7 : 0.45, h, when(beat));
			if (this.#harmony > 0) {
				this.#harmony--;
				// The harmony's line: a third above the tune's note, or a sixth when that's the
				// chord's and the third isn't. Either sits sweetly on the tune.
				const d =
					n.deg + (isChordTone(n.deg + 2, n.root) || !isChordTone(n.deg + 5, n.root) ? 2 : 5);
				const { voice, up, gain: g } = this.#harmonist;
				pluck(o, timbre(o.ctx, voice), this.#midi(d + up), t, g * (1 + 0.25 * h), 0.8);
			}
		});
	}

	/** The echo's delay (s): three of the level's sixteenths. */
	get #echo() {
		return (3 * this.#six * this.clock.ms) / 1000;
	}

	/** The chord and key sounding at time `at`: a flourish's, while one plays. */
	#sounding(at: number): { root: number; key: Key } {
		if (at < this.#ends) {
			const now = this.#run.findLast((r) => r.at <= at + 1);
			if (now) return { root: now.n.root, key: now.n.key };
		}
		return { root: this.#root, key: this.#key };
	}

	/**
	 * Bend the echo of what played at audio time `t`: its delay
	 * stretches a little and slowly comes back, so it dips in pitch and drifts
	 * home.
	 */
	#bendEcho(t: number) {
		if (!echo) return;
		const d = this.#echo;
		const p = echo.delayTime;
		p.setTargetAtTime(d + BEND, t + d, BEND_IN);
		p.setTargetAtTime(d, t + d + 0.2, 0.4);
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
	 * Something opened (or the sound came on): a voice of its own, a bell high
	 * up, rings the chord that's sounding, quickly up on a beat, then
	 * harmonizes the tune's notes through the end of its next bar, above them,
	 * as they're played. The tune itself goes on as it was.
	 */
	chime() {
		this.#play((o, now, when) => {
			this.#joinIn(o, now, when, { voice: BELL, up: 7, gain: 0.035 }, [16, 18, 21], 0.035, 0.9);
		});
	}

	/**
	 * `harmonist` comes in: chord tones `sweep` (degrees above the sounding chord's
	 * root) quickly up from the next beat, then a harmony on the tune's notes
	 * through the end of its next whole bar (this one, if the next note starts it).
	 */
	#joinIn(
		o: Out,
		now: number,
		when: When,
		harmonist: { voice: string; up: number; gain: number },
		sweep: number[],
		gain: number,
		len: number
	) {
		const from = this.#onBeat(now, 20);
		const { root, key } = this.#sounding(from);
		const tb = timbre(o.ctx, harmonist.voice);
		const gap = (this.#six * this.clock.ms) / 2;
		sweep.forEach((k, i) => pluck(o, tb, this.#midi(root + k, key), when(from + i * gap), gain, len));
		const notes = this.#song.notes;
		const bar = (j: number) => {
			while (!notes[j % notes.length].downbeat) j++;
			return j;
		};
		let end = bar(this.#i + 1);
		if (!notes[this.#i].downbeat) end = bar(end + 1);
		this.#harmony = end - this.#i;
		this.#harmonist = harmonist;
	}

	/**
	 * A color finished: the music swells and (unless the color joins in, see
	 * `Rhythm.harmonize`) the tune runs on ahead. In that
	 * color's voice, just after the note that finished it, a sweep comes up the
	 * chord into the tune's next notes, which play on a beat through to the
	 * first of a bar and hold there. The tune goes on from after it, so each
	 * color's flourish is a different stretch of it.
	 */
	done(color?: string) {
		this.#play((o, now, when) => {
			this.#heatTo(o, now, when(now), this.#warmth(now) + 0.35);
			// Or, joining in: up the chord in the color's voice, into the tune's octave, and
			// then a harmony a third or so above the tune in that voice.
			if (this.#joins) {
				const voice = color ?? PLAIN;
				this.#joinIn(o, now, when, { voice, up: 0, gain: 0.045 }, [7, 9, 11, 14], 0.045, 0.4);
				return;
			}
			const tb = timbre(o.ctx, color);
			const { run, next } = this.#ahead();
			const [first, last] = [run[0], run[run.length - 1]];
			this.#key = first.key;
			const sweep: number[] = [];
			for (let d = first.deg - 7; d < first.deg; d++) if (isChordTone(d, first.root)) sweep.push(d);
			// The sweep in thirty-seconds, up to the run's first note.
			const gap = (this.#six * this.clock.ms) / 2;
			// After any flourish still playing: the tune runs on from it, over its chord.
			const beat = this.#onBeat(now, 30 + sweep.length * gap);
			const on = this.#ends > beat;
			const from = on ? this.#ends : beat;
			sweep.forEach((d, i) => {
				pluck(o, tb, this.#midi(d), when(from - (sweep.length - i) * gap), 0.045, 0.4);
			});
			// Its first note brings in its chord, unless it's a bar's first already or carries on from a run.
			if (!first.chord && !on) this.#chord(o, when(from), first.root, this.#heat);
			this.#flourish(o, when, tb, run, from, 0.075, 1.4, this.#heat);
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
			const lead = now + 2 * this.#six * this.clock.ms;
			const from = this.clock.next(Math.max(lead, this.#ends), this.#pulse);
			const at = this.#flourish(o, when, tb, end, from, 0.08, 2.4, this.#warmth(now));
			const top = end[end.length - 1].deg;
			const six = this.#six * this.clock.ms;
			RING.forEach((k, i) => pluck(o, tb, this.#midi(top + k), when(at + (i + 1) * six), 0.035, 2));
			this.#i = 0;
			this.#root = 0;
			this.#key = this.#song.home;
		});
	}
}

export const music = new Music();
