/*
 * The Dering Roll (England, about 1270): a strip of parchment painted with rows of
 * knights' shields, a name written over each. One shield to a panel.
 */
import type { Canvas } from './canvas.ts';
import type { Mural } from './mural.ts';

const PW = 18;
const PH = 16;
const COLS = 4;
const ROWS = 3;

// The shield: 12 wide and 11 tall, flat on top, its sides curving to a point.
// Each row's left and right edge, outline included.
const SPAN: [number, number][] = [
	...Array<[number, number]>(7).fill([0, 11]),
	[1, 10],
	[2, 9],
	[3, 8],
	[5, 6]
];

/** Is this spot of the 10 by 10 field inside the outline? */
function inside(u: number, v: number): boolean {
	const y = v + 1;
	if (y < 0 || y >= 11) return false;
	const [a, b] = SPAN[y];
	return a < u + 1 && u + 1 < b && y < 10;
}

/** A design: the color of each spot of the field. */
type Field = (u: number, v: number) => string;

/** A charge drawn as rows of `X`, in `col` on `bg`, moved right `du` and down `dv`. */
function bitmap(rows: string[], col: string, bg: string, du = 1, dv = 0): Field {
	return (u, v) => {
		const ch = rows[v - dv]?.[u - du];
		return ch !== undefined && ch !== '.' ? col : bg;
	};
}

const LION = [
	'..........',
	'..XX...X..',
	'.XXX....X.',
	'...XX...X.',
	'.XXXXX.X..',
	'...XXXX...',
	'.XXXXX....',
	'...XXX....',
	'..XX.XX...'
];
const EAGLE = [
	'..........',
	'....XX....',
	'.X.XXX..X.',
	'.XX.XX.XX.',
	'.XXXXXXXX.',
	'.X.XXXX.X.',
	'...XXXX...',
	'..X.XX.X..',
	'....XX....'
];
const STAG = [
	'..........',
	'.X.X..X.X.',
	'.XXX..XXX.',
	'..X....X..',
	'..XXXXXX..',
	'...XXXX...',
	'...XXXX...',
	'....XX....',
	'....XX....'
];
const SUN = [
	'X..XX..X',
	'.X.XX.X.',
	'..XXXX..',
	'XXXXXXXX',
	'XXXXXXXX',
	'..XXXX..',
	'.X.XX.X.',
	'X..XX..X'
];
const LILIES = [
	'..........',
	'..X....X..',
	'.XXX..XXX.',
	'..X....X..',
	'..........',
	'....XX....',
	'...XXXX...',
	'....XX....',
	'....XX....'
];

const chevrons: Field = (u, v) => {
	const d = v + 1 - Math.trunc(Math.abs(u - 4.5));
	return d >= 0 && d % 4 < 2 ? 'Y' : 'B';
};
const waves: Field = (u, v) => (Math.floor((v + (u % 4 >= 2 ? 1 : 0)) / 2) % 2 === 0 ? 'B' : 'L');
const bend: Field = (u, v) => {
	const onBand = Math.abs(u - v) <= 1 && [1, 2].includes(u % 3) && [1, 2].includes(v % 3);
	if (onBand && Math.floor(u / 3) === Math.floor(v / 3)) return 'Y';
	return Math.abs(u - v) <= 2 ? 'R' : 'L';
};

// One design per panel, in reading order.
const DESIGNS: Field[] = [
	bitmap(LION, 'R', 'Y', 0),
	(u, v) => ((Math.floor(u / 2) + Math.floor(v / 2)) % 2 === 0 ? 'B' : 'L'),
	(u, v) => (u === 4 || u === 5 || v === 3 || v === 4 ? 'L' : 'R'),
	bitmap(EAGLE, 'K', 'Y', 0),
	chevrons,
	(u) => (Math.floor(u / 2) % 2 === 0 ? 'Y' : 'R'),
	bitmap(STAG, 'Y', 'G', 0),
	bend,
	waves,
	bitmap(SUN, 'Y', 'K', 1, 1),
	(u, v) => (u < 5 === v < 4 ? 'R' : 'Y'),
	bitmap(LILIES, 'Y', 'B', 0)
];

