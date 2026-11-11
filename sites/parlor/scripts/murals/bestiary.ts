/*
 * A Page of Beasts: one illuminated page from a medieval bestiary.
 * 3 x 4 panels of 18 x 16 dots (54 x 64). Each panel is one framed miniature with its caption.
 */
import type { Canvas } from './canvas.ts';
import type { Mural } from './mural.ts';

const PW = 18;
const PH = 16;
const COLS = 3;
const ROWS = 4;

// Letter-like marks, two dots tall: [top row, bottom row] as bit strings.
const GLYPHS: [top: string, bottom: string][] = [
	['1', '1'],
	['11', '1.'],
	['1.', '11'],
	['11', '.1'],
	['1', '1'],
	['.1', '11'],
	['11', '11']
];

function draw(c: Canvas) {
	const { put, rect, ell, disk, dots } = c;

	/**
	 * A framed miniature (rows 0-11) over a caption strip (rows 12-15).
	 * Leaves the clip on the inside of the frame.
	 */
	const miniature = (
		col: number,
		row: number,
		ground: string,
		frame: string,
		initial: string,
		words: number[][]
	) => {
		c.at(col * PW, row * PH);
		c.clip();
		// the frame and the colored ground inside it
		rect(0, 0, 17, 11, frame);
		rect(1, 1, 16, 10, ground);
		// the big initial
		rect(1, 12, 2, 14, initial);
		put(3, 12, initial);
		// the caption: words of small marks, cut off where the strip ends
		let x = 5;
		for (const word of words) {
			for (const g of word) {
				const [top, bottom] = GLYPHS[g];
				if (x + top.length > 17) break;
				[...top].forEach((ch, i) => ch === '1' && put(x + i, 13, 'K'));
				[...bottom].forEach((ch, i) => ch === '1' && put(x + i, 14, 'K'));
				x += top.length + 1;
			}
			x += 1;
		}
		c.clip(1, 1, 16, 10);
	};

	/** Straight legs at each `xs`, from `y0` down to `y1`, with a hoof or claw on the end if given. */
	const legs = (xs: number[], y0: number, y1: number, col: string, hoof?: string) => {
		for (const x of xs) {
			rect(x, y0, x, y1, col);
			if (hoof) put(x, y1, hoof);
		}
	};

	// ---------- 1. the unicorn ----------
	miniature(0, 0, 'B', 'Y', 'B', [
		[0, 1, 4],
		[2, 0],
		[3, 4]
	]);
	// a green hill
	rect(1, 10, 16, 10, 'G');
	rect(1, 9, 2, 9, 'G');
	rect(12, 9, 16, 9, 'G');
	// body
	rect(3, 5, 10, 7, 'P');
	put(3, 5, 'B');
	legs([3, 5, 8, 10], 8, 9, 'P', 'K');
	// neck, head, ear
	rect(10, 3, 11, 5, 'P');
	rect(11, 3, 13, 4, 'P');
	put(14, 4, 'P');
	put(11, 2, 'P');
	// the long horn
	dots('Y', [14, 3], [15, 2], [16, 1]);
	// mane
	dots('Y', [9, 3], [9, 4], [10, 2]);
	// eye
	put(13, 3, 'K');
	// tail
	dots('P', [2, 6], [1, 7], [1, 8]);
	// a tree in the corner
	rect(1, 1, 4, 2, 'G');
	rect(2, 3, 3, 3, 'G');
	put(1, 1, 'B');
	put(4, 1, 'B');

	// ---------- 2. the griffin ----------
	miniature(1, 0, 'R', 'Y', 'R', [[1, 0], [4, 2, 0], [5]]);
	// grass
	rect(1, 10, 16, 10, 'G');
	// lion's body
	rect(6, 5, 13, 7, 'Y');
	// paws behind, talons in front
	legs([11, 13], 8, 9, 'Y');
	legs([6, 8], 8, 9, 'Y', 'K');
	// eagle's neck, head, ear
	rect(5, 3, 7, 5, 'Y');
	rect(4, 2, 6, 3, 'Y');
	put(6, 1, 'Y');
	// hooked beak, eye
	dots('K', [3, 3], [2, 3], [2, 4]);
	put(5, 2, 'K');
	// wing: four rows of pale feathers, each row one higher
	const wingRows: [number, number][] = [
		[8, 11],
		[9, 13],
		[10, 14],
		[11, 14]
	];
	wingRows.forEach(([x0, x1], i) => rect(x0, 4 - i, x1, 4 - i, 'P'));
	// tail
	dots('Y', [14, 6], [15, 5], [16, 4], [16, 3]);

	// ---------- 3. the whale with a ship on its back ----------
	miniature(2, 0, 'Y', 'K', 'B', [[0, 3], [1, 4, 0], [2]]);
	// the whale
	ell(9, 8, 7, 3, 'S');
	rect(13, 6, 15, 8, 'S');
	// fluke
	dots('S', [3, 5], [2, 4], [1, 3], [1, 2], [3, 3], [4, 2]);
	// the sea
	rect(1, 9, 16, 10, 'B');
	// wave tips, only where the gold ground still shows
	for (const x of [1, 2, 5, 6, 9, 10, 13, 14]) {
		if (c.get(x, 8) === 'Y') put(x, 8, 'B');
	}
	// water at both ends of the whale
	rect(16, 7, 16, 8, 'B');
	put(1, 8, 'B');
	put(1, 7, 'B');
	// eye and mouth
	put(13, 6, 'K');
	rect(12, 8, 15, 8, 'K');
	// hull and mast
	rect(6, 4, 11, 4, 'K');
	dots('K', [5, 3], [12, 3]);
	rect(8, 1, 8, 3, 'K');
	// sail
	rect(9, 1, 11, 2, 'P');
	put(9, 3, 'P');
	put(10, 3, 'P');

	// ---------- 4. the elephant and castle ----------
	miniature(0, 1, 'R', 'Y', 'R', [[4, 1], [0, 2, 3], [6]]);
	// body
	rect(3, 5, 10, 8, 'S');
	put(3, 5, 'R');
	// legs
	rect(3, 9, 4, 10, 'S');
	rect(8, 9, 9, 10, 'S');
	// head
	rect(10, 4, 12, 7, 'S');
	put(11, 3, 'S');
	// trunk
	dots('S', [13, 5], [13, 6], [14, 6], [14, 7], [14, 8], [14, 9], [15, 10], [16, 10], [16, 9]);
	// tusk and eye
	dots('P', [13, 7], [13, 8]);
	put(12, 5, 'K');
	// ear
	dots('K', [10, 5], [10, 6]);
	// the castle tower
	rect(4, 2, 8, 4, 'Y');
	dots('Y', [4, 1], [6, 1], [8, 1]);
	rect(6, 3, 6, 4, 'K');
	// tail
	dots('S', [2, 6], [1, 7]);

	// ---------- 5. the dragon ----------
	miniature(1, 1, 'Y', 'K', 'R', [
		[2, 2],
		[0, 5],
		[1, 0, 4]
	]);
	// body
	rect(5, 6, 11, 8, 'G');
	legs([6, 10], 9, 10, 'G', 'K');
	// neck, head, horn
	rect(11, 4, 12, 7, 'G');
	rect(12, 3, 15, 4, 'G');
	put(12, 2, 'G');
	// eye, forked tongue
	put(14, 3, 'K');
	dots('R', [16, 4], [16, 5], [15, 5]);
	// a red wing
	[9, 9, 8].forEach((x1, i) => rect(6 + i, 5 - i, x1, 5 - i, 'R'));
	// curled tail
	dots('G', [4, 8], [3, 9], [2, 9], [1, 8], [1, 7], [1, 6], [2, 5], [3, 5], [4, 6], [3, 7]);
	// pale belly
	rect(6, 8, 10, 8, 'P');

	// ---------- 6. the tiger and the mirror ----------
	miniature(2, 1, 'B', 'Y', 'R', [[0, 4, 1], [3], [2, 0]]);
	// body
	rect(2, 5, 9, 7, 'R');
	legs([2, 4, 7, 9], 8, 10, 'R');
	// head and ears
	rect(9, 3, 12, 5, 'R');
	dots('R', [9, 2], [12, 2], [10, 6]);
	// stripes
	for (const x of [3, 5, 7]) rect(x, 5, x, 7, 'Y');
	// a stripe on the brow, the eye, a pale muzzle
	dots('Y', [10, 3]);
	put(11, 4, 'K');
	put(12, 5, 'P');
	// tail
	dots('R', [1, 5], [1, 4], [1, 3], [2, 2]);
	// the round mirror
	disk(14.5, 7.5, 2.2, 'Y');
	rect(14, 7, 15, 8, 'P');

	// ---------- 7. the stag and the snake ----------
	miniature(0, 2, 'Y', 'K', 'R', [[3, 0], [4, 1, 2], [0]]);
	// grass
	rect(1, 10, 16, 10, 'G');
	// slender body
	rect(3, 6, 10, 7, 'R');
	legs([3, 5, 8, 10], 8, 9, 'R', 'K');
	// neck and head
	rect(10, 4, 11, 6, 'R');
	rect(11, 4, 13, 5, 'R');
	put(14, 5, 'R');
	// eye, white tail
	put(13, 4, 'K');
	put(2, 5, 'P');
	put(2, 6, 'P');
	// antlers
	dots('K', [11, 3], [10, 2], [10, 1], [8, 2], [9, 2], [8, 1]);
	dots('K', [12, 3], [13, 2], [13, 1], [14, 2], [15, 2], [15, 1]);
	// the snake in its mouth
	dots('G', [15, 5], [15, 6], [16, 7], [15, 8], [14, 9]);

	// ---------- 8. the lion ----------
	miniature(1, 2, 'B', 'Y', 'R', [[1, 1], [4, 0, 3], [5]]);
	// body
	rect(6, 5, 13, 7, 'Y');
	legs([7, 9, 11, 13], 8, 9, 'Y');
	// the big mane
	disk(4.5, 4.5, 3, 'R');
	// face
	rect(3, 4, 5, 6, 'Y');
	dots('K', [3, 4], [5, 4]);
	put(4, 6, 'K');
	// tail and tuft
	dots('Y', [14, 5], [15, 4], [16, 3], [16, 2]);
	dots('R', [15, 1], [16, 1]);

	// ---------- 9. the owl mobbed by small birds ----------
	miniature(2, 2, 'R', 'Y', 'B', [[2, 4], [0, 0, 1], [3]]);
	// branch
	rect(1, 9, 16, 9, 'K');
	// owl with ear tufts
	ell(8.5, 5.2, 4, 3.9, 'P');
	dots('P', [5, 1], [12, 1], [5, 2], [12, 2]);
	// big eyes
	rect(6, 3, 7, 4, 'Y');
	rect(10, 3, 11, 4, 'Y');
	dots('K', [7, 4], [10, 4]);
	// beak
	dots('K', [8, 5], [9, 5], [8, 6]);
	// wing edges
	rect(5, 6, 5, 7, 'K');
	rect(12, 6, 12, 7, 'K');
	// feet
	dots('Y', [7, 9], [10, 9]);
	// the small birds
	const birds: [number, number][] = [
		[1, 3],
		[14, 2],
		[1, 6],
		[14, 6]
	];
	for (const [bx, by] of birds) dots('K', [bx, by], [bx + 1, by + 1], [bx + 2, by]);

	// ---------- 10. the phoenix ----------
	miniature(0, 3, 'B', 'Y', 'R', [
		[0, 2],
		[5, 1],
		[4, 0]
	]);
	// flames
	for (let x = 1; x < 17; x++) {
		const h = [1, 2, 3, 2][(x + 1) % 4];
		rect(x, 11 - h, x, 10, 'Y');
	}
	// body
	rect(8, 3, 9, 8, 'R');
	rect(7, 5, 10, 6, 'R');
	// head, beak, eye, crest
	rect(8, 1, 9, 2, 'R');
	put(10, 2, 'Y');
	put(9, 1, 'K');
	put(7, 1, 'Y');
	// wings
	for (let i = 0; i < 4; i++) {
		rect(4 - i + 2, 5 - i, 7 - i + 1, 5 - i, 'R');
		rect(10 + i - 1, 5 - i, 13 + i - 2, 5 - i, 'R');
	}
	// tail feathers down into the fire
	dots('R', [7, 9], [10, 9], [8, 9], [9, 9]);

	// ---------- 11. the pelican ----------
	miniature(1, 3, 'R', 'Y', 'B', [[3, 1], [0, 4, 2], [1]]);
	// nest
	rect(3, 9, 14, 10, 'Y');
	dots('Y', [2, 9], [15, 9]);
	dots('K', [5, 10], [8, 10], [11, 10]);
	// body and tail
	ell(10.5, 6.5, 4.6, 2.4, 'P');
	dots('P', [15, 5], [16, 4], [16, 5]);
	// neck and head
	rect(7, 2, 8, 5, 'P');
	rect(5, 1, 7, 2, 'P');
	// beak bent to its breast
	dots('Y', [4, 2], [4, 3], [4, 4], [5, 5], [6, 6]);
	put(6, 1, 'K');
	// wing
	rect(10, 6, 13, 6, 'K');
	put(14, 5, 'K');

	// ---------- 12. the hedgehog with grapes on its spines ----------
	miniature(2, 3, 'Y', 'K', 'B', [
		[4, 0],
		[1, 3],
		[2, 0]
	]);
	// grass
	rect(1, 10, 16, 10, 'G');
	// the bristly back
	ell(8, 9, 5.5, 3.6, 'K', (_x, y) => y <= 9);
	// snout
	dots('K', [14, 8], [15, 9], [14, 9]);
	put(16, 9, 'P');
	// pale face and eye
	rect(11, 9, 14, 9, 'P');
	put(12, 7, 'P');
	// grapes on its spines
	for (const gx of [4, 7, 10]) {
		put(gx, 5, 'K');
		put(gx + 1, 5, 'K');
		rect(gx, 3, gx + 1, 4, 'B');
		put(gx, 2, 'G');
	}
	// two loose spines
	dots('K', [2, 7], [13, 6]);
	// a vine leaf
	dots('G', [14, 1], [15, 1], [15, 2], [16, 1]);

	c.at();
	c.clip();
}

