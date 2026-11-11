/*
 * A little synth that plays a tune as you play, no sound files.
 *
 * Each level writes its own song: a key and a mode (the church modes, harmonic
 * minor and phrygian dominant, and pentatonics, Japan's yo and in among them), a
 * style (a quiet pattern of its own, its tempo, the tune's range and how much it
 * leaps, how adventurous it is, and sometimes 3/4, 5/4 or 7/8, or swing, Forage's
 * only a little), a motif of a few notes that its bars are built on (a mural's
 * songs share one, rhythm and all), and 32 bars in eight
 * phrases, A A′ B B′ C C′ A A′. A is the level's theme over one chord loop;
 * A′ starts the same and comes home to the tonic through the V chord. B goes on
 * over another loop and comes home too; C goes somewhere else, a key with
 * home's notes centered elsewhere (now and then in another meter), and leaves it
 * open for A to come back, which opens as it did and goes on anew. Each time through,
 * the song writes a new B, C and returning A. The tune breathes at the ends of
 * phrases. Each thing that lands plays the song's
 * next note right then, so the tune keeps its order and play sets its rhythm;
 * only progress moves it on (Mosaic's dots going to the tray play quietly).
 *
 * The level keeps one beat (`Clock`), in sixteenth notes of about the game's pace
 * (100 ms, Forage's ticks and two of Mosaic's dots), each song a little quicker or
 * slower (134 to 170 beats a minute; Forage's ticks keep to it), and the games land things on its
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
 * music and the color joins in the same way, in its own voice, so the tune
 * keeps following play (in Forage, where colonies finish often, more briefly:
 * one note, not a sweep); a finished picture plays the song's own ending, V to I,
 * so it always ends at home. Each starts on a beat. In Forage, foods of two
 * colors picked up together bend the echo.
 *
 * A livelier song colors all this in: sevenths (on top, never crowding the
 * chord), a cadence that sidesteps to vi, rhythms off the beat, the motif slowed
 * down or in fragments, rests, and a quiet pattern that doesn't fit the bar and
 * drifts across it (`spiceUp`, `DRIFTS`). Only an adventurous one leaves its key,
 * and sparingly (`color`): a bar leaning into the next one's chord as its V, a chord
 * borrowed from the parallel key before a cadence, a passing note a half step
 * between two of the key's, off the beat, or a C a fourth away, one note new.
 * Never chords that clash or keys far off: those sounded like wrong notes.
 *
 * Each level's tune plays in one instrument, its lead (from electric piano and
 * brass to harp and glass), so it sounds played rather than passed from hand to
 * hand as things of different colors land in turn. Under it, softly, each
 * landing plays the same note in its color's own instrument, from the color's
 * place left or right (`LAYER`), so colors still sound apart; a color that
 * finishes joins in that instrument too. A color's instrument is picked by its
 * hue and lightness, never the lead's, and
 * no two colors of a level the same while there are instruments to go round: see
 * `voiceOf`. Each instrument has its own attack (a knock, a pluck, a breath), its
 * own out-of-tune overtones or frequency modulation, its own way of moving (a
 * scoop, a pluck's settling pitch), and each color its own place left or right.
 */
import { hashStr, makeRng, pickOne, type Rng } from './engine.ts';
import { lab } from './palette.ts';

/**
 * Scales as semitones above the tonic, with chord loops as scale degrees, and
 * the keys a song's contrasting section can go to: a mode and its tonic, in
 * semitones from home. Each uses the same notes as home, centered elsewhere (C
 * major's A minor, D dorian, G mixolydian), so the section changes mood without
 * a note sounding out of place; harmonic minor, which has no such key, goes to
 * its plain minor or that minor's relative major, a note apart.
 */
const MODES: Record<
	string,
	{
		scale: number[];
		/** Where its tonic sits in the major key with its notes, in semitones above that key's (harmonic minor as minor). */
		rotation: number;
		loops: number[][];
		away: [string, number][];
		/** A pentatonic: the scale degrees (mod 7) its tune always steps around, off its chord. */
		avoid?: number[];
	}
> = {
	major: {
		rotation: 0,
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
			['dorian', 2],
			['mixolydian', -5]
		]
	},
	mixolydian: {
		rotation: 7,
		scale: [0, 2, 4, 5, 7, 9, 10],
		loops: [
			[0, 6, 3, 0],
			[0, 3, 6, 4],
			[0, 4, 6, 3]
		],
		away: [
			['major', 5],
			['minor', 2],
			['dorian', -5]
		]
	},
	dorian: {
		rotation: 2,
		scale: [0, 2, 3, 5, 7, 9, 10],
		loops: [
			[0, 3, 0, 6],
			[0, 6, 3, 4],
			[0, 1, 3, 0]
		],
		away: [
			['major', -2],
			['mixolydian', 5],
			['minor', -5]
		]
	},
	minor: {
		rotation: 9,
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
			['dorian', 5],
			['mixolydian', -2]
		]
	},
	// Major with a raised fourth: bright and floating, II major.
	lydian: {
		rotation: 5,
		scale: [0, 2, 4, 6, 7, 9, 11],
		loops: [
			[0, 1, 0, 4],
			[0, 1, 5, 4],
			[0, 2, 1, 0]
		],
		away: [
			['major', -5],
			['minor', 4],
			['mixolydian', 2]
		]
	},
	// Minor with a raised seventh: V major, a little old-world.
	harmonic: {
		rotation: 9,
		scale: [0, 2, 3, 5, 7, 8, 11],
		loops: [
			[0, 3, 4, 0],
			[0, 5, 3, 4],
			[0, 3, 5, 4]
		],
		away: [
			['minor', 0],
			['major', 3]
		]
	},
	// Minor with a lowered second: bII, Spanish.
	phrygian: {
		rotation: 4,
		scale: [0, 1, 3, 5, 7, 8, 10],
		loops: [
			[0, 1, 0, 6],
			[0, 1, 6, 0],
			[0, 6, 5, 1]
		],
		away: [
			['major', -4],
			['minor', 5],
			['dorian', -2]
		]
	},
	// Phrygian with a major third: harmonic minor from its fifth, the Middle East and Spain.
	'phrygian-dominant': {
		rotation: 4,
		scale: [0, 1, 4, 5, 7, 8, 10],
		// I bII I bvii, I bII bvii I, I iv bII I, I bvii bII I
		loops: [
			[0, 1, 0, 6],
			[0, 1, 6, 0],
			[0, 3, 1, 0],
			[0, 6, 1, 0]
		],
		// Its harmonic minor, plain phrygian, the major a third below: each a note apart.
		away: [
			['harmonic', 5],
			['phrygian', 0],
			['major', -4]
		]
	},
	// The pentatonics: a seven-note mode whose tune steps around two of its notes.
	// Major's without its 4th and 7th; minor's without its 2nd and 6th.
	pentatonic: {
		rotation: 0,
		scale: [0, 2, 4, 5, 7, 9, 11],
		avoid: [3, 6],
		loops: [
			[0, 5, 3, 4],
			[0, 4, 5, 3],
			[0, 3, 0, 4],
			[0, 5, 1, 4]
		],
		away: [
			['minor-pentatonic', -3],
			['dorian', 2],
			['mixolydian', -5]
		]
	},
	'minor-pentatonic': {
		rotation: 9,
		scale: [0, 2, 3, 5, 7, 8, 10],
		avoid: [1, 5],
		loops: [
			[0, 5, 6, 4],
			[0, 3, 6, 0],
			[0, 6, 5, 6],
			[0, 3, 4, 0]
		],
		away: [
			['pentatonic', 3],
			['dorian', 5],
			['mixolydian', -2]
		]
	},
	// Japan's folk pentatonics: yo (no half steps; mixolydian without its 3rd and 7th)
	// and in (phrygian without its 3rd and 7th, its half steps above the root and fifth).
	yo: {
		rotation: 7,
		scale: [0, 2, 4, 5, 7, 9, 10],
		avoid: [2, 6],
		loops: [
			[0, 6, 3, 0],
			[0, 3, 6, 4],
			[0, 4, 6, 3]
		],
		away: [
			['in', -3],
			['pentatonic', 5],
			['dorian', -5]
		]
	},
	in: {
		rotation: 4,
		scale: [0, 1, 3, 5, 7, 8, 10],
		avoid: [2, 6],
		loops: [
			[0, 1, 0, 6],
			[0, 1, 6, 0],
			[0, 6, 5, 1]
		],
		away: [
			['yo', 3],
			['minor-pentatonic', 5],
			['phrygian', 0]
		]
	}
};
/** A level's mode when it doesn't name one: major no likelier than the rest. */
const MODE_ODDS = [
	'major',
	'mixolydian',
	'lydian',
	'dorian',
	'minor',
	'harmonic',
	'phrygian',
	'pentatonic',
	'minor-pentatonic'
];
/**
 * Scale degrees a pentatonic tune steps around (unless its chord has them), by mode:
 * a major's 4th and 7th, a minor's 2nd and 6th. Other modes keep all seven.
 */
