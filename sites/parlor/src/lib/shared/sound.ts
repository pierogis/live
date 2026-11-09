/*
 * A little synth that plays a tune as you play, no sound files.
 *
 * Each level writes its own song ahead of time: a key, a mode, a four-chord loop
 * and a 16-bar tune over it in four phrases, A A′ B A′. A ends open, A′ comes
 * home to the tonic, B climbs higher. Each thing that lands plays the song's
 * next note right then, so the tune keeps its order and play sets its rhythm.
 *
 * Things that land close together are a run, timed in sixteenth notes of the
 * game's own beat (Mosaic's dots, Forage's clock): the tune plays on in its own
 * rhythm, a quarter note four beats on, and the beats between tune notes keep a
 * quiet chord pattern going below, or rest. (A tune note on every one is too
 * fast to hear as a tune and tumbles like a fall.) Each bar brings in its chord,
 * low and soft, and lets it ring until the next bar's comes in, so the pauses
 * between moves sound held rather than empty. A pause also ends the phrase: the
 * next note starts the next bar, chord and all, so each burst of moves is a
 * phrase of its own. A finished picture ends on the home chord.
 *
 * Quick moves swell it: each warms the music, and the warmth cools over a few
 * seconds. Warm, the tune is brighter and louder and doubled an octave up, and
 * the chords grow and gain an octave. Finishing a color swells it more, with the
 * chord again and a sweep up it.
 *
 * Each color has its own voice, close kin rather than different instruments: see
 * `timbre`.
 */
import { makeRng, pickOne, type Rng } from './engine.ts';
import { lab } from './palette.ts';

/** Scales as semitones above the tonic, with chord loops as scale degrees. */
const MODES: Record<string, { scale: number[]; loops: number[][] }> = {
	major: {
		scale: [0, 2, 4, 5, 7, 9, 11],
		// I vi IV V, I IV vi V, I V vi IV, I iii IV V
		loops: [
			[0, 5, 3, 4],
			[0, 3, 5, 4],
			[0, 4, 5, 3],
			[0, 2, 3, 4]
		]
	},
	mixolydian: {
		scale: [0, 2, 4, 5, 7, 9, 10],
		loops: [
			[0, 6, 3, 0],
			[0, 3, 6, 4]
		]
	},
	dorian: {
		scale: [0, 2, 3, 5, 7, 9, 10],
		loops: [
			[0, 3, 0, 6],
			[0, 6, 3, 4]
		]
	},
	minor: {
		scale: [0, 2, 3, 5, 7, 8, 10],
		loops: [
			[0, 5, 6, 4],
			[0, 3, 6, 2],
			[0, 5, 2, 6]
		]
	}
};
/** Majors come up more often: the site is calm, not moody. */
const MODE_ODDS = ['major', 'major', 'major', 'mixolydian', 'dorian', 'minor'];
/** Tonics as MIDI notes, C4 to F4, so the tune sits an octave above them. */
const TONICS = [60, 61, 62, 63, 64, 65];

/** A sixteenth note, in seconds: the echo's and the rolled chords' pace. */
const UNIT = 0.09;
/** How long a bar's chord rings, unless the next bar's comes in first. */
const BAR = 3.2;
/** A pause this long (seconds) ends the bar: the next move starts the next one. */
const REST = 1.5;
/** Moves closer together than this (seconds) swell the music; slower ones barely do. */
const QUICK = 1;
/** How fast the swell cools: it falls to about a third in this many seconds. */
const COOL = 5;
/** The tune's low-pass, cool and fully swelled (Hz). */
const TONE_REST = 3000;
const TONE_HOT = 12000;
/** How much louder the chords get, fully swelled: 1 + this times. */
const PAD_HOT = 1.6;

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

interface Note {
	/** Scale degrees above the tonic. */
	deg: number;
	/** Sixteenths. */
	len: number;
	/** The bar's chord root, as a scale degree. */
	root: number;
	/** The first note of its bar. */
	downbeat: boolean;
}

interface Song {
	tonic: number;
	scale: number[];
	notes: Note[];
}

/**
 * One bar of tune. Notes on the beat (the bar's first and middle) are chord
 * tones near the last note; the rest step along the bar's direction, now and
 * then turning back. A phrase's `last` bar ends on its chord's root.
 */
