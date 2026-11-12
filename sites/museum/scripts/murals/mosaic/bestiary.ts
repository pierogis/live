// A Page of Beasts, after a medieval bestiary.
import { points, type Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 18;
const PH = 16;
const COLS = 3;

const GLYPHS = '1/1 11/1. 1./11 11/.1 1/1 .1/11 11/11'.split(' ').map((g) => g.split('/'));

function draw(c: Canvas) {
	const { put, rect, ell, disk, dots } = c;

	const miniature = (
		col: number,
		row: number,
		ground: string,
		frame: string,
		initial: string,
		words: string
	) => {
		c.at(col * PW, row * PH);
		c.clip();
		rect(0, 0, 17, 11, frame);
		rect(1, 1, 16, 10, ground);
		rect(1, 12, 2, 14, initial);
		put(3, 12, initial);
		let x = 5;
		for (const word of words.split(' ')) {
			for (const g of word) {
				const glyph = GLYPHS[+g];
				if (x + glyph[0].length > 17) break;
				c.stamp(glyph, x, 13, { 1: 'K' });
				x += glyph[0].length + 1;
			}
			x += 1;
		}
		c.clip(1, 1, 16, 10);
	};

	const legs = (xs: number[], y0: number, y1: number, col: string, hoof?: string) => {
		for (const x of xs) {
			rect(x, y0, x, y1, col);
			if (hoof) put(x, y1, hoof);
		}
	};

	miniature(0, 0, 'B', 'Y', 'B', '014 20 34');
	rect(1, 10, 16, 10, 'G');
	rect(1, 9, 2, 9, 'G');
	rect(12, 9, 16, 9, 'G');
	rect(3, 5, 10, 7, 'P');
	put(3, 5, 'B');
	legs([3, 5, 8, 10], 8, 9, 'P', 'K');
	rect(10, 3, 11, 5, 'P');
	rect(11, 3, 13, 4, 'P');
	put(14, 4, 'P');
	put(11, 2, 'P');
	dots('Y', [14, 3], [15, 2], [16, 1]);
	dots('Y', [9, 3], [9, 4], [10, 2]);
	put(13, 3, 'K');
	dots('P', [2, 6], [1, 7], [1, 8]);
	rect(1, 1, 4, 2, 'G');
	rect(2, 3, 3, 3, 'G');
	put(1, 1, 'B');
	put(4, 1, 'B');

	miniature(1, 0, 'R', 'Y', 'R', '10 420 5');
	rect(1, 10, 16, 10, 'G');
	rect(6, 5, 13, 7, 'Y');
	legs([11, 13], 8, 9, 'Y');
	legs([6, 8], 8, 9, 'Y', 'K');
	rect(5, 3, 7, 5, 'Y');
	rect(4, 2, 6, 3, 'Y');
	put(6, 1, 'Y');
	dots('K', [3, 3], [2, 3], [2, 4]);
	put(5, 2, 'K');
	points('8,11 9,13 10,14 11,14').forEach(([x0, x1], i) => rect(x0, 4 - i, x1, 4 - i, 'P'));
	dots('Y', [14, 6], [15, 5], [16, 4], [16, 3]);

	miniature(2, 0, 'Y', 'K', 'B', '03 140 2');
	ell(9, 8, 7, 3, 'S');
	rect(13, 6, 15, 8, 'S');
	dots('S', [3, 5], [2, 4], [1, 3], [1, 2], [3, 3], [4, 2]);
	rect(1, 9, 16, 10, 'B');
	for (const x of [1, 2, 5, 6, 9, 10, 13, 14]) {
		if (c.get(x, 8) === 'Y') put(x, 8, 'B');
	}
	rect(16, 7, 16, 8, 'B');
	put(1, 8, 'B');
	put(1, 7, 'B');
	put(13, 6, 'K');
	rect(12, 8, 15, 8, 'K');
	rect(6, 4, 11, 4, 'K');
	dots('K', [5, 3], [12, 3]);
	rect(8, 1, 8, 3, 'K');
	rect(9, 1, 11, 2, 'P');
	put(9, 3, 'P');
	put(10, 3, 'P');

	miniature(0, 1, 'R', 'Y', 'R', '41 023 6');
	rect(3, 5, 10, 8, 'S');
	put(3, 5, 'R');
	rect(3, 9, 4, 10, 'S');
	rect(8, 9, 9, 10, 'S');
	rect(10, 4, 12, 7, 'S');
	put(11, 3, 'S');
	dots('S', [13, 5], [13, 6], [14, 6], [14, 7], [14, 8], [14, 9], [15, 10], [16, 10], [16, 9]);
	dots('P', [13, 7], [13, 8]);
	put(12, 5, 'K');
	dots('K', [10, 5], [10, 6]);
	rect(4, 2, 8, 4, 'Y');
	dots('Y', [4, 1], [6, 1], [8, 1]);
	rect(6, 3, 6, 4, 'K');
	dots('S', [2, 6], [1, 7]);

	miniature(1, 1, 'Y', 'K', 'R', '22 05 104');
	rect(5, 6, 11, 8, 'G');
	legs([6, 10], 9, 10, 'G', 'K');
	rect(11, 4, 12, 7, 'G');
	rect(12, 3, 15, 4, 'G');
	put(12, 2, 'G');
	put(14, 3, 'K');
	dots('R', [16, 4], [16, 5], [15, 5]);
	[9, 9, 8].forEach((x1, i) => rect(6 + i, 5 - i, x1, 5 - i, 'R'));
	dots('G', [4, 8], [3, 9], [2, 9], [1, 8], [1, 7], [1, 6], [2, 5], [3, 5], [4, 6], [3, 7]);
	rect(6, 8, 10, 8, 'P');

	miniature(2, 1, 'B', 'Y', 'R', '041 3 20');
	rect(2, 5, 9, 7, 'R');
	legs([2, 4, 7, 9], 8, 10, 'R');
	rect(9, 3, 12, 5, 'R');
	dots('R', [9, 2], [12, 2], [10, 6]);
	for (const x of [3, 5, 7]) rect(x, 5, x, 7, 'Y');
	dots('Y', [10, 3]);
	put(11, 4, 'K');
	put(12, 5, 'P');
	dots('R', [1, 5], [1, 4], [1, 3], [2, 2]);
	disk(14.5, 7.5, 2.2, 'Y');
	rect(14, 7, 15, 8, 'P');

	miniature(0, 2, 'Y', 'K', 'R', '30 412 0');
	rect(1, 10, 16, 10, 'G');
	rect(3, 6, 10, 7, 'R');
	legs([3, 5, 8, 10], 8, 9, 'R', 'K');
	rect(10, 4, 11, 6, 'R');
	rect(11, 4, 13, 5, 'R');
	put(14, 5, 'R');
	put(13, 4, 'K');
	put(2, 5, 'P');
	put(2, 6, 'P');
	dots('K', [11, 3], [10, 2], [10, 1], [8, 2], [9, 2], [8, 1]);
	dots('K', [12, 3], [13, 2], [13, 1], [14, 2], [15, 2], [15, 1]);
	dots('G', [15, 5], [15, 6], [16, 7], [15, 8], [14, 9]);

	miniature(1, 2, 'B', 'Y', 'R', '11 403 5');
	rect(6, 5, 13, 7, 'Y');
	legs([7, 9, 11, 13], 8, 9, 'Y');
	disk(4.5, 4.5, 3, 'R');
	rect(3, 4, 5, 6, 'Y');
	dots('K', [3, 4], [5, 4]);
	put(4, 6, 'K');
	dots('Y', [14, 5], [15, 4], [16, 3], [16, 2]);
	dots('R', [15, 1], [16, 1]);

	miniature(2, 2, 'R', 'Y', 'B', '24 001 3');
	rect(1, 9, 16, 9, 'K');
	ell(8.5, 5.2, 4, 3.9, 'P');
	dots('P', [5, 1], [12, 1], [5, 2], [12, 2]);
	rect(6, 3, 7, 4, 'Y');
	rect(10, 3, 11, 4, 'Y');
	dots('K', [7, 4], [10, 4]);
	dots('K', [8, 5], [9, 5], [8, 6]);
	rect(5, 6, 5, 7, 'K');
	rect(12, 6, 12, 7, 'K');
	dots('Y', [7, 9], [10, 9]);
	for (const [bx, by] of points('1,3 14,2 1,6 14,6'))
		dots('K', [bx, by], [bx + 1, by + 1], [bx + 2, by]);

	miniature(0, 3, 'B', 'Y', 'R', '02 51 40');
	for (let x = 1; x < 17; x++) {
		const h = [1, 2, 3, 2][(x + 1) % 4];
		rect(x, 11 - h, x, 10, 'Y');
	}
	rect(8, 3, 9, 8, 'R');
	rect(7, 5, 10, 6, 'R');
	rect(8, 1, 9, 2, 'R');
	put(10, 2, 'Y');
	put(9, 1, 'K');
	put(7, 1, 'Y');
	for (let i = 0; i < 4; i++) {
		rect(4 - i + 2, 5 - i, 7 - i + 1, 5 - i, 'R');
		rect(10 + i - 1, 5 - i, 13 + i - 2, 5 - i, 'R');
	}
	dots('R', [7, 9], [10, 9], [8, 9], [9, 9]);

	miniature(1, 3, 'R', 'Y', 'B', '31 042 1');
	rect(3, 9, 14, 10, 'Y');
	dots('Y', [2, 9], [15, 9]);
	dots('K', [5, 10], [8, 10], [11, 10]);
	ell(10.5, 6.5, 4.6, 2.4, 'P');
	dots('P', [15, 5], [16, 4], [16, 5]);
	rect(7, 2, 8, 5, 'P');
	rect(5, 1, 7, 2, 'P');
	dots('Y', [4, 2], [4, 3], [4, 4], [5, 5], [6, 6]);
	put(6, 1, 'K');
	rect(10, 6, 13, 6, 'K');
	put(14, 5, 'K');

	miniature(2, 3, 'Y', 'K', 'B', '40 13 20');
	rect(1, 10, 16, 10, 'G');
	ell(8, 9, 5.5, 3.6, 'K', (_x, y) => y <= 9);
	dots('K', [14, 8], [15, 9], [14, 9]);
	put(16, 9, 'P');
	rect(11, 9, 14, 9, 'P');
	put(12, 7, 'P');
	for (const gx of [4, 7, 10]) {
		put(gx, 5, 'K');
		put(gx + 1, 5, 'K');
		rect(gx, 3, gx + 1, 4, 'B');
		put(gx, 2, 'G');
	}
	dots('K', [2, 7], [13, 6]);
	dots('G', [14, 1], [15, 1], [15, 2], [16, 1]);
}

export const bestiary: Mural = {
	file: 'bestiary',
	name: 'A Page of Beasts',
	prefix: 'bestiary',
	notes: 'F',
	difficulty: 0.1,
	cols: COLS,
	panel: [PW, PH],
	palette: {
		P: '#f1e3bd',
		B: '#22408f',
		R: '#bf3a26',
		Y: '#e2a52b',
		K: '#2e1d16',
		G: '#4f9a57',
		S: '#8f96a3'
	},
	ground: 'P',
	panels: [
		['unicorn', 'The Unicorn', { mode: 'lydian', spice: 'gentle', lead: 'harp' }],
		['griffin', 'The Griffin', { mode: 'mixolydian', spice: 'lively', lead: 'brass' }],
		['whale', 'The Whale', { mode: 'dorian', spice: 'gentle', lead: 'string', meter: 3 }],
		['elephant', 'The Elephant', { mode: 'phrygian', spice: 'lively', lead: 'mallet' }],
		['dragon', 'The Dragon', { mode: 'dorian', spice: 'lively', lead: 'pizz' }],
		['tiger', 'The Tiger', { mode: 'mixolydian', spice: 'lively', lead: 'kalimba' }],
		['stag', 'The Stag', { mode: 'minor', spice: 'gentle', lead: 'flute' }],
		['lion', 'The Lion', { mode: 'lydian', spice: 'lively', lead: 'brass' }],
		['owl', 'The Owl', { mode: 'dorian', spice: 'gentle', lead: 'vibes' }],
		['phoenix', 'The Phoenix', { mode: 'lydian', spice: 'lively', lead: 'string' }],
		['pelican', 'The Pelican', { mode: 'mixolydian', spice: 'gentle', lead: 'keys', meter: 3 }],
		['hedgehog', 'The Hedgehog', { mode: 'phrygian', spice: 'gentle', lead: 'kalimba' }]
	],
	draw
};