const PENTATONIC: Record<string, number[]> = {
	major: [3, 6],
	mixolydian: [3, 6],
	minor: [1, 5],
	dorian: [1, 5]
};
/** Tonics as MIDI notes, G3 to F♯4, so the tune sits an octave above them. */
const TONICS = [55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66];

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
/** The tune's low-pass, cool and fully swelled (Hz): open enough cool for each instrument's character. */
const TONE_REST = 6500;
const TONE_HOT = 12000;
/** How much louder the chords get, fully swelled: 1 + this times. */
const PAD_HOT = 0.8;

/** Beats to a bar: 4/4, 3/4, 5/4, and 7/8 (seven eighths, as 2+2+3). */
type Meter = 4 | 3 | 5 | 7;
/** Where a bar's strong beats fall, in sixteenths: the tune is on a chord tone there. */
const STRONG: Record<Meter, number[]> = { 4: [0, 8], 3: [0], 5: [0, 12], 7: [0, 8] };

/**
 * A bar's rhythm, in sixteenths, by meter: plainest first, so a gentle song can keep
 * to the front of the list (see `rhythms`).
 */
const RHYTHMS: Record<Meter, number[][]> = {
	4: [
		[8, 4, 4],
		[4, 4, 8],
		[4, 4, 4, 4],
		[4, 8, 4],
		[6, 2, 4, 4],
		[4, 2, 2, 4, 4],
		[4, 4, 2, 2, 4],
		[2, 2, 4, 8],
		[6, 2, 6, 2],
		[3, 3, 2, 4, 4],
		[2, 2, 4, 2, 2, 4],
		[4, 2, 2, 2, 2, 4],
		[2, 2, 2, 2, 4, 4],
		[2, 2, 2, 2, 2, 2, 4]
	],
	3: [
		[8, 4],
		[4, 8],
		[4, 4, 4],
		[6, 2, 4],
		[4, 2, 2, 4],
		[4, 4, 2, 2],
		[2, 2, 4, 4],
		[6, 2, 2, 2],
		[2, 2, 2, 2, 4],
		[2, 2, 2, 2, 2, 2]
	],
	5: [
		[8, 4, 4, 4],
		[4, 4, 4, 8],
		[4, 4, 4, 4, 4],
		[6, 2, 4, 4, 4],
		[4, 2, 2, 4, 4, 4],
		[4, 4, 4, 2, 2, 4],
		[2, 2, 4, 4, 4, 4],
		[6, 2, 6, 2, 4]
	],
	7: [
		[8, 6],
		[4, 4, 6],
		[6, 4, 4],
		[2, 2, 4, 6],
		[4, 2, 2, 6],
		[4, 4, 2, 2, 2],
		[4, 2, 2, 4, 2],
		[2, 2, 2, 2, 6],
		[2, 2, 2, 2, 2, 4]
	]
};
/** Rhythms off the beat, for a livelier song: notes that land between beats and hold over them. */
const SYNCOPATED: Record<Meter, number[][]> = {
	4: [
		[2, 4, 2, 4, 4],
		[3, 3, 4, 2, 4],
		[2, 4, 4, 2, 4],
		[4, 6, 2, 4],
		[6, 6, 4],
		[3, 3, 3, 3, 4],
		[2, 4, 6, 4]
	],
	3: [
		[2, 4, 2, 4],
		[3, 3, 6],
		[2, 4, 6],
		[3, 3, 2, 4]
	],
	5: [
		[2, 4, 2, 4, 4, 4],
		[4, 6, 2, 4, 4],
		[3, 3, 4, 2, 4, 4]
	],
	7: [
		[2, 4, 2, 6],
		[3, 3, 2, 6],
		[2, 4, 4, 4]
	]
};
/** A phrase's last bar: it lands and holds. */
const ENDINGS: Record<Meter, number[][]> = {
	4: [
		[4, 4, 8],
		[2, 2, 4, 8],
		[6, 2, 8],
		[8, 8]
	],
	3: [[4, 8], [2, 2, 8], [6, 6], [12]],
	5: [
		[4, 4, 12],
		[8, 12],
		[4, 4, 4, 8]
	],
	7: [
		[4, 4, 6],
		[8, 6],
		[2, 2, 4, 6]
	]
};

/**
 * The quiet pattern between tune notes, by meter: a chord degree for each eighth
 * from where the chord came in (0 its root, 2 third, 4 fifth, 7 its root up an
 * octave). Each level plays one.
 */
const FILLS: Record<Meter, number[][]> = {
	4: [
		[0, 4, 2, 4], // Alberti
		[0, 2, 4, 7], // up the chord
		[7, 4, 2, 0], // down it
		[0, 7, 0, 7], // broken octaves
		[0, 4, 0, 4], // bass and fifth
		[0, 2, 4, 2] // up and back
	],
	3: [
		[0, 4, 2, 4, 2, 4],
		[0, 7, 4, 7, 4, 7],
		[0, 2, 4, 7, 4, 2],
		[0, 4, 7, 4, 7, 4]
	],
	5: [
		[0, 4, 2, 4, 7],
		[0, 2, 4, 7, 4]
	],
	7: [
		[0, 4, 2, 4, 0, 4, 7],
		[0, 2, 4, 0, 2, 4, 7]
	]
};
/**
 * Patterns that don't fit the bar, for an adventurous song: counted from the song's
 * start rather than each chord, they drift across the beat and come back around
 * every few bars, like a loop of a different length.
 */
const DRIFTS: Record<Meter, number[][]> = {
	4: [
		[0, 4, 7],
		[7, 4, 2],
		[0, 2, 4, 7, 4]
	],
	3: [
		[0, 4, 2, 7],
		[0, 2, 4, 7, 4]
	],
	5: [
		[0, 4, 7],
		[0, 2, 4, 7]
	],
	7: [
		[0, 4, 7],
		[0, 2, 4, 7]
	]
};

/**
 * What makes a level's song its own beyond its notes: its meter and swing (with
 * the game's say-so), its quiet pattern, the tune's range, how much it leaps,
 * and whether it steps around two of the scale's notes, a pentatonic; and how
 * adventurous it is.
 */
interface Style {
	meter: Meter;
	/** How far an off eighth waits, as a part of an eighth (0 straight, ⅓ a triplet swing). */
	swing: number;
	fill: number[];
	lo: number;
	hi: number;
	/** How often the motif leaps rather than steps, 0 to 1. */
	leap: number;
	/** Scale degrees (mod 7) the tune steps around, off its chord. */
	avoid: number[];
	/**
	 * How adventurous the song is, 0 to 1: how often its chords are richer, its
	 * rhythms off the beat, its motif varied and its cadences sidestep. A third of
	 * levels stay gentle.
	 */
	spice: number;
	/** The quiet pattern is one of `DRIFTS`, counted from the song's start. */
	drift: boolean;
	/**
	 * Its tempo, as how long its sixteenth is next to the game's beat: 0.88 (quicker) to
	 * 1.12 (slower). Each song keeps one beat throughout.
	 */
	pace: number;
}

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
	/** Its chord, if it brings one, has its seventh, on top. */
	seventh?: boolean;
	/** A rest: the tune breathes here, and what lands plays the quiet pattern. */
	rest?: boolean;
	/** Semitones off its degree: a passing note between two of the key's, in an adventurous song. */
	alt?: number;
	/** Its section's meter and quiet pattern, when that's not the song's (a C in another meter). */
	meter?: Meter;
	fill?: number[];
}

/** A placeholder, until `compose` puts a phrase's notes in its key. */
const NO_KEY: Key = { tonic: 60, scale: [] };