function bar(
	r: Rng,
	rhythm: number[],
	root: number,
	prev: number,
	lo: number,
	hi: number,
	last: boolean
): Note[] {
	let dir = r() < 0.5 ? 1 : -1;
	if (prev >= hi - 2) dir = -1;
	if (prev <= lo + 2) dir = 1;
	const out: Note[] = [];
	let pos = 0;
	let d = prev;
	rhythm.forEach((len, i) => {
		if (last && i === rhythm.length - 1) {
			// The chord's root nearest the last note.
			const below = d - mod7(d - root);
			d = d - below <= 3 ? below : below + 7;
			if (d > hi) d -= 7;
			if (d < lo) d += 7;
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
		out.push({ deg: d, len, root, downbeat: i === 0 });
		pos += len;
	});
	return out;
}

/** One phrase: four bars over the loop; one that comes `home` ends on the tonic. */
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
		const root = b === 3 && home ? 0 : loop[b];
		const ns = bar(r, rhythms[b], root, prev, lo, hi, b === 3);
		out.push(...ns);
		prev = ns[ns.length - 1].deg;
	}
	return out;
}

function compose(seed: number): Song {
	const r = makeRng(seed || 1);
	const mode = MODES[pickOne(MODE_ODDS, r)];
	const tonic = pickOne(TONICS, r);
	const loop = pickOne(mode.loops, r);
	const rhythms = () => [
		pickOne(RHYTHMS, r),
		pickOne(RHYTHMS, r),
		pickOne(RHYTHMS, r),
		pickOne(ENDINGS, r)
	];
	const ra = rhythms();
	const rb = rhythms();
	// A and A′ share their first three bars: the same seed, so the same notes.
	const aSeed = Math.floor(r() * 2 ** 32) || 1;
	const a = phrase(makeRng(aSeed), loop, ra, 6, 2, 10, false);
	const a2 = phrase(makeRng(aSeed), loop, ra, 6, 2, 10, true);
	const b = phrase(r, loop, rb, a[a.length - 1].deg + 2, 4, 11, false);
	return { tonic, scale: mode.scale, notes: [...a, ...a2, ...b, ...a2] };
}

// ---------- the synth ----------

/** Where notes go: tune notes through `tone`, chord notes through `pad`, both into `input`. */
interface Out {
	ctx: AudioContext;
	tone: BiquadFilterNode;
	pad: GainNode;
	input: GainNode;
}

let actx: AudioContext | null = null;
/** The echo and limiter, built once: every output feeds them. */
let effects: AudioNode | null = null;
let outs: Out | null = null;

/** A soft echo and a limiter, so a run of notes never clips. Returns their input. */
function buildEffects(ctx: AudioContext): AudioNode {
	const limit = ctx.createDynamicsCompressor();
	limit.threshold.value = -12;
	limit.ratio.value = 8;
	limit.connect(ctx.destination);
	const dry = ctx.createGain();
	const echo = ctx.createDelay(1);
	const back = ctx.createGain();
	const wet = ctx.createGain();
	echo.delayTime.value = UNIT * 3;
	back.gain.value = 0.25;
	wet.gain.value = 0.14;
	dry.connect(limit);
	dry.connect(echo);
	echo.connect(back).connect(echo);
	echo.connect(wet).connect(limit);
	return dry;
}

