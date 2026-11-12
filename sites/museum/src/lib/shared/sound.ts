// Each landing plays the song's next note, so the tune keeps its order and play sets its rhythm.
import { hashStr, makeRng, pickOne, type Rng } from './engine.ts';
import { lab } from './palette.ts';

const MODES: Record<
	string,
	{
		scale: number[];
		/** Semitones from the tonic of the major key with the same notes (harmonic minor as minor). */
		rotation: number;
		loops: number[][];
		away: [string, number][];
		avoid?: number[];
	}
> = {
	major: {
		rotation: 0,
		scale: [0, 2, 4, 5, 7, 9, 11],
		loops: [
			[0, 5, 3, 4],
			[0, 3, 5, 4],
			[0, 4, 5, 3],
			[0, 2, 3, 4],
			[0, 5, 1, 4],
			[0, 3, 0, 4]
		],
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
	'phrygian-dominant': {
		rotation: 4,
		scale: [0, 1, 4, 5, 7, 8, 10],
		loops: [
			[0, 1, 0, 6],
			[0, 1, 6, 0],
			[0, 3, 1, 0],
			[0, 6, 1, 0]
		],
		away: [
			['harmonic', 5],
			['phrygian', 0],
			['major', -4]
		]
	},
	// Pentatonics are seven-note modes whose tune steps around the `avoid` degrees.
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
const PENTATONIC: Record<string, number[]> = {
	major: [3, 6],
	mixolydian: [3, 6],
	minor: [1, 5],
	dorian: [1, 5]
};
const TONICS = [55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66];

const UNIT = 0.09;
const BAR = 5;
const BREATH = 0.3;
const BREATH_MIN = 300;
/** Seconds of pause that start a new bar; shorter, and pecking one dot at a time jumps a bar each peck. */
const REST = 4;
const QUICK = 1;
const COOL = 5;
const BEND = 0.0025;
const BEND_IN = 0.1;
const TONE_REST = 6500;
const TONE_HOT = 12000;
const PAD_HOT = 0.8;

type Meter = 4 | 3 | 5 | 7;
const STRONG: Record<Meter, number[]> = { 4: [0, 8], 3: [0], 5: [0, 12], 7: [0, 8] };

/** Plainest first: a gentle song keeps to the front (see `rhythms`). */
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

/** Chord degrees per eighth: 0 root, 2 third, 4 fifth, 7 root an octave up. */
const FILLS: Record<Meter, number[][]> = {
	4: [
		[0, 4, 2, 4],
		[0, 2, 4, 7],
		[7, 4, 2, 0],
		[0, 7, 0, 7],
		[0, 4, 0, 4],
		[0, 2, 4, 2]
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
/** Counted from the song's start, not the chord, so they drift across the bar. */
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

interface Style {
	meter: Meter;
	swing: number;
	fill: number[];
	lo: number;
	hi: number;
	leap: number;
	avoid: number[];
	spice: number;
	drift: boolean;
	pace: number;
}

const mod7 = (d: number) => ((d % 7) + 7) % 7;
const isChordTone = (deg: number, root: number) => [0, 2, 4].includes(mod7(deg - root));

interface Key {
	tonic: number;
	scale: number[];
}

interface Note {
	deg: number;
	len: number;
	root: number;
	downbeat: boolean;
	chord: boolean;
	bar: number;
	key: Key;
	strike: Strike;
	seventh?: boolean;
	rest?: boolean;
	alt?: number;
	meter?: Meter;
	fill?: number[];
}

const NO_KEY: Key = { tonic: 60, scale: [] };

interface Song {
	home: Key;
	notes: Note[];
	style: Style;
}

type Strike = 'block' | 'roll' | 'bass' | 'late';
const STRIKES: Strike[] = ['block', 'block', 'roll', 'roll', 'roll', 'bass', 'late', 'late'];

function nearest(d: number, lo: number, hi: number, ok: (c: number) => boolean) {
	for (let k = 0; k <= 7; k++) {
		for (const c of [d + k, d - k]) if (c >= lo && c <= hi && ok(c)) return c;
	}
	return d;
}

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

function vary(r: Rng, m: number[], spice = 0): number[] {
	const last = m[m.length - 1];
	if (r() < spice * 0.4) {
		if (m.length > 3 && r() < 0.5) return m.slice(0, 2 + Math.floor(r() * 2));
		return m.toReversed().map((x) => last - x);
	}
	if (r() < 0.5) return m.map((x) => -x);
	return m.toReversed().map((x) => x - last);
}

type End = 'open' | 'home' | 'deceptive';

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

export interface SongSettings {
	key?: string;
	mode?: string;
	spice?: string;
	lead?: string;
	notes?: string;
	theme?: string;
	meter?: number;
}
const SPICES: Record<string, number> = { gentle: 0.1, lively: 0.45, adventurous: 0.9 };

export function songProblem(song: SongSettings): string | null {
	if (song.key !== undefined && !PITCHES.includes(song.key)) return `key ${song.key}`;
	if (song.notes !== undefined && !PITCHES.includes(song.notes)) return `notes ${song.notes}`;
	if (song.mode !== undefined && !MODES[song.mode]) return `mode ${song.mode}`;
	if (song.spice !== undefined && !(song.spice in SPICES)) return `spice ${song.spice}`;
	if (song.lead !== undefined && !LEADS.includes(song.lead as Voice)) return `lead ${song.lead}`;
	if (song.meter !== undefined && !(song.meter in STRONG)) return `meter ${song.meter}`;
	return null;
}
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
const pitchOf = (n: Pick<Note, 'deg' | 'key' | 'alt'>) =>
	n.key.tonic + 12 * Math.floor(n.deg / 7) + n.key.scale[mod7(n.deg)] + (n.alt ?? 0);
function quality(key: Key, x: number): 'major' | 'minor' | null {
	const at = (d: number) => 12 * Math.floor(d / 7) + key.scale[mod7(d)];
	const third = at(x + 2) - at(x);
	if (at(x + 4) - at(x) !== 7) return null;
	return third === 4 ? 'major' : third === 3 ? 'minor' : null;
}

function color(r: Rng, notes: Note[], style: Style) {
	const bars: Note[][] = [];
	for (const n of notes) (bars[n.bar] ??= []).push(n);
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

export function compose(seed: number, pass = 0, feel: Feel = false, fix?: SongSettings): Song {
	const r = makeRng(seed || 1);
	const u = r();
	const w = r();
	const drawn = u < 0.6 ? w * 0.15 : u < 0.8 ? 0.35 + w * 0.2 : 0.8 + w * 0.2;
	const spice = fix?.spice !== undefined && fix.spice in SPICES ? SPICES[fix.spice] : drawn;
	const picked = pickOne(MODE_ODDS, r);
	const name = fix?.mode && MODES[fix.mode] ? fix.mode : picked;
	const mode = MODES[name];
	let tonic = pickOne(TONICS, r);
	const at = (note: string) => PITCHES.indexOf(note) % 12;
	const shared = fix?.notes && at(fix.notes) >= 0 ? (at(fix.notes) + mode.rotation) % 12 : -1;
	const pc = fix?.key ? at(fix.key) : shared;
	if (pc >= 0) tonic += ((pc - (tonic % 12) + 18) % 12) - 6;
	const home: Key = { tonic, scale: mode.scale };
	// Its own rng, so the rest of the song doesn't depend on it.
	const pace = 0.88 + 0.24 * makeRng(Math.imul(seed || 1, 0x632be5ab) >>> 0 || 1)();
	const style: Style = { ...styleOf(r, name, feel, spice, picked, fix?.meter), pace };
	const loop = pickOne(mode.loops, r);
	const wide = spice > 0.6;
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
	spiceUp(v, notes, style);
	return { home, notes, style };
}

interface Out {
	ctx: AudioContext;
	tone: BiquadFilterNode;
	pad: GainNode;
	breath: GainNode;
	input: GainNode;
	lfo?: OscillatorNode;
	pans: Map<number, StereoPannerNode>;
}

let actx: AudioContext | null = null;
const PHONE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
let effects: AudioNode | null = null;
let echo: DelayNode | null = null;
let outs: Out | null = null;

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

function out(): Out {
	if (!outs) {
		const ctx = (actx ??= new AudioContext());
		effects ??= buildEffects(ctx);
		const input = ctx.createGain();
		input.gain.value = 0.85;
		input.connect(effects);
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

interface Timbre {
	wave: PeriodicWave;
	attack: number;
	len: number;
	detune: number;
	chorus: number;
	pad: boolean;
	bright: number;
	mellow: number;
	vibrato?: number;
	tremolo?: number;
	level?: number;
	noise?: { at: number; q: number; gain: number; len: number };
	partials?: [number, number, number][];
	fm?: [number, number, number][];
	bend?: [number, number];
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

const VOICES: Record<Voice, VoiceSpec> = {
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

const PANS = [-0.35, 0.35, -0.6, 0.6, -0.15, 0.15, 0];

const VOICE_ORDER = Object.keys(VOICES) as Voice[];
/** Glass's slow swell blurs a tune, and the accordion's beating reeds sound rough leading one. */
const LEADS: Voice[] = VOICE_ORDER.filter((v) => v !== 'glass' && v !== 'reed');

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

const timbres = new Map<string, Timbre>();
const voices = new Set<Voice>();
const PLAIN = 'plain';
const LEAD = 'lead:';
const LAYER = 0.45;
const CHORD = 'chord';
const BASS = 'bass';
const BELL = 'bell';

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
		const tri = (n: number) => (8 / Math.PI ** 2 / n ** 2) * (n % 4 === 1 ? 1 : -1);
		t = { ...plain, wave: wave(ctx, [0, tri(1), 0.25, tri(3), 0, tri(5), 0, tri(7)]) };
	} else if (key === CHORD) {
		t = { ...plain, attack: 0.07, pad: true, wave: wave(ctx, [0, 1, 0.3, 0.12, 0.05]) };
	} else if (key === BASS) {
		// Mostly overtones: a phone's speaker can't play the fundamental, and the ear infers it from them.
		t = { ...plain, attack: 0.07, pad: true, wave: wave(ctx, [0, 0.55, 0.75, 0.3]) };
	} else if (key === BELL) {
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
		const own = voiceOf((Math.atan2(b, a) * 180) / Math.PI, chroma, L);
		const k = VOICE_ORDER.indexOf(own);
		const voice =
			[...VOICE_ORDER.slice(k), ...VOICE_ORDER.slice(0, k)].find((v) => !voices.has(v)) ?? own;
		voices.add(voice);
		const pan = PANS[(voices.size - 1) % PANS.length];
		const { levels, detune = 0, chorus = 0, ...rest } = VOICES[voice];
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

let ringing: number[] = [];
const MAX_RINGING = PHONE ? 14 : 24;
function crowded(t: number) {
	ringing = ringing.filter((end) => end > t);
	return ringing.length >= MAX_RINGING;
}

let noiseBuf: AudioBuffer | null = null;
function noise(ctx: BaseAudioContext): AudioBuffer {
	if (noiseBuf?.sampleRate === ctx.sampleRate) return noiseBuf;
	const buf = ctx.createBuffer(1, Math.round(ctx.sampleRate / 2), ctx.sampleRate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	return (noiseBuf = buf);
}

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
	// Lite notes skip the extras: under the tune they cost a phone more than they add, and a phone falling behind pops.
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
	// A gain starts at 1, so a note released before it starts (a rolled chord cut off) would blare.
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
		// Ramped, not straight in, which could click.
		env.gain.linearRampToValueAtTime(gain * ng * 4, t + 0.002);
		env.gain.exponentialRampToValueAtTime(0.0001, t + nl);
		src.connect(band).connect(env).connect(dest);
		// From a random offset, so two attacks at once don't add up as one twice as loud.
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

function swell(p: AudioParam, t: number, peak: number, rest: number) {
	p.cancelScheduledValues(t);
	p.setValueAtTime(p.value, t);
	p.setTargetAtTime(peak, t, 0.12);
	p.setTargetAtTime(rest, t + 0.4, COOL);
}

type Feel = boolean | 'light';

export interface Rhythm {
	beat: number;
	fill: boolean;
	warm?: number;
	bend?: boolean;
	doubles?: boolean;
	harmonize?: boolean | 'soft';
	feel?: Feel;
	paced?: boolean;
}

const TRIAD = [0, 2, 4];
const RING = [2, 4, 7];

export type Gear = 2 | 4;

export class Clock {
	origin = 0;
	ms = 100;
	/** Part of an eighth the off eighth waits: 0 straight, ⅓ a triplet swing. */
	swing = 0;
	/** Sixteenths between landing lines, 4 or 2; never 1: the tune that fast sounded crummy. */
	gear: Gear = 2;
	#moves: number[] = [];

	start(at: number, ms: number, swing = 0) {
		this.origin = at;
		this.ms = ms;
		this.swing = swing;
		this.gear = 2;
		this.#moves = [];
	}

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

	crowd(n: number) {
		this.gear = n <= (this.gear === 4 ? 5 : 3) ? 4 : 2;
	}

	#ms(s: number) {
		const q = Math.floor(s / 4);
		const p = s - 4 * q;
		const w = this.swing;
		return (4 * q + (p <= 2 ? p * (1 + w) : 2 * (1 + w) + (p - 2) * (1 - w))) * this.ms;
	}

	#steps(t: number) {
		const u = t / this.ms;
		const q = Math.floor(u / 4);
		const x = u - 4 * q;
		const w = this.swing;
		const e = 2 * (1 + w);
		return 4 * q + (x <= e ? x / (1 + w) : 2 + (x - e) / (1 - w));
	}

	step(at: number) {
		return Math.round(this.#steps(at - this.origin));
	}

	time(step: number) {
		return this.origin + this.#ms(step);
	}

	nearest(at: number, n = 1) {
		return this.time(n * Math.round(this.#steps(at - this.origin) / n));
	}

	next(at: number, n = 1) {
		return this.time(n * Math.ceil(this.#steps(at - this.origin) / n - 1e-9));
	}
}

type When = (ms: number) => number;

export class Music {
	readonly clock = new Clock();
	#seed = 1;
	#fix: SongSettings | undefined;
	#written: Song | null = null;
	#fill = false;
	#warmBy = 0;
	#pulse = 4;
	#six = 1;
	#pass = 0;
	#i = 0;
	#key: Key = NO_KEY;
	#root = 0;
	#last = -Infinity;
	#due = 0;
	#sung = -Infinity;
	#early = false;
	#doubles = false;
	#held: GainNode[] = [];
	#run: { at: number; n: Note }[] = [];
	#ends = -Infinity;
	#bend = false;
	#color: string | undefined;
	#bent = -Infinity;
	#feel: Feel = false;
	#pattern: number[] | undefined;
	#struck = 0;
	#harmony = 0;
	#harmonist: { voice: string; up: number; gain: number } = { voice: BELL, up: 7, gain: 0.035 };
	#joins: boolean | 'soft' = false;
	#heat = 0;
	#heatAt = 0;
	#lastMove = -Infinity;
	#lead = PLAIN;

	seed(seed: number, rhythm: Rhythm, fix?: SongSettings) {
		this.#seed = seed;
		this.#fix = fix;
		this.#pass = 0;
		this.#feel = rhythm.feel ?? false;
		this.#written = null;
		this.#key = this.#song.home;
		this.#pattern = undefined;
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
		// A drawn lead that can't lead draws again, so every other level keeps its lead.
		const r = makeRng(Math.imul(seed || 1, 0x2545f491) >>> 0 || 1);
		let lead = pickOne(VOICE_ORDER, r);
		if (!LEADS.includes(lead)) lead = pickOne(LEADS, r);
		if (LEADS.includes(fix?.lead as Voice)) lead = fix!.lead as Voice;
		voices.add(lead);
		this.#lead = LEAD + lead;
		this.hush();
	}

	get #song() {
		return (this.#written ??= compose(this.#seed, this.#pass, this.#feel, this.#fix));
	}

	#advance(j: number) {
		const len = this.#song.notes.length;
		if (j >= len) {
			this.#pass++;
			this.#written = null;
		}
		this.#i = j % len;
	}

	hush() {
		outs?.input.disconnect();
		outs?.lfo?.stop();
		outs = null;
		this.#held = [];
		ringing = [];
	}

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

	#breathe(o: Out, now: number, when: When) {
		const { ctx, breath } = o;
		const period = this.#pulse * this.clock.ms;
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

	#midi(deg: number, key = this.#key) {
		const { tonic, scale } = key;
		return tonic + 12 * Math.floor(deg / 7) + scale[mod7(deg)];
	}

	#warmth(ms: number) {
		return this.#heat * Math.exp(-(ms - this.#heatAt) / 1000 / COOL);
	}

	#heatTo(o: Out, ms: number, t: number, h: number) {
		this.#heat = Math.min(1, h);
		this.#heatAt = ms;
		swell(o.tone.frequency, t, TONE_REST + (TONE_HOT - TONE_REST) * this.#heat, TONE_REST);
		swell(o.pad.gain, t, 1 + PAD_HOT * this.#heat, 1);
	}

	move() {
		this.#play((o, now, when) => {
			const gap = now - this.#lastMove;
			this.#lastMove = now;
			this.#heatTo(o, now, when(now), this.#warmth(now) + (gap < QUICK * 1000 ? 0.2 : 0.06));
		});
	}

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

	#voice(deg: number) {
		const low = this.#key.tonic + 3;
		return low + ((((this.#midi(deg) - low) % 12) + 12) % 12);
	}

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

	#bar(b: number) {
		return this.#song.notes.filter((n) => n.bar === b);
	}

	get #bars() {
		return this.#song.notes[this.#song.notes.length - 1].bar + 1;
	}

	note(color?: string, soft = false, at?: number) {
		this.#play((o, now, when) => {
			at ??= now;
			// Late (the tab was hidden): play on the next sixteenth, not all at once off the beat.
			if (at < now - this.clock.ms / 2) at = this.clock.next(now);
			const gap = at - this.#last;
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
			// The first landing after a lull always plays the tune, so pecking one at a time walks through it.
			const lull = gap > 6 * this.clock.ms;
			const early =
				this.#doubles &&
				!soft &&
				!this.#early &&
				at >= this.#ends &&
				step === this.#sung + 1 &&
				step < this.#due &&
				!this.#song.notes[this.#i].downbeat;
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
			if (n.rest) {
				this.#key = n.key;
				fill(at);
				return;
			}
			// A new chord waits for the breath's beat; stopping the old one early sounded like the music ducking.
			const beat = this.clock.next(at - this.clock.ms / 2, this.#pulse);
			if (n.chord) this.#struck = this.clock.step(beat);
			const len = n.len >= 8 || gear === 4 ? 0.7 : 0.45;
			this.#sing(o, tb, n, t, gain, len, h, when(beat));
			const m = this.#midi(n.deg) + (n.alt ?? 0);
			if (color && !crowded(t)) pluck(o, timbre(o.ctx, color), m, t, gain * LAYER, len, true);
			// No harmony on a passing note: a third above it would clash.
			if (this.#harmony > 0 && !n.alt) {
				this.#harmony--;
				const d =
					n.deg + (isChordTone(n.deg + 2, n.root) || !isChordTone(n.deg + 5, n.root) ? 2 : 5);
				const { voice, up, gain: g } = this.#harmonist;
				pluck(o, timbre(o.ctx, voice), this.#midi(d + up), t, g * (1 + 0.25 * h), 0.8);
			}
		});
	}

	get #echo() {
		return (3 * this.#six * this.clock.ms) / 1000;
	}

	#sounding(at: number): { root: number; key: Key } {
		if (at < this.#ends) {
			const now = this.#run.findLast((r) => r.at <= at + 1);
			if (now) return { root: now.n.root, key: now.n.key };
		}
		return { root: this.#root, key: this.#key };
	}

	#bendEcho(t: number) {
		if (!echo) return;
		const d = this.#echo;
		const p = echo.delayTime;
		p.setTargetAtTime(d + BEND, t + d, BEND_IN);
		p.setTargetAtTime(d, t + d + 0.2, 0.4);
	}

	tap() {
		this.#play((o, now, when) => {
			pluck(o, timbre(o.ctx, this.#lead), this.#midi(this.#root), when(now), 0.04, 0.12, true);
		});
	}

	nope() {
		this.#play((o, now, when) => {
			pluck(o, timbre(o.ctx, CHORD), this.#midi(this.#root) - 12, when(now), 0.06, 0.14);
		});
	}

	#onBeat(now: number, lead: number) {
		return this.clock.next(now + lead, 2 * this.#six);
	}

	#ahead(): { run: Note[]; next: number } {
		const notes = this.#song.notes;
		const run: Note[] = [];
		for (let j = this.#i; ; j++) {
			const n = notes[j % notes.length];
			run.push(n);
			if (run.length >= 3 && n.downbeat) return { run, next: j + 1 };
		}
	}

	chime() {
		this.#play((o, now, when) => {
			this.#joinIn(o, now, when, { voice: BELL, up: 7, gain: 0.035 }, [16, 18, 21], 0.035, 0.9);
		});
	}

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

	done(color?: string) {
		this.#play((o, now, when) => {
			const soft = this.#joins === 'soft';
			this.#heatTo(o, now, when(now), this.#warmth(now) + (soft ? 0.1 : 0.35));
			if (soft) {
				const voice = color ?? PLAIN;
				this.#joinIn(o, now, when, { voice, up: 0, gain: 0.045 }, [7], 0.045, 0.6, true);
				return;
			}
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
			const gap = (this.#six * this.clock.ms) / 2;
			const beat = this.#onBeat(now, 30 + sweep.length * gap);
			const on = this.#ends > beat;
			const from = on ? this.#ends : beat;
			sweep.forEach((d, i) => {
				pluck(o, tb, this.#midi(d), when(from - (sweep.length - i) * gap), 0.045, 0.4);
			});
			if (!first.chord && !on)
				this.#chord(o, when(from), first.root, this.#heat, 'block', first.seventh);
			this.#flourish(o, when, tb, run, from, 0.075, 1.4, this.#heat);
			this.#advance(next);
			this.#root = last.root;
		});
	}

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