interface Song {
	home: Key;
	notes: Note[];
	style: Style;
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
 * A motif: its notes' steps from its first, in scale degrees. Three to five
 * notes, at least one a leap (more as `leap` says), spanning a third to a fifth
 * (a seventh, `wide`).
 */
function motif(r: Rng, leap: number, wide = false): number[] {
	const n = 3 + Math.floor(r() * 3);
	const most = wide ? 6 : 4;
	for (;;) {
		const out = [0];
		let d = 0;
		let leaps = 0;
		for (let i = 1; i < n; i++) {
			const big = r() < leap;
			const size = big ? pickOne(wide ? [2, 3, 4, 5] : [2, 2, 2, 3, 4], r) : r() < 0.1 ? 0 : 1;
			d += size * (r() < 0.5 ? 1 : -1);
			if (big) leaps++;
			out.push(d);
		}
		const span = Math.max(...out) - Math.min(...out);
		if (leaps > 0 && span >= 2 && span <= most) return out;
	}
}

/**
 * A variation that still sounds like the motif: upside down, or backwards; in an
 * adventurous song, also both at once, or just its opening notes (a fragment, which
 * a bar repeats from chord tone to chord tone, like a sequence).
 */
function vary(r: Rng, m: number[], spice = 0): number[] {
	const last = m[m.length - 1];
	if (r() < spice * 0.4) {
		if (m.length > 3 && r() < 0.5) return m.slice(0, 2 + Math.floor(r() * 2));
		return m.toReversed().map((x) => last - x);
	}
	if (r() < 0.5) return m.map((x) => -x);
	return m.toReversed().map((x) => x - last);
}

/**
 * How a phrase ends: on its chord's root (`open`), or a cadence over the V chord,
 * coming `home` to the I chord or, `deceptive`, sidestepping to the vi chord under
 * the same tonic.
 */
type End = 'open' | 'home' | 'deceptive';

/**
 * One bar of tune, the motif's shape on its chord: it starts on a chord tone near
 * the last note (one the shape fits in range from), and starts over on another
 * when the bar has more notes than it. Notes on the bar's strong beats are chord
 * tones, the rest keep their place in the shape, stepping around the style's
 * avoided notes. A phrase's last bar ends on its chord's root (`open`), or is a
 * cadence: over the V chord to ti or re, then up or down a step to the tonic,
 * which brings in the I chord (or the vi, `deceptive`).
 */
function bar(
	r: Rng,
	rhythm: number[],
	root: number,
	prev: number,
	style: Style,
	shape: number[],
	end?: End,
	exact = false
): Note[] {
	const { lo, hi } = style;
	const lowest = Math.min(...shape);
	const highest = Math.max(...shape);
	const strong = STRONG[style.meter];
	/** A chord tone the shape fits in range from, near `d`, rarely `d` itself. */
	const startNear = (d: number) => {
		const ok: number[] = [];
		for (let c = lo - lowest; c <= hi - highest; c++) if (isChordTone(c, root)) ok.push(c);
		if (!ok.length) return nearest(d, lo, hi, (c) => isChordTone(c, root));
		ok.sort((a, b) => Math.abs(a - d) + (a === d ? 2 : 0) - (Math.abs(b - d) + (b === d ? 2 : 0)));
		return ok[r() < 0.75 ? 0 : Math.min(1, ok.length - 1)];
	};
	const cadence = end === 'home' || end === 'deceptive';
	const out: Note[] = [];
	let pos = 0;
	let d = prev;
	let from = prev;
	rhythm.forEach((len, i) => {
		const n = {
			root,
			downbeat: i === 0,
			chord: i === 0,
			bar: 0,
			key: NO_KEY,
			strike: 'block' as Strike
		};
		const j = i % shape.length;
		if (end && i === rhythm.length - 1) {
			if (cadence) Object.assign(n, { root: end === 'home' ? 0 : 5, chord: true });
			d = nearest(d, lo, hi, (c) => mod7(c) === (cadence ? 0 : n.root));
		} else if (cadence && i === rhythm.length - 2) {
			d = nearest(d, lo, hi, (c) => mod7(c) === 1 || mod7(c) === 6);
		} else if (j === 0) {
			from = startNear(d);
			d = from;
		} else {
			d = Math.min(hi, Math.max(lo, from + shape[j]));
			const off = (c: number) => !isChordTone(c, root) && style.avoid.includes(mod7(c));
			// A theme's own bars keep its shape exactly, so every song on it is heard to share it.
			if (strong.includes(pos) && !exact) d = nearest(d, lo, hi, (c) => isChordTone(c, root));
			else if (off(d)) d = nearest(d, lo, hi, (c) => !off(c));
		}
		out.push({ ...n, deg: d, len });
		pos += len;
	});
	return out;
}

/**
 * One phrase: four bars over the loop, the motif on the first two, a variation
 * of it on the third, then an ending; a cadence ends over V instead.
 */
function phrase(
	r: Rng,
	loop: number[],
	rhythms: number[][],
	start: number,
	style: Style,
	shapes: number[][],
	end: End,
	exact = 0
): Note[] {
	const out: Note[] = [];
	let prev = start;
	for (let b = 0; b < 4; b++) {
		const last = b === 3;
		const root = last && end !== 'open' ? 4 : loop[b];
		const ns = bar(r, rhythms[b], root, prev, style, shapes[b], last ? end : undefined, b < exact);
		out.push(...ns);
		prev = ns[ns.length - 1].deg;
	}
	return out;
}

/**
 * A phrase's bar rhythms: three bars, then an ending. A gentle song keeps to the
 * plainer rhythms; a livelier one's are more often off the beat, and an adventurous
 * one's third bar (the motif's variation) may be in notes twice as long, the motif
 * slowed down. `motif`, a theme's own rhythm, takes the first two bars, where the
 * motif is, so songs on one theme sound it the same.
 */
function rhythms(r: Rng, style: Pick<Style, 'meter' | 'spice'>, motif?: number[]) {
	const { meter, spice } = style;
	const all = RHYTHMS[meter];
	const plain = spice < 0.3 ? all.slice(0, Math.ceil(all.length * 0.6)) : all;
	const one = () => (r() < spice * 0.6 ? pickOne(SYNCOPATED[meter], r) : pickOne(plain, r));
	const out = [one(), one(), one(), pickOne(ENDINGS[meter], r)];
	if (motif) out[0] = out[1] = motif;
	if (r() < spice * 0.3) {
		const slow: number[] = [];
		for (let i = 0; i < out[2].length; i += 2) slow.push(out[2][i] + (out[2][i + 1] ?? 0));
		out[2] = slow;
	}
	return out;
}

/**
 * Two phrases on motif `m` over `loop` from the same seed, so they share their
 * first three bars and differ in how they end, as `ends` says.
 */
function pair(
	r: Rng,
	loop: number[],
	start: number,
	style: Style,
	m: number[],
	ends: [End, End],
	motif?: number[]
) {
	const rh = rhythms(r, style, motif);
	const shapes = [m, m, vary(r, m, style.spice), m];
	const s = Math.floor(r() * 2 ** 32) || 1;
	return ends.map((end) => phrase(makeRng(s), loop, rh, start, style, shapes, end, motif ? 2 : 0));
}

/**
 * A coming back at the end of a pass: its first bar as it was, so it's heard
 * returning, then new rhythms, and the motif's variation a bar sooner.
 */
function again(
	r: Rng,
	loop: number[],
	start: number,
	style: Style,
	m: number[],
	first: number[],
	exact = false
) {
	const rh = rhythms(r, style);
	rh[0] = first;
	const shapes = [m, vary(r, m, style.spice), m, m];
	const s = Math.floor(r() * 2 ** 32) || 1;
	return (['open', 'home'] as End[]).map((end) =>
		phrase(makeRng(s), loop, rh, start, style, shapes, end, exact ? 1 : 0)
	);
}

/**
 * Level `seed`'s style; only a game whose rhythm has a `feel` gets 3/4 or swing,
 * or, adventurous, 5/4 or 7/8 (or the level's `fixed` meter). A `'light'` feel
 * swings only a little. A pentatonic mode always steps around its two notes.
 */
function styleOf(
	r: Rng,
	mode: string,
	feel: Feel,
	spice: number,
	drawn = mode,
	fixed?: number
): Omit<Style, 'pace'> {
	let meter: Meter =
		feel && r() < spice * 0.3 ? pickOne([5, 7] as const, r) : feel && r() < 0.3 ? 3 : 4;
	if (feel && fixed && fixed in STRONG) meter = fixed as Meter;
	const swing =
		feel && meter === 4 && r() < 0.4
			? pickOne(feel === 'light' ? [0.1, 0.16] : [0.2, 1 / 3], r)
			: 0;
	const lo = Math.floor(r() * 4);
	const hi = lo + 10 + Math.floor(r() * 3) + (spice > 0.6 ? 2 : 0);
	// Drawn as for the mode the seed picked, so a level that fixes its mode keeps the rest of its song.
	const penta = PENTATONIC[drawn] ? r() < 0.4 : false;
	const avoid = MODES[mode].avoid ?? (penta && PENTATONIC[mode] ? PENTATONIC[mode] : []);
	const drift = r() < spice * 0.6;
	const fill = pickOne((drift ? DRIFTS : FILLS)[meter], r);
	const leap = 0.15 + r() * 0.35 + spice * 0.15;
	return { meter, swing, fill, lo, hi, leap, avoid, spice, drift };
}

/**
 * Colors an adventurous song's notes: bars' chords richer (sevenths), and some
 * rests. (Chords borrowed from the parallel key changed its mode for a bar: too much.)
 */
function spiceUp(v: Rng, notes: Note[], style: Style) {
	const { spice, meter } = style;
	let pos = 0;
	notes.forEach((n, i) => {
		const next = notes[i + 1];
		pos = n.downbeat ? 0 : pos;
		const strong = STRONG[n.meter ?? meter];
		if (n.downbeat) {
			n.strike = pickOne(STRIKES, v);
			if (v() < spice * 0.4) n.seventh = true;
		} else if (next && !next.downbeat && !n.chord && !strong.includes(pos)) {
			if (v() < spice * 0.12 && n.len <= 4) n.rest = true;
		}
		pos += n.len;
	});
}

/**
 * A level's own say over its song (`song` in its level file), so it suits the
 * picture; whatever it leaves out stays the seed's.
 */
export interface SongSettings {
	/** Its key, a note name like `G` or `F#`: the song stays in it throughout, C and all. */
	key?: string;
	/** Its mode, like `minor` or `lydian` (see `MODES`). */
	mode?: string;
	/** How adventurous it is (see `SPICES`). */
	spice?: string;
	/** The instrument that leads its tune, like `harp` (see `LEADS`). */
	lead?: string;
	/**
	 * The major key whose notes it uses, like `G`: its tonic is wherever its mode sits
	 * in them (G's dorian is A, its mixolydian D). A mural's panels share one, so they
	 * sound like one piece in different moods.
	 */
	notes?: string;
	/** A name its motif is written from, in place of its seed: a mural's panels share their theme. */
	theme?: string;
	/** Beats to a bar, in a game whose rhythm has a `feel`: 3, 4, 5, or 7 (eighths). */
	meter?: number;
}
/** How adventurous a level's song can be told to be, as its `spice`. */
const SPICES: Record<string, number> = { gentle: 0.1, lively: 0.45, adventurous: 0.9 };

/** What's wrong with a level's song settings, if anything: a mode, spice, lead or meter it can't have. */
export function songProblem(song: SongSettings): string | null {
	if (song.key !== undefined && !PITCHES.includes(song.key)) return `key ${song.key}`;
	if (song.notes !== undefined && !PITCHES.includes(song.notes)) return `notes ${song.notes}`;
	if (song.mode !== undefined && !MODES[song.mode]) return `mode ${song.mode}`;
	if (song.spice !== undefined && !(song.spice in SPICES)) return `spice ${song.spice}`;
	if (song.lead !== undefined && !LEADS.includes(song.lead as Voice)) return `lead ${song.lead}`;
	if (song.meter !== undefined && !(song.meter in STRONG)) return `meter ${song.meter}`;
	return null;
}
/** Note names, sharps then flats, by pitch class (mod 12). */
const PITCHES = [
	'C',
	'C#',
	'D',
	'D#',
	'E',
	'F',
	'F#',
	'G',
	'G#',
	'A',
	'A#',
	'B',
	'C',
	'Db',
	'D',
	'Eb',
	'E',
	'F',
	'Gb',
	'G',
	'Ab',
	'A',
	'Bb',
	'B'
];

const mod12 = (x: number) => ((x % 12) + 12) % 12;
/** A note's pitch, as a MIDI note. */
const pitchOf = (n: Pick<Note, 'deg' | 'key' | 'alt'>) =>
	n.key.tonic + 12 * Math.floor(n.deg / 7) + n.key.scale[mod7(n.deg)] + (n.alt ?? 0);
/** A triad's quality on degree `x` of `key`, or null when it isn't a plain major or minor one. */
function quality(key: Key, x: number): 'major' | 'minor' | null {
	const at = (d: number) => 12 * Math.floor(d / 7) + key.scale[mod7(d)];
	const third = at(x + 2) - at(x);
	if (at(x + 4) - at(x) !== 7) return null;
	return third === 4 ? 'major' : third === 3 ? 'minor' : null;
}

/**
 * An adventurous song's color, used sparingly, each taking a note or two from
 * outside the key (gentle and lively songs never leave it): now and then a bar
 * that leans into the next bar's chord, as its V (a secondary dominant); before a
 * cadence's V, sometimes a chord borrowed from the parallel key (iv in a major key,
 * IV in a minor one); and passing notes, a half step between two of the key's a
 * whole step apart, off the beat.
 */
function color(r: Rng, notes: Note[], style: Style) {
	const bars: Note[][] = [];
	for (const n of notes) (bars[n.bar] ??= []).push(n);
	/** Bar into `key` over chord `root`: each note to the nearest pitch there, a chord tone on a strong beat. */
	const rekey = (bar: Note[], key: Key, root: number) => {
		const strong = STRONG[bar[0].meter ?? style.meter];
		let pos = 0;
		for (const n of bar) {
			const p = pitchOf(n);
			const firm = strong.includes(pos);
			let best = n.deg;
			let gap = Infinity;
			for (let d = -14; d <= 35; d++) {
				if (firm && !isChordTone(d, root)) continue;
				const g = Math.abs(pitchOf({ deg: d, key }) - p);
				if (g < gap) [gap, best] = [g, d];
			}
			Object.assign(n, { deg: best, key, root });
			pos += n.len;
		}
	};
	for (let p = 0; p * 4 < bars.length; p++) {
		let leaned = false;
		// A phrase's second or third bar may lean into the next, as its V.
		for (const b of [p * 4 + 1, p * 4 + 2]) {
			const bar = bars[b];
			const next = bars[b + 1];
			if (leaned || !bar || !next || bar[0].key !== next[0].key) continue;
			const k = bar[0].key;
			const x = next[0].root;
			const q = quality(k, x);
			if (mod7(x) === 0 || !q || bar[0].root === x || r() > 0.35) continue;
			const tonic = k.tonic + 12 * Math.floor(x / 7) + k.scale[mod7(x)];
			rekey(bar, { tonic, scale: q === 'major' ? MODES.major.scale : MODES.harmonic.scale }, 4);
			leaned = true;
		}
		// The bar before a cadence's V (A′ and B′, and A′ coming back).
		const third = bars[p * 4 + 2];
		if ([1, 3, 7].includes(p) && !leaned && third && r() < 0.4) {
			const k = third[0].key;
			const scale =
				k.scale[2] === 4 ? MODES.minor.scale : k.scale[5] === 8 ? MODES.dorian.scale : null;
			if (scale) rekey(third, { tonic: k.tonic, scale }, 3);
		}
	}
	let pos = 0;
	notes.forEach((n, i) => {
		pos = n.downbeat ? 0 : pos;
		const at = pos;
		pos += n.len;
		const a = notes[i - 1];
		const c = notes[i + 1];
		if (!a || !c || n.downbeat || n.chord || n.rest || a.rest || c.rest || n.len > 4) return;
		if (at % 4 === 0 || a.key !== n.key || c.key !== n.key) return;
		const pa = pitchOf(a);
		const pc = pitchOf(c);
		if (Math.abs(pc - pa) !== 2 || r() > 0.4) return;
		const mid = (pa + pc) / 2;
		if (n.key.scale.includes(mod12(mid - n.key.tonic))) return;
		Object.assign(n, { deg: a.deg, alt: mid - pa });
	});
}

/**
 * The tune breathes: an open phrase's long last note often gives its end to a
 * rest, and now and then the long note before the motif's variation does too.
 * What lands in a rest plays the quiet pattern, so the tune pauses while play
 * goes on. A cadence keeps its last note whole, so the song still ends on it.
 */
function breathe(r: Rng, notes: Note[]) {
	for (let i = notes.length - 1; i >= 0; i--) {
		const n = notes[i];
		const next = notes[i + 1];
		if ((next && !next.downbeat) || n.rest || n.len < 6) continue;
		const cadence = [1, 3, 7].includes(Math.floor(n.bar / 4));
		const cut =
			n.bar % 4 === 3 && !cadence && r() < 0.7
				? n.len >= 8
					? 4
					: 2
				: n.bar % 4 === 1 && r() < 0.3
					? 2
					: 0;
		if (!cut) continue;
		n.len -= cut;
		notes.splice(i + 1, 0, {
			...n,
			len: cut,
			rest: true,
			chord: false,
			downbeat: false,
			seventh: undefined,
			alt: undefined
		});
	}
}

/**
 * Pass `pass` through level `seed`'s song, 32 bars: A A′ B B′ C C′ A A′. A
 * is the level's theme on its motif, A′ bringing it home. B goes on over another
 * chord loop, on a variation of the motif or a new one, and comes home too (or,
 * adventurous, sidesteps to vi); C goes somewhere else, a key with home's notes
 * centered elsewhere (adventurous, sometimes a key a fourth off, one note new), now
 * and then in another meter, with another motif, and leaves it open for A to come
 * back. A comes back changed: its first bar as it was, the rest new. Each pass
 * writes a new B, C and returning A, so the song keeps changing around its theme.
 * `fix` is the level's song settings (key, notes, mode and the rest), and C stays
 * in its key.
 */
export function compose(seed: number, pass = 0, feel: Feel = false, fix?: SongSettings): Song {
	const r = makeRng(seed || 1);
	// Three songs in five gentle, one lively and one adventurous, unless the level says.
	const u = r();
	const w = r();
	const drawn = u < 0.6 ? w * 0.15 : u < 0.8 ? 0.35 + w * 0.2 : 0.8 + w * 0.2;
	const spice = fix?.spice !== undefined && fix.spice in SPICES ? SPICES[fix.spice] : drawn;
	const picked = pickOne(MODE_ODDS, r);
	const name = fix?.mode && MODES[fix.mode] ? fix.mode : picked;
	const mode = MODES[name];
	let tonic = pickOne(TONICS, r);
	// A fixed key, in the octave nearest the one the seed picked.
	const at = (note: string) => PITCHES.indexOf(note) % 12;
	const shared = fix?.notes && at(fix.notes) >= 0 ? (at(fix.notes) + mode.rotation) % 12 : -1;
	const pc = fix?.key ? at(fix.key) : shared;
	if (pc >= 0) tonic += ((pc - (tonic % 12) + 18) % 12) - 6;
	const home: Key = { tonic, scale: mode.scale };
	// Its tempo, drawn on its own so the rest of the song doesn't hang on it.
	const pace = 0.88 + 0.24 * makeRng(Math.imul(seed || 1, 0x632be5ab) >>> 0 || 1)();
	const style: Style = { ...styleOf(r, name, feel, spice, picked, fix?.meter), pace };
	const loop = pickOne(mode.loops, r);
	const wide = spice > 0.6;
	// A shared theme is written from its name, so every song on it has the same motif, in
	// each meter to the same rhythm: songs that can be heard as one piece.
	const theme = fix?.theme
		? motif(makeRng(hashStr(fix.theme) || 1), 0.3)
		: motif(r, style.leap, wide);
	let tuneRhythm: number[] | undefined;
	if (fix?.theme) {
		const fits = RHYTHMS[style.meter].filter((x) => x.length === theme.length);
		const tr = makeRng((hashStr(fix.theme) + style.meter * 7919) >>> 0 || 1);
		tuneRhythm = pickOne(fits.length ? fits : RHYTHMS[style.meter], tr);
	}
	const opening = style.lo + 2 + Math.floor(r() * (style.hi - style.lo - 3));
	const [a, a2] = pair(r, loop, opening, style, theme, ['open', 'home'], tuneRhythm);

	const v = makeRng((Math.imul(seed || 1, 31) + Math.imul(pass + 1, 0x9e3779b1)) >>> 0 || 1);
	const loopB = pickOne(
		mode.loops.filter((l) => l !== loop),
		v
	);
	const second = v() < 0.5 ? vary(v, theme, spice) : motif(v, style.leap, wide);
	const endB: End = v() < spice * 0.5 ? 'deceptive' : 'home';
	const [b, b2] = pair(v, loopB, a[a.length - 1].deg + 2, style, second, ['open', endB]);
	// A level that fixes its key stays in it: C goes on in another loop and motif, not another key.
	const stay = !!fix?.key && pc >= 0;
	const colorful = spice >= 0.8;
	const [awayName, shift] = pickOne(mode.away, v);
	const near = !stay && colorful && v() < 0.5;
	const away = MODES[stay || near ? name : awayName];
	const there: Key = stay
		? home
		: near
			? { tonic: home.tonic + pickOne([5, -5], v), scale: mode.scale }
			: { tonic: home.tonic + shift, scale: away.scale };
	// Sparingly, C changes meter: from 4 to 3 (adventurous, sometimes 7/8), from the rest to 4.
	const turns = !!feel && v() < 0.08 + 0.12 * spice;
	const meterC: Meter = !turns
		? style.meter
		: style.meter !== 4
			? 4
			: colorful && v() < 0.4
				? 7
				: 3;
	const styleC: Style =
		meterC === style.meter
			? style
			: { ...style, meter: meterC, fill: pickOne((style.drift ? DRIFTS : FILLS)[meterC], v) };
	const [c, c2] = pair(v, pickOne(away.loops, v), opening, styleC, motif(v, style.leap, wide), [
		'open',
		'open'
	]);
	const first = a
		.slice(
			0,
			a.findIndex((x, i) => i > 0 && x.downbeat)
		)
		.map((x) => x.len);
	const [back, back2] = again(v, loop, opening, style, theme, first, !!tuneRhythm);

	const sections: [Note[], Key, Style][] = [
		[a, home, style],
		[a2, home, style],
		[b, home, style],
		[b2, home, style],
		[c, there, styleC],
		[c2, there, styleC],
		[back, home, style],
		[back2, home, style]
	];
	let n = -1;
	const notes: Note[] = sections.flatMap(([ns, key, st]) =>
		ns.map((x) => ({
			...x,
			key,
			bar: x.downbeat ? ++n : n,
			...(st.meter !== style.meter && { meter: st.meter, fill: st.fill })
		}))
	);
	if (colorful) color(v, notes, style);
	breathe(v, notes);
	// Each bar's chord comes in its own way (a cadence's I chord, all at once).
	spiceUp(v, notes, style);
	return { home, notes, style };
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
	/** One panner for each place left or right that tune notes sit, shared by all of them. */
	pans: Map<number, StereoPannerNode>;
}

let actx: AudioContext | null = null;
/**
 * Likely a phone (a touch screen), which plays fewer notes at once (`MAX_RINGING`).
 * The mix is the same everywhere: built to carry on a phone's speaker (its bass
 * mostly overtones, see `BASS`) and still sound full on headphones.
 */
const PHONE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
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
	low.frequency.value = 150;
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
 * chords through a gain that grows with it, a gentle low-pass and one that breathes, then the
 * effects. `hush` cuts it off and the next call makes a fresh one.
 */
function out(): Out {
	if (!outs) {
		const ctx = (actx ??= new AudioContext());
		effects ??= buildEffects(ctx);
		const input = ctx.createGain();
		// Down a little, for each landing's color playing under the lead.
		input.gain.value = 0.85;
		input.connect(effects);
		// A gentle lift where ears are keenest, so the tune's voices stand out without more treble.
		const presence = ctx.createBiquadFilter();
		presence.type = 'peaking';
		presence.frequency.value = 2800;
		presence.Q.value = 0.7;
		presence.gain.value = 1.5;
		presence.connect(input);
		const tone = ctx.createBiquadFilter();
		tone.type = 'lowpass';
		tone.frequency.value = TONE_REST;
		tone.Q.value = 0.5;
		tone.connect(presence);
		const breath = ctx.createGain();
		breath.connect(input);
		// Chords rounded off above their overtones' reach, so they sit soft under the tune.
		const round = ctx.createBiquadFilter();
		round.type = 'lowpass';
		round.frequency.value = 2000;
		round.Q.value = 0.5;
		round.connect(breath);
		const pad = ctx.createGain();
		pad.connect(round);
		outs = { ctx, tone, pad, breath, input, pans: new Map() };
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
	/**
	 * What starts it, before its tone: a knock, a pluck, a breath. Noise through a band
	 * `at` times the pitch, `q` narrow, `gain` times the note's, over `len` seconds.
	 */
	noise?: { at: number; q: number; gain: number; len: number };
	/**
	 * Overtones apart from its wave, not quite in tune with it as a bar's or a tine's
	 * are: [times the pitch, level, seconds they ring]. They die away before it.
	 */
	partials?: [number, number, number][];
	/**
	 * Frequency modulation, an electric piano's tine: [times the pitch, depth (the
	 * modulation index), seconds it fades over], bright as struck, soon round.
	 */
	fm?: [number, number, number][];
	/** Cents its pitch starts off by, and seconds it settles over: a plucked string starts sharp, brass scoops up. */
	bend?: [number, number];
	/** Where it sits, left (-1) to right (1). */
	pan: number;
}

type Voice =
	| 'keys'
	| 'brass'
	| 'kalimba'
	| 'mallet'
	| 'flute'
	| 'harp'
	| 'vibes'
	| 'reed'
	| 'pizz'
	| 'glass'
	| 'string';

type VoiceSpec = Omit<Timbre, 'wave' | 'pad' | 'detune' | 'chorus' | 'pan'> &
	Partial<Pick<Timbre, 'detune' | 'chorus'>> & { levels: number[] };

/**
 * The instruments colors play: harmonic levels (index 1 the fundamental) and how
 * they sound. What tells them apart is mostly how they start (a mallet's knock, a
 * breath, a pluck), their out-of-tune overtones, and how they move.
 */
const VOICES: Record<Voice, VoiceSpec> = {
	// Electric piano: a round body, frequency modulated so it barks bright when struck
	// and rounds off, a tine's ping above it, and a soft thump.
	keys: {
		levels: [0, 1, 0.3, 0.05],
		attack: 0.004,
		len: 1.4,
		detune: 5,
		chorus: 0.3,
		bright: 9,
		mellow: 2.2,
		fm: [
			[1, 1, 0.35],
			[7, 0.5, 0.05]
		],
		noise: { at: 1.5, q: 1.2, gain: 0.16, len: 0.02 }
	},
	// Brass: full, scooping up into its pitch as its filter opens, a soft "bwah" with breath.
	brass: {
		levels: [0, 1, 0.7, 0.5, 0.35, 0.25, 0.18, 0.12],
		level: 1.6,
		attack: 0.05,
		len: 0.9,
		bright: 1.6,
		mellow: 6,
		bend: [-35, 0.07],
		noise: { at: 2.5, q: 0.8, gain: 0.1, len: 0.05 }
	},
	// Kalimba: a thumb's pluck on a tine, its pitch settling, with the tine's out-of-tune
	// overtone ringing briefly above.
	kalimba: {
		levels: [0, 1, 0.05],
		level: 1.15,
		attack: 0.002,
		len: 0.75,
		bright: 9,
		mellow: 1.5,
		partials: [[5.4, 0.2, 0.15]],
		bend: [12, 0.03],
		noise: { at: 4, q: 2, gain: 0.23, len: 0.012 }
	},
	// Marimba: a mallet's knock, then the bar's overtones near its fourth and tenth
	// harmonics, dying fast, over its round fundamental.
	mallet: {
		levels: [0, 1],
		level: 1.15,
		attack: 0.002,
		len: 0.55,
		bright: 12,
		mellow: 1.5,
		partials: [
			[3.9, 0.3, 0.12],
			[9.6, 0.1, 0.05]
		],
		noise: { at: 2.2, q: 1.5, gain: 0.26, len: 0.015 }
	},
	// Flute: nearly pure, a breath's chiff as it starts, steady, with a vibrato.
	flute: {
		levels: [0, 1, 0.18, 0.06, 0.03],
		level: 1.25,
		attack: 0.035,
		len: 1.25,
		bright: 5,
		mellow: 4,
		vibrato: 9,
		noise: { at: 2, q: 0.7, gain: 0.16, len: 0.08 }
	},
	// Harp: every harmonic, falling off, plucked a little sharp and mellowing.
	harp: {
		levels: [0, 1, 0.31, 0.15, 0.09, 0.06, 0.05, 0.04, 0.03],
		attack: 0.004,
		len: 1.2,
		detune: 3,
		chorus: 0.2,
		bright: 10,
		mellow: 2.5,
		bend: [8, 0.03],
		noise: { at: 5, q: 1, gain: 0.13, len: 0.01 }
	},
	// Vibraphone: a soft mallet, the bar ringing long, its fourth and tenth harmonics
	// dying first, its loudness wavering.
	vibes: {
		levels: [0, 1],
		level: 1.4,
		attack: 0.003,
		len: 1.6,
		bright: 8,
		mellow: 3,
		tremolo: 0.5,
		partials: [
			[4, 0.2, 0.5],
			[10, 0.04, 0.12]
		],
		noise: { at: 3, q: 1.5, gain: 0.13, len: 0.012 }
	},
	// Accordion: a full reed, and a second reed a little sharp beating against it, with breath.
	reed: {
		levels: [0, 1, 0.65, 0.45, 0.3, 0.22, 0.15, 0.1, 0.07],
		level: 0.85,
		attack: 0.018,
		len: 0.85,
		detune: 12,
		chorus: 0.55,
		bright: 6,
		mellow: 4,
		noise: { at: 3, q: 0.8, gain: 0.08, len: 0.04 }
	},
	// Pizzicato strings: plucked sharp and stopped short.
	pizz: {
		levels: [0, 1, 0.6, 0.4, 0.3, 0.2, 0.15, 0.1],
		level: 1.2,
		attack: 0.002,
		len: 0.35,
		bright: 8,
		mellow: 1.5,
		bend: [15, 0.025],
		noise: { at: 4, q: 1, gain: 0.2, len: 0.012 }
	},
	// Glass: a rubbed rim, swelling in, nearly pure with a shimmer and the glass's
	// own out-of-tune ring.
	glass: {
		levels: [0, 1, 0.1, 0, 0.15],
		level: 1.25,
		attack: 0.12,
		len: 1.5,
		detune: 8,
		chorus: 0.4,
		bright: 6,
		mellow: 4,
		partials: [[2.32, 0.12, 0.8]]
	},
	// A nylon string: very bright as it's plucked, a little sharp, quickly mellowing.
	string: {
		levels: [0, 1, 0.8, 0.55, 0.4, 0.3, 0.22, 0.15, 0.1, 0.07],
		level: 0.9,
		attack: 0.002,
		len: 0.75,
		bright: 16,
		mellow: 2,
		bend: [10, 0.03],
		noise: { at: 6, q: 0.9, gain: 0.16, len: 0.008 }
	}
};

/** Where a level's colors sit, left to right, in the order they take instruments. */
const PANS = [-0.35, 0.35, -0.6, 0.6, -0.15, 0.15, 0];

/** The order a color tries instruments in when its own is taken. */
const VOICE_ORDER = Object.keys(VOICES) as Voice[];
/**
 * The instruments that can lead a tune: all but glass, whose slow swell blurs a
 * tune's notes, and the accordion, whose beating reeds sound rough carrying one.
 */
const LEADS: Voice[] = VOICE_ORDER.filter((v) => v !== 'glass' && v !== 'reed');

/**
 * The instrument for a color by its Lab hue (degrees), colorfulness and
 * lightness: each family of hues has a light instrument and a dark one. Reds
 * and pinks keys or brass, oranges and yellows kalimba or marimba, greens
 * flute or harp, cyans and blues harp or vibraphone, purples accordion or
 * pizzicato, grays glass or nylon string.
 */
function voiceOf(hue: number, chroma: number, light: number): Voice {
	const dark = light < 60 ? 1 : 0;
	if (chroma < 12) return (['glass', 'string'] as const)[dark];
	const h = (hue + 360) % 360;
	if (h >= 345 || h < 50) return (['keys', 'brass'] as const)[dark];
	if (h < 115) return (['kalimba', 'mallet'] as const)[dark];
	if (h < 180) return (['flute', 'harp'] as const)[dark];
	if (h < 280) return (['harp', 'vibes'] as const)[dark];
	return (['reed', 'pizz'] as const)[dark];
}

/** Timbres by color, for the level being played (so the cache stays small), and the instruments they've taken. */
const timbres = new Map<string, Timbre>();
const voices = new Set<Voice>();
const PLAIN = 'plain';
/** A `timbre` key for an instrument by name (a level's lead), rather than a color's. */
const LEAD = 'lead:';
/** How loud a landing's color plays under the lead, as a part of it. */
const LAYER = 0.45;
const CHORD = 'chord';
const BASS = 'bass';
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
		mellow: 2.5,
		pan: 0
	};
	if (key === PLAIN) {
		// A triangle's odd harmonics, with a quiet octave on top.
		const tri = (n: number) => (8 / Math.PI ** 2 / n ** 2) * (n % 4 === 1 ? 1 : -1);
		t = { ...plain, wave: wave(ctx, [0, tri(1), 0.25, tri(3), 0, tri(5), 0, tri(7)]) };
	} else if (key === CHORD) {
		// A slow attack: chords swell in under the tune rather than hit.
		t = { ...plain, attack: 0.07, pad: true, wave: wave(ctx, [0, 1, 0.3, 0.12, 0.05]) };
	} else if (key === BASS) {
		// The chords' root, low: mostly its first overtones, an octave and a twelfth up, over a soft
		// fundamental. A phone's speaker can't play the fundamental (pushed, it distorts) but
		// plays these, and the ear hears the low note in them; headphones get it all.
		t = { ...plain, attack: 0.07, pad: true, wave: wave(ctx, [0, 0.55, 0.75, 0.3]) };
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
	} else if (key.startsWith(LEAD)) {
		const { levels, detune = 0, chorus = 0, ...rest } = VOICES[key.slice(LEAD.length) as Voice];
		t = { ...rest, wave: wave(ctx, levels), pad: false, pan: 0, detune, chorus };
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
		const pan = PANS[(voices.size - 1) % PANS.length];
		const { levels, detune = 0, chorus = 0, ...rest } = VOICES[voice];
		// Lighter colors play a little brighter, more colorful ones with more shimmer.
		t = {
			...rest,
			wave: wave(ctx, levels),
			pad: false,
			pan,
			detune,
			bright: rest.bright * (0.85 + 0.3 * light),
			chorus: chorus && chorus + 0.15 * Math.min(1, chroma / 70)
		};
	}
	timbres.set(key, t);
	return t;
}

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** When the tune's notes now ringing end (audio time), to keep from playing more than a phone can. */
let ringing: number[] = [];
/** Tune notes at once past which the quiet voices under the tune wait: fewer on a phone. */
const MAX_RINGING = PHONE ? 14 : 24;
/** Whether so many notes are ringing at `t` that the quiet voices under the tune should wait. */
function crowded(t: number) {
	ringing = ringing.filter((end) => end > t);
	return ringing.length >= MAX_RINGING;
}