/**
 * The output: tune notes through a low-pass that opens as the music swells,
 * chords through a gain that grows with it, then the effects. `hush` cuts it
 * off and the next call makes a fresh one.
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
		const pad = ctx.createGain();
		pad.connect(input);
		outs = { ctx, tone, pad, input };
	}
	if (outs.ctx.state === 'suspended') void outs.ctx.resume();
	return outs;
}

/**
 * How a color sounds: close kin, not different instruments. Its lightness sets
 * the brightness (light colors thinner and crisper, dark ones rounder, softer
 * and a little longer), its hue the kind of tone (warm colors hollow and reedy,
 * cool ones full), its colorfulness a shimmer (a second voice a few cents off;
 * grays have none). Without a color, a triangle with a quiet octave; chords are
 * sines with a quieter one, through the pad.
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
		t = { ...plain, pad: true, wave: wave(ctx, [0, 1, 0.1]) };
	} else {
		const [L, a, b] = lab(key);
		const light = Math.min(1, Math.max(0, L / 100));
		// Warm: reds, oranges and yellows, 1; blues and greens, near 0.
		const warm = (Math.cos(Math.atan2(b, a) - (50 * Math.PI) / 180) + 1) / 2;
		const vivid = Math.min(1, Math.hypot(a, b) / 70);
		// Harmonics fall off steeply when dark, gently when light; warm ones lose their even harmonics.
		const fall = 2.4 - 1.3 * light;
		const levels = [0];
		for (let n = 1; n <= 10; n++) levels.push(n ** -fall * (n % 2 ? 1 : 1 - 0.75 * warm));
		t = {
			wave: wave(ctx, levels),
			attack: 0.016 - 0.012 * light,
			len: 1.15 - 0.3 * light,
			detune: 5 + 7 * vivid,
			chorus: 0.5 * vivid,
			pad: false
		};
	}
	timbres.set(key, t);
	return t;
}

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** A plucked note in voice `tb`, falling away over `len` seconds (times the voice's own). */
function pluck(o: Out, tb: Timbre, midi: number, t: number, gain: number, len: number): GainNode {
	len *= tb.len;
	const g = o.ctx.createGain();
	g.gain.setValueAtTime(0.0001, t);
	g.gain.exponentialRampToValueAtTime(gain, t + tb.attack);
	g.gain.exponentialRampToValueAtTime(0.0001, t + len);
	g.connect(tb.pad ? o.pad : o.tone);
	const osc = (cents: number) => {
		const v = o.ctx.createOscillator();
		v.setPeriodicWave(tb.wave);
		v.frequency.value = hz(midi);
		v.detune.value = cents;
		v.start(t);
		v.stop(t + len + 0.02);
		return v;
	};
	osc(0).connect(g);
	if (tb.chorus) {
		const level = o.ctx.createGain();
		level.gain.value = tb.chorus;
		osc(tb.detune).connect(level).connect(g);
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

/** Run `f` with the output and the time now; a browser without audio stays quiet. */
function safely(f: (o: Out, t: number) => void) {
	try {
		const o = out();
		f(o, o.ctx.currentTime);
	} catch {
		/* audio not available */
	}
}

/** How a game's landings come: a run's beat, and whether its beats between tune notes play. */
export interface Rhythm {
	/** Seconds between things landing in a run: a sixteenth note. */
	beat: number;
	/** Fill the beats between tune notes with a quiet chord pattern, rather than rest. */
	fill: boolean;
}

/** The quiet pattern between tune notes: root, fifth, third, fifth of the chord. */
const FILL = [0, 4, 2, 4];
/** The chord's notes above its root; hot, an octave more. */
const TRIAD = [0, 2, 4];
const FULL = [0, 2, 4, 7];
/** A finished color's sweep up its chord, and the win's roll up the home chord. */
const SWEEP = [0, 2, 4, 7, 9, 11, 14];
const HOME = [0, 2, 4, 7, 9];

export class Music {
	#seed = 1;
	/** The level's song, written the first time it plays. */
	#written: Song | null = null;
	#rhythm: Rhythm = { beat: 0.1, fill: false };
	/** The next note to play, as an index into the song. */
	#i = 0;
	/** The chord under the last note played. */
	#root = 0;
	/** When the last note played, when its run began, and the beat its next tune note is due. */
	#last = -Infinity;
	#runStart = 0;
	#due = 0;
	/** The ringing chord's notes, faded out when the next one comes in. */
	#held: GainNode[] = [];
	/** How swelled the music is, 0 to 1, as of `#heatAt`; it cools from there. */
	#heat = 0;
	#heatAt = 0;
	/** When the last move was made. */
	#lastMove = -Infinity;

	/** A new level: its own song, from the top, cool, with anything still ringing cut off. */
	seed(seed: number, rhythm: Rhythm) {
		this.#seed = seed;
		this.#written = null;
		this.#rhythm = rhythm;
		this.#i = 0;
		this.#root = 0;
		this.#last = -Infinity;
		this.#heat = 0;
		this.#lastMove = -Infinity;
		timbres.clear();
		this.hush();
	}

	get #song() {
		return (this.#written ??= compose(this.#seed));
	}

	/** Stop what's ringing: later notes go to a fresh output. */
	hush() {
		outs?.input.disconnect();
		outs = null;
		this.#held = [];
	}

	#midi(deg: number) {
		const { tonic, scale } = this.#song;
		return tonic + 12 * Math.floor(deg / 7) + scale[mod7(deg)];
	}

	/** The heat at `t`. */
	#warmth(t: number) {
		return this.#heat * Math.exp(-(t - this.#heatAt) / COOL);
	}

	/** Set the heat at `t`: the tune's filter opens and the chords grow to match, then both cool. */
	#heatTo(o: Out, t: number, h: number) {
		this.#heat = Math.min(1, h);
		this.#heatAt = t;
		swell(o.tone.frequency, t, TONE_REST + (TONE_HOT - TONE_REST) * this.#heat, TONE_REST);
		swell(o.pad.gain, t, 1 + PAD_HOT * this.#heat, 1);
	}

	/**
	 * A move went through: the music warms a lot when it comes quickly after the
	 * last one, a little when it doesn't, so a quick run of moves swells it.
	 */
	move() {
		safely((o, t) => {
			const quick = t - this.#lastMove < QUICK;
			this.#lastMove = t;
			this.#heatTo(o, t, this.#warmth(t) + (quick ? 0.2 : 0.06));
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

	/** Strike chord `root` at `t`: its root low, its notes soft below the tune, an octave more when hot. */
	#chord(o: Out, t: number, root: number, h: number) {
		this.#release(t);
		const tb = timbre(o.ctx, CHORD);
		this.#held.push(pluck(o, tb, this.#midi(root) - 24, t, 0.09, BAR));
		for (const k of h > 0.5 ? FULL : TRIAD) {
			this.#held.push(pluck(o, tb, this.#midi(root + k) - 12, t, 0.022, BAR));
		}
	}

	/**
	 * Something landed, now, in `color`'s voice (a hex), `soft`er for a side
	 * landing (Mosaic's tray). It's a beat of a run if it comes soon after the
	 * last; the first plays the song's next note, later beats play the next once
	 * the last one's length has gone by, and between them the game's fill, or
	 * nothing. Things landing together play once. Hot, the tune is louder and
	 * doubled an octave up.
	 */
	note(color?: string, soft = false) {
		safely((o, t) => {
			const { beat, fill } = this.#rhythm;
			const gap = t - this.#last;
			if (gap < beat / 2) return;
			if (gap > 3 * beat) this.#runStart = t;
			this.#last = t;
			const step = Math.round((t - this.#runStart) / beat);
			const tb = timbre(o.ctx, color);
			const h = this.#warmth(t);
			const gain = (soft ? 0.055 : 0.08) * (1 + 0.5 * h);
			if (step > 0 && step < this.#due) {
				if (fill) pluck(o, tb, this.#midi(this.#root + FILL[step % 4]), t, gain * 0.3, 0.12);
				return;
			}
			const notes = this.#song.notes;
			// After a pause, pick up at the next bar rather than mid-phrase.
			if (gap > REST && this.#i !== 0) {
				while (!notes[this.#i].downbeat) this.#i = (this.#i + 1) % notes.length;
			}
			const n = notes[this.#i];
			this.#i = (this.#i + 1) % notes.length;
			this.#root = n.root;
			this.#due = step + n.len;
			// Held notes in the song ring a little longer.
			const len = n.len >= 8 ? 0.7 : 0.45;
			pluck(o, tb, this.#midi(n.deg), t, gain, len);
			if (h > 0.3) pluck(o, tb, this.#midi(n.deg) + 12, t, gain * 0.6 * (h - 0.2), len);
			if (n.downbeat) this.#chord(o, t, n.root, h);
		});
	}

	/** A move that sets things going (an ant sent off): a short quiet note on the chord's root. */
	tap(color?: string) {
		safely((o, t) => pluck(o, timbre(o.ctx, color), this.#midi(this.#root), t, 0.04, 0.12));
	}

	/** A move that can't go: a short low note on the chord's root. */
	nope() {
		safely((o, t) => pluck(o, timbre(o.ctx, CHORD), this.#midi(this.#root) - 12, t, 0.06, 0.14));
	}

	/** Something opened (or the sound came on): the chord, rolled upward. */
	chime() {
		safely((o, t) => {
			const tb = timbre(o.ctx);
			FULL.forEach((k, i) => pluck(o, tb, this.#midi(this.#root + 7 + k), t + i * UNIT, 0.05, 0.6));
		});
	}

	/**
	 * A color finished: the music swells, the chord comes in again and its notes
	 * sweep up two octaves to a held top in that color's voice, just after the
	 * note that finished it.
	 */
	done(color?: string) {
		safely((o, now) => {
			const t = now + 0.03;
			this.#heatTo(o, t, this.#warmth(t) + 0.35);
			this.#chord(o, t, this.#root, this.#heat);
			const tb = timbre(o.ctx, color);
			SWEEP.forEach((k, i) => {
				const top = i === SWEEP.length - 1;
				const at = t + i * UNIT * 0.6;
				pluck(o, tb, this.#midi(this.#root + k), at, top ? 0.075 : 0.045, top ? 1.4 : 0.4);
			});
		});
	}

	/** A finished picture: the home chord, rolled up and held, just after the last note. */
	cadence() {
		safely((o, now) => {
			const t = now + UNIT * 2;
			this.#release(t);
			pluck(o, timbre(o.ctx, CHORD), this.#midi(0) - 24, t, 0.1, 2.4);
			const tb = timbre(o.ctx);
			HOME.forEach((k, i) => pluck(o, tb, this.#midi(k), t + i * UNIT, 0.06, 2));
			this.#i = 0;
		});
	}
}

export const music = new Music();