export const bestiary: Mural = {
	file: '00c-bestiary',
	name: 'A Page of Beasts',
	prefix: 'bestiary',
	notes: 'F',
	cols: COLS,
	rows: ROWS,
	panel: [PW, PH],
	palette: {
		P: '#f1e3bd', // parchment, and the pale beasts
		B: '#22408f', // deep blue ground
		R: '#bf3a26', // vermilion ground
		Y: '#e2a52b', // gold leaf
		K: '#2e1d16', // ink
		G: '#4f9a57', // green
		S: '#8f96a3' // grey
	},
	ground: 'P',
	panels: [
		['unicorn', 'The Unicorn', { mode: 'lydian', spice: 'gentle', lead: 'harp' }],
		['griffin', 'The Griffin', { mode: 'mixolydian', spice: 'lively', lead: 'brass' }],
		['whale', 'The Whale', { mode: 'dorian', spice: 'gentle', lead: 'string', meter: 3 }],
		['elephant', 'The Elephant', { mode: 'major', spice: 'lively', lead: 'mallet' }],
		['dragon', 'The Dragon', { mode: 'dorian', spice: 'lively', lead: 'pizz' }],
		['tiger', 'The Tiger', { mode: 'mixolydian', spice: 'lively', lead: 'kalimba' }],
		['stag', 'The Stag', { mode: 'major', spice: 'gentle', lead: 'flute' }],
		['lion', 'The Lion', { mode: 'major', spice: 'lively', lead: 'brass' }],
		['owl', 'The Owl', { mode: 'dorian', spice: 'gentle', lead: 'vibes' }],
		['phoenix', 'The Phoenix', { mode: 'lydian', spice: 'lively', lead: 'string' }],
		['pelican', 'The Pelican', { mode: 'mixolydian', spice: 'gentle', lead: 'keys', meter: 3 }],
		['hedgehog', 'The Hedgehog', { mode: 'major', spice: 'gentle', lead: 'kalimba' }]
	],
	draw
};