/** Half a second of white noise, for notes' attacks, made once. */
let noiseBuf: AudioBuffer | null = null;
function noise(ctx: BaseAudioContext): AudioBuffer {
	if (noiseBuf?.sampleRate === ctx.sampleRate) return noiseBuf;
	const buf = ctx.createBuffer(1, Math.round(ctx.sampleRate / 2), ctx.sampleRate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	return (noiseBuf = buf);
}

/**
 * A plucked note in voice `tb`, falling away over `len` seconds (times the
 * voice's own). Tune notes start bright and
 * mellow as they fall, like a plucked string, rather than keeping one tone
 * throughout like an organ; their attack noise and out-of-tune overtones come
 * in past that filter, and the voice's place left or right.
 */
function pluck(
	o: Out,
	tb: Timbre,
	midi: number,
	t: number,
	gain: number,
	len: number,
	lite = false
): GainNode {
	const { ctx } = o;
	// Never so short it clicks.
	len = Math.max(len * tb.len, tb.attack + 0.08);
	gain *= tb.level ?? 1;
	const f0 = hz(midi);
	if (!tb.pad) ringing.push(t + len);
	let dest: AudioNode = tb.pad ? o.pad : o.tone;
	if (tb.pan) {
		let pan = o.pans.get(tb.pan);
		if (!pan) {
			pan = ctx.createStereoPanner();
			pan.pan.value = tb.pan;
			pan.connect(o.tone);
			o.pans.set(tb.pan, pan);
		}
		dest = pan;
	}
	// A quiet voice under the tune (`lite`) is just its tone: the extras below cost a phone
	// more than they add there, and a phone falling behind pops.
	if (lite)
		tb = {
			...tb,
			tremolo: 0,
			partials: undefined,
			noise: undefined,
			vibrato: 0,
			fm: undefined,
			chorus: 0
		};
	const g = ctx.createGain();
	// Silent until it starts: a gain is 1 until told otherwise, so a note released before
	// it starts (a rolled chord's, cut off by the next chord) would blare at full volume.
	g.gain.setValueAtTime(0, ctx.currentTime);
	g.gain.setValueAtTime(0.0001, t);
	g.gain.exponentialRampToValueAtTime(gain, t + tb.attack);
	g.gain.exponentialRampToValueAtTime(0.0001, t + len);
	g.connect(dest);
	const end = t + len + 0.02;
	let into: AudioNode = g;
	if (tb.tremolo) {
		const lfo = ctx.createOscillator();
		lfo.frequency.value = 5.5;
		const trem = ctx.createGain();
		trem.gain.value = 1 - tb.tremolo / 2;
		const depth = ctx.createGain();
		depth.gain.value = tb.tremolo / 2;
		lfo.connect(depth).connect(trem.gain);
		lfo.start(t);
		lfo.stop(end);
		trem.connect(into);
		into = trem;
	}
	// Overtones out of tune with the wave, each dying away on its own.
	for (const [ratio, level, ring] of tb.partials ?? []) {
		if (f0 * ratio > 16000) continue;
		const p = ctx.createOscillator();
		p.frequency.value = f0 * ratio;
		const pg = ctx.createGain();
		pg.gain.setValueAtTime(level, t);
		pg.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(ring, len));
		p.connect(pg).connect(into);
		p.start(t);
		p.stop(end);
	}
	if (!tb.pad) {
		const f = ctx.createBiquadFilter();
		f.type = 'lowpass';
		f.Q.value = -3;
		f.frequency.setValueAtTime(Math.min(16000, f0 * tb.bright), t);
		f.frequency.exponentialRampToValueAtTime(f0 * tb.mellow, t + len * 0.6);
		f.connect(into);
		into = f;
	}
	// The attack: a burst of noise in a band, straight out, ahead of the tone's own rise.
	if (tb.noise) {
		const { at, q, gain: ng, len: nl } = tb.noise;
		const src = ctx.createBufferSource();
		src.buffer = noise(ctx);
		const band = ctx.createBiquadFilter();
		band.type = 'bandpass';
		band.frequency.value = Math.min(12000, f0 * at);
		band.Q.value = q;
		const env = ctx.createGain();
		env.gain.setValueAtTime(0, ctx.currentTime);
		env.gain.setValueAtTime(0, t);
		// In over two milliseconds: straight in, it could click.
		env.gain.linearRampToValueAtTime(gain * ng * 4, t + 0.002);
		env.gain.exponentialRampToValueAtTime(0.0001, t + nl);
		src.connect(band).connect(env).connect(dest);
		// From anywhere in it, so two attacks at once don't add up as one twice as loud.
		src.start(t, Math.random() * 0.4);
		src.stop(t + nl + 0.02);
	}
	let vibrato: GainNode | null = null;
	if (tb.vibrato) {
		const lfo = ctx.createOscillator();
		lfo.frequency.value = 5.2;
		vibrato = ctx.createGain();
		vibrato.gain.setValueAtTime(0, t);
		vibrato.gain.linearRampToValueAtTime(tb.vibrato, t + 0.25);
		lfo.connect(vibrato);
		lfo.start(t);
		lfo.stop(end);
	}
	// Modulators: each sways the pitch by its depth times its own frequency, fading.
	const mods = (tb.fm ?? []).map(([ratio, depth, fade]) => {
		const m = ctx.createOscillator();
		m.frequency.value = f0 * ratio;
		const d = ctx.createGain();
		d.gain.setValueAtTime(depth * f0 * ratio, t);
		d.gain.setTargetAtTime(0, t, fade);
		m.connect(d);
		m.start(t);
		m.stop(end);
		return d;
	});
	const osc = (cents: number) => {
		const v = ctx.createOscillator();
		v.setPeriodicWave(tb.wave);
		v.frequency.value = f0;
		if (tb.bend) {
			v.detune.setValueAtTime(cents + tb.bend[0], t);
			v.detune.setTargetAtTime(cents, t, tb.bend[1] / 3);
		} else v.detune.value = cents;
		vibrato?.connect(v.detune);
		for (const d of mods) d.connect(v.frequency);
		v.start(t);
		v.stop(end);
		return v;
	};
	osc(0).connect(into);
	if (tb.chorus) {
		const level = ctx.createGain();
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

/** Whether a game's songs may leave plain 4/4 (`Rhythm.feel`): `'light'`, they swing only a little. */
type Feel = boolean | 'light';

/** How a game's landings come: its sixteenth note, and whether the ones between tune notes play. */
export interface Rhythm {
	/**
	 * Milliseconds: Mosaic's dots, Forage's ticks, at the usual tempo. Each song plays
	 * it a little quicker or slower (`Style.pace`); Forage's ticks follow the clock.
	 */
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
	 * running on ahead in a flourish over the player's landings. `'soft'`, for a game
	 * where colors finish often (Forage's colonies): unlike the bell, one note, a little
	 * swell, and a harmony to the end of the tune's bar.
	 */
	harmonize?: boolean | 'soft';
	/**
	 * A level's song may be in 3/4, 5/4 or 7/8, change meter for a section, or swing (its
	 * landings with it, on the clock's swung lines); `'light'`, the swing is slight.
	 */
	feel?: Feel;
	/** Moves set the clock's gear by their pace (`Clock.paced`), rather than the game itself. */
	paced?: boolean;
}

/** The chord's notes above its root (hot, its root again on top). */
const TRIAD = [0, 2, 4];
/** After the song's last note, the home chord rolled up above it. */
const RING = [2, 4, 7];

/** Sixteenths between landings: a quarter or an eighth note. */
export type Gear = 2 | 4;

/**
 * A level's steady beat, in `performance.now()` milliseconds: sixteenth notes
 * `ms` long from `origin`. Games time what they land by it.
 */
export class Clock {
	/** When the level's beat started, and how long its sixteenths are (on average). */
	origin = 0;
	ms = 100;
	/**
	 * How far each beat's off eighth waits, as a part of an eighth: 0 straight, ⅓ a
	 * triplet swing. The first eighth stretches and the second shrinks to make room.
	 */
	swing = 0;
	/**
	 * Sixteenths between the lines games land things on now, following the play:
	 * 4, quarter notes, when it's slow; otherwise 2, eighths. (Never sixteenths:
	 * the tune running that fast sounded crummy. They come only as doubles.) The
	 * tune and its quiet pattern follow it (see `Music.note`). Mosaic sets it from
	 * the pace of moves (`paced`), Forage from how many ants are out (`crowd`).
	 */
	gear: Gear = 2;
	/** When the last few moves were made. */
	#moves: number[] = [];

	/** Start counting sixteenths `ms` long from time `at`, swung `swing`, in eighths. */
	start(at: number, ms: number, swing = 0) {
		this.origin = at;
		this.ms = ms;
		this.swing = swing;
		this.gear = 2;
		this.#moves = [];
	}

	/**
	 * A move at time `at`: the gear follows the pace of the last few (the middle of
	 * their gaps, so one long pause doesn't hold it back), quarter notes when they're
	 * over two seconds or so apart. It changes only once the pace is clearly past
	 * the line, so it doesn't flicker.
	 */
	paced(at: number) {
		const m = this.#moves;
		m.push(at);
		if (m.length > 4) m.shift();
		if (m.length < 2) return;
		const gaps = m
			.slice(1)
			.map((t, i) => t - m[i])
			.sort((a, b) => a - b);
		const gap = gaps[gaps.length >> 1] / this.ms;
		const g = this.gear;
		this.gear = gap > (g === 4 ? 18 : 24) ? 4 : 2;
	}

	/** `n` things on their way: a few land on quarter notes, more on eighths. */
	crowd(n: number) {
		this.gear = n <= (this.gear === 4 ? 5 : 3) ? 4 : 2;
	}

	/** Sixteenths `s` (any amount) from the origin, as ms from it. */
	#ms(s: number) {
		const q = Math.floor(s / 4);
		const p = s - 4 * q;
		const w = this.swing;
		return (4 * q + (p <= 2 ? p * (1 + w) : 2 * (1 + w) + (p - 2) * (1 - w))) * this.ms;
	}

	/** Ms `t` from the origin, as sixteenths (any amount) from it. */
	#steps(t: number) {
		const u = t / this.ms;
		const q = Math.floor(u / 4);
		const x = u - 4 * q;
		const w = this.swing;
		const e = 2 * (1 + w);
		return 4 * q + (x <= e ? x / (1 + w) : 2 + (x - e) / (1 - w));
	}

	/** The sixteenth nearest time `at`. */
	step(at: number) {
		return Math.round(this.#steps(at - this.origin));
	}

	/** When sixteenth `step` is. */
	time(step: number) {
		return this.origin + this.#ms(step);
	}

	/** The line every `n` sixteenths nearest time `at`. */
	nearest(at: number, n = 1) {
		return this.time(n * Math.round(this.#steps(at - this.origin) / n));
	}

	/** The first line every `n` sixteenths at or after time `at`. */
	next(at: number, n = 1) {
		return this.time(n * Math.ceil(this.#steps(at - this.origin) / n - 1e-9));
	}
}

/** Turns a `performance.now()` time into the audio clock's (never before now). */
type When = (ms: number) => number;

export class Music {
	/** The level's beat, kept even while the sound is off, so play lands on it either way. */
	readonly clock = new Clock();
	#seed = 1;
	/** The level's own song settings, if it sets any. */
	#fix: SongSettings | undefined;
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
	/** Whether the song may be in 3/4 or swing (`Rhythm.feel`). */
	#feel: Feel = false;
	/** The quiet pattern of the section playing, when it's not the song's (a C in another meter). */
	#pattern: number[] | undefined;
	/** The sixteenth the sounding chord came in on, where the quiet pattern counts from. */
	#struck = 0;
	/**
	 * How many more tune notes get a harmony, after something opened or (`#joins`) a
	 * color finished; in whose voice, and how many degrees up it sits from the tune's.
	 */
	#harmony = 0;
	#harmonist: { voice: string; up: number; gain: number } = { voice: BELL, up: 7, gain: 0.035 };
	#joins: boolean | 'soft' = false;
	/** How swelled the music is, 0 to 1, as of `#heatAt`; it cools from there. */
	#heat = 0;
	#heatAt = 0;
	/** When the last move was made. */
	#lastMove = -Infinity;
	/** The tune's instrument, as a `timbre` key. */
	#lead = PLAIN;

	/**
	 * A new level: its own song, from the top, cool, with anything still ringing
	 * cut off, and its beat starting now.
	 */
	seed(seed: number, rhythm: Rhythm, fix?: SongSettings) {
		this.#seed = seed;
		this.#fix = fix;
		this.#pass = 0;
		this.#feel = rhythm.feel ?? false;
		this.#written = null;
		this.#key = this.#song.home;
		this.#pattern = undefined;
		// The song's own tempo: one beat the whole level, a little quicker or slower than the game's.
		const { swing, pace } = this.#song.style;
		const ms = rhythm.beat * pace;
		this.clock.start(performance.now(), ms, swing);
		this.#fill = rhythm.fill;
		this.#warmBy = rhythm.warm ?? 0;
		this.#pulse = 4;
		while (this.#pulse * ms < BREATH_MIN) this.#pulse *= 2;
		this.#six = Math.max(1, Math.round((UNIT * 1000) / ms));
		this.#i = 0;
		this.#root = 0;
		this.#last = -Infinity;
		this.#due = 0;
		this.#struck = 0;
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
		// The tune's instrument, which no color then takes. A level that draws one that can't lead
		// (`LEADS`) draws again, so every other level keeps its lead.
		const r = makeRng(Math.imul(seed || 1, 0x2545f491) >>> 0 || 1);
		let lead = pickOne(VOICE_ORDER, r);
		if (!LEADS.includes(lead)) lead = pickOne(LEADS, r);
		// Or the level's own, when its picture suggests one.
		if (LEADS.includes(fix?.lead as Voice)) lead = fix!.lead as Voice;
		voices.add(lead);
		this.#lead = LEAD + lead;
		this.hush();
	}

	get #song() {
		return (this.#written ??= compose(this.#seed, this.#pass, this.#feel, this.#fix));
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
		ringing = [];
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
	 * small speakers only rumble.) A `seventh` goes on top, above the rest, so it
	 * never sits a step from them.
	 */
	#chord(o: Out, t: number, root: number, h: number, strike: Strike = 'block', seventh = false) {
		this.#release(t);
		const tb = timbre(o.ctx, CHORD);
		this.#held.push(pluck(o, timbre(o.ctx, BASS), this.#midi(root) - 12, t, 0.07, BAR));
		if (strike === 'bass') return;
		const tones = TRIAD.map((k) => this.#voice(root + k)).sort((x, y) => x - y);
		if (h > 0.5) tones.push(this.#voice(root) + 12);
		if (seventh) {
			let m = this.#voice(root + 6);
			while (m <= tones[tones.length - 1] + 2) m += 12;
			tones.push(m);
		}
		const six = (this.#six * this.clock.ms) / 1000;
		tones.forEach((m, i) => {
			const at = strike === 'roll' ? t + (i * six) / 2 : strike === 'late' ? t + 2 * six : t;
			this.#held.push(pluck(o, tb, m, at, 0.02, BAR));
		});
	}

	/**
	 * Sing song note `n` at `t`: doubled an octave up when hot, bringing its
	 * chord in at `chord` (with it, by default; not at all if false). A chord
	 * that waits for its beat comes straight in on it. A rest only sets the key.
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
		if (n.rest) return;
		const m = this.#midi(n.deg) + (n.alt ?? 0);
		pluck(o, tb, m, t, gain, len);
		if (h > 0.3 && !crowded(t)) pluck(o, tb, m + 12, t, gain * 0.6 * (h - 0.2), len, true);
		if (!n.chord || chord === false) return;
		const strike = !n.downbeat || (chord > t && n.strike === 'late') ? 'block' : n.strike;
		this.#chord(o, chord, n.root, h, strike, n.seventh);
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
	 * Something of `color` (a hex) landed, played in the level's lead with the color's
	 * instrument softly under it (`LAYER`), `soft`er for a side landing
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
			// Together: closer than most of the shortest sixteenth (a swung beat's last).
			if (gap < this.clock.ms * 0.75 * (1 - this.clock.swing)) {
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
			const tb = timbre(o.ctx, this.#lead);
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
			// The quiet pattern, counted from the chord (or, drifting, from the song's start), a
			// step each landing at the gear things land in, quarter notes or eighths.
			const gear = this.clock.gear;
			const fill = (at: number) => {
				if (!this.#fill) return;
				const { root, key } = this.#sounding(at);
				const { drift } = this.#song.style;
				const fill = this.#pattern ?? this.#song.style.fill;
				const k = Math.floor((drift ? step : step - this.#struck) / gear);
				const deg = root + fill[((k % fill.length) + fill.length) % fill.length];
				pluck(o, tb, this.#midi(deg, key), t, gain * 0.4, 0.06 * gear, true);
				if (color && !crowded(t)) {
					const tc = timbre(o.ctx, color);
					pluck(o, tc, this.#midi(deg, key), t, gain * 0.4 * LAYER, 0.06 * gear, true);
				}
			};
			if (!early && (soft || at < this.#ends || (step < this.#due && !lull))) {
				fill(at);
				return;
			}
			// After a pause, pick up at the next bar rather than mid-phrase.
			if (gap > REST * 1000) {
				while (!this.#song.notes[this.#i].downbeat) this.#advance(this.#i + 1);
			}
			const n = this.#song.notes[this.#i];
			this.#advance(this.#i + 1);
			this.#root = n.root;
			this.#pattern = n.fill;
			this.#due = (early ? this.#due : step) + n.len;
			this.#sung = step;
			this.#early = early;
			// A rest in the tune: this landing plays the quiet pattern instead.
			if (n.rest) {
				this.#key = n.key;
				fill(at);
				return;
			}
			// Held notes in the song ring a little longer. A new chord waits for the breath's beat, so
			// changes come in time however the landings fall, and the old one rings on until it
			// does: stopped at the note, the gap to the beat sounded like the music ducking.
			const beat = this.clock.next(at - this.clock.ms / 2, this.#pulse);
			if (n.chord) this.#struck = this.clock.step(beat);
			// In quarter notes, each landing is a tune note: it walks broad, and rings.
			const len = n.len >= 8 || gear === 4 ? 0.7 : 0.45;
			this.#sing(o, tb, n, t, gain, len, h, when(beat));
			const m = this.#midi(n.deg) + (n.alt ?? 0);
			if (color && !crowded(t)) pluck(o, timbre(o.ctx, color), m, t, gain * LAYER, len, true);
			// A passing note off the key gets no harmony: a third above it would clash.
			if (this.#harmony > 0 && !n.alt) {
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

	/** A move that sets things going (an ant sent off): a short quiet note on the chord's root, in the lead. */
	tap() {
		this.#play((o, now, when) => {
			pluck(o, timbre(o.ctx, this.#lead), this.#midi(this.#root), when(now), 0.04, 0.12, true);
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
	 * through the end of its next whole bar (this one, if the next note starts it),
	 * or, `short`, the end of the bar it's in.
	 */
	#joinIn(
		o: Out,
		now: number,
		when: When,
		harmonist: { voice: string; up: number; gain: number },
		sweep: number[],
		gain: number,
		len: number,
		short = false
	) {
		const from = this.#onBeat(now, 20);
		const { root, key } = this.#sounding(from);
		const tb = timbre(o.ctx, harmonist.voice);
		const gap = (this.#six * this.clock.ms) / 2;
		sweep.forEach((k, i) =>
			pluck(o, tb, this.#midi(root + k, key), when(from + i * gap), gain, len)
		);
		const notes = this.#song.notes;
		const bar = (j: number) => {
			while (!notes[j % notes.length].downbeat) j++;
			return j;
		};
		let end = bar(this.#i + 1);
		if (!notes[this.#i].downbeat && !short) end = bar(end + 1);
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
			const soft = this.#joins === 'soft';
			this.#heatTo(o, now, when(now), this.#warmth(now) + (soft ? 0.1 : 0.35));
			// Softly: one note in the color's voice, the chord's root on the next beat (the bell
			// sweeps up three), then a harmony a third or so above the tune to the end of its bar.
			if (soft) {
				const voice = color ?? PLAIN;
				this.#joinIn(o, now, when, { voice, up: 0, gain: 0.045 }, [7], 0.045, 0.6, true);
				return;
			}
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
			if (!first.chord && !on)
				this.#chord(o, when(from), first.root, this.#heat, 'block', first.seventh);
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
			const tb = timbre(o.ctx, this.#lead);
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