// The names: blocky marks that look like letters and spell nothing, three dots tall.
const GLYPH: Record<string, string[]> = {
	I: ['X', 'X', 'X'],
	L: ['X.', 'X.', 'XX'],
	F: ['XX', 'X.', 'X.'],
	T: ['XXX', '.X.', '.X.'],
	J: ['.X', '.X', 'XX'],
	N: ['X.X', 'XXX', 'X.X'],
	U: ['X.X', 'X.X', 'XXX'],
	A: ['XXX', 'X.X', 'X.X'],
	O: ['XXX', 'X.X', 'XXX']
};
const NAMES = [
	'LIAT',
	'FOUN',
	'TILJ',
	'ANIF',
	'UIOL',
	'JATI',
	'NULF',
	'OILA',
	'FIUT',
	'LANI',
	'TOJU',
	'IFAL'
];

function draw(c: Canvas) {
	const shield = (ox: number, oy: number, field: Field) => {
		SPAN.forEach(([a, b], y) => c.rect(ox + a, oy + y, ox + b, oy + y, 'K'));
		for (let v = 0; v < 10; v++)
			for (let u = 0; u < 10; u++) if (inside(u, v)) c.put(ox + 1 + u, oy + 1 + v, field(u, v));
	};
	const caption = (ox: number, oy: number, word: string) => {
		const glyphs = [...word].map((g) => GLYPH[g]);
		const w = glyphs.reduce((sum, g) => sum + g[0].length, 0) + glyphs.length - 1;
		let x = ox + Math.floor((PW - w) / 2);
		for (const g of glyphs) {
			g.forEach((row, dy) =>
				[...row].forEach((ch, dx) => ch === 'X' && c.put(x + dx, oy + dy, 'K'))
			);
			x += g[0].length + 1;
		}
	};
	// Three rows, each a light strip for the names over a worn tan band of shields.
	for (let k = 0; k < COLS * ROWS; k++) {
		const ox = (k % COLS) * PW;
		const oy = Math.floor(k / COLS) * PH;
		c.rect(ox, oy, ox + PW - 1, oy + 4, 'L');
		caption(ox, oy + 1, NAMES[k]);
		shield(ox + 3, oy + 5, DESIGNS[k]);
	}
}

export const dering: Mural = {
	file: '00b-dering-roll',
	name: 'The Dering Roll',
	prefix: 'dering-roll',
	notes: 'A',
	cols: COLS,
	rows: ROWS,
	panel: [PW, PH],
	// L light parchment (also heraldic silver), T worn tan parchment, K ink.
	palette: {
		L: '#f0e2c4',
		T: '#c9a06c',
		K: '#1d1512',
		R: '#b8301f',
		B: '#1f4a8a',
		Y: '#e0a526',
		G: '#2f7a45'
	},
	ground: 'T',
	panels: [
		['red-lion', 'Red Lion', { mode: 'mixolydian', spice: 'lively', lead: 'brass' }],
		['blue-chequer', 'Blue Chequer', { mode: 'major', spice: 'gentle', lead: 'harp' }],
		['white-cross', 'White Cross', { mode: 'dorian', spice: 'gentle', lead: 'flute' }],
		['black-eagle', 'Black Eagle', { mode: 'dorian', spice: 'lively', lead: 'brass' }],
		['gold-chevrons', 'Gold Chevrons', { mode: 'mixolydian', spice: 'gentle', lead: 'mallet' }],
		[
			'red-and-gold-stripes',
			'Red and Gold Stripes',
			{ mode: 'major', spice: 'lively', lead: 'pizz' }
		],
		['gold-stag', 'Gold Stag', { mode: 'dorian', spice: 'gentle', lead: 'harp', meter: 3 }],
		['red-band', 'Red Band', { mode: 'mixolydian', spice: 'lively', lead: 'string' }],
		['blue-waves', 'Blue Waves', { mode: 'major', spice: 'gentle', lead: 'vibes', meter: 3 }],
		['gold-sun', 'Gold Sun', { mode: 'mixolydian', spice: 'lively', lead: 'brass' }],
		[
			'red-and-gold-quarters',
			'Red and Gold Quarters',
			{ mode: 'major', spice: 'lively', lead: 'keys' }
		],
		['gold-lilies', 'Gold Lilies', { mode: 'dorian', spice: 'gentle', lead: 'kalimba' }]
	],
	draw
};
