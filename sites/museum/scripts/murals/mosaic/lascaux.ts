// The Hall of the Bulls (Lascaux cave, France, about 17,000 years ago): animals in
// charcoal and ochre on a cave wall. Eight panels of 18 by 16.
import { inell, int, points, SIDES, type Canvas, type Point } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 18;
const PH = 16;
const COLS = 4;
const ROWS = 2;
const W = PW * COLS;
const H = PH * ROWS;

// a flat shape built from ovals and boxes, painted in one go so it can have an outline
class Shape {
	mask = new Map<string, Point>();

	add(x: number, y: number) {
		this.mask.set(`${x},${y}`, [x, y]);
	}

	ell(cx: number, cy: number, rx: number, ry: number) {
		for (let y = int(cy - ry) - 1; y < int(cy + ry) + 2; y++) {
			for (let x = int(cx - rx) - 1; x < int(cx + rx) + 2; x++) {
				if (inell(x, y, cx, cy, rx, ry)) this.add(x, y);
			}
		}
	}

	rect(x0: number, y0: number, x1: number, y1: number) {
		for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.add(x, y);
	}

	// `f` is 1 to face right, -1 to face left; rim dots take the `edge` color if given
	paint(c: Canvas, ox: number, oy: number, f: number, fill: string, edge = fill) {
		for (const [x, y] of this.mask.values()) {
			const inner = SIDES.every(([dx, dy]) => this.mask.has(`${x + dx},${y + dy}`));
			c.put(ox + f * x, oy + y, inner ? fill : edge);
		}
	}
}

function draw(c: Canvas) {
	const { put, rect } = c;

	// single dots placed like a shape: at (ox, oy), facing `f`
	const marks = (ox: number, oy: number, f: number, col: string, list: string) => {
		for (const [x, y] of points(list)) put(ox + f * x, oy + y, col);
	};

	// ---------- the wall ----------
	for (let x = 0; x < W; x++) {
		// the pale stone ends lower at the sides and higher in the middle, in small steps
		const arch = x < 14 ? 8 : x < 20 ? 6 : x < 52 ? 4 : x < 58 ? 6 : 8;
		const top = arch + (Math.floor(x / 5) % 2 ? 1 : 0);
		const floor = 26 - (Math.floor((x + 3) / 9) % 2 ? 1 : 0);
		for (let y = 0; y < H; y++) put(x, y, y < top ? 'L' : y < floor ? 'T' : 'D');
	}

	// ---------- the animals ----------
	const bull = (ox: number, oy: number, f: number) => {
		const s = new Shape();
		s.ell(-1, 0, 5.5, 3.2);
		s.ell(3, -1, 3, 3.4);
		s.rect(4, -3, 6, 0);
		s.ell(7, -1.5, 2, 2);
		s.rect(-5, 2, -4, 6);
		s.rect(2, 2, 3, 6);
		s.paint(c, ox, oy, f, 'L', 'K');
		marks(ox, oy, f, 'K', '8,-4 9,-5 9,-6 9,-7 5,-4 5,-5 5,-6 6,-7');
		marks(ox, oy, f, 'K', '7,-2 5,-1 -7,0 -7,1 -7,2 -5,7 -4,7 2,7 3,7');
	};

	const horse = (ox: number, oy: number, col = 'R') => {
		const s = new Shape();
		s.ell(0, 0, 3.2, 1.8);
		s.rect(2, -3, 3, 0);
		s.rect(3, -4, 4, -3);
		s.paint(c, ox, oy, 1, col);
		marks(ox, oy, 1, 'K', '1,-3 1,-2 2,-4 2,-5 3,-5');
		marks(ox, oy, 1, 'K', '-3,2 -3,3 -2,2 2,2 3,3 2,3 -4,0 -4,1 -4,2');
	};

	const cow = (ox: number, oy: number) => {
		const s = new Shape();
		s.ell(0, 0, 5.5, 2.8);
		s.rect(4, -3, 6, 0);
		s.ell(7, -2, 1.8, 1.5);
		s.rect(-4, 2, -3, 5);
		s.rect(3, 2, 4, 5);
		s.paint(c, ox, oy, 1, 'R');
		marks(ox, oy, 1, 'K', '7,-4 8,-5 9,-5 6,-4 6,-5 -6,0 -7,1 -7,2 -7,3');
		marks(ox, oy, 1, 'K', '-4,6 -3,6 3,6 4,6 8,-2');
	};

	const stag = (ox: number, oy: number) => {
		const s = new Shape();
		s.ell(0, 0, 4.6, 2.5);
		s.rect(3, -4, 4, -1);
		s.rect(4, -5, 6, -4);
		s.rect(-3, 2, -2, 4);
		s.rect(2, 2, 3, 4);
		s.paint(c, ox, oy, 1, 'Y');
		marks(ox, oy, 1, 'K', '-3,5 -2,5 2,5 3,5 7,-4 -5,-1 -5,-2');
		// two antler beams: one at x 3 leaning back, one at x 5 leaning forward
		for (const [ax, d] of points('3,-1 5,1')) {
			for (const [k, y] of points('0,-6 0,-7 1,-8 1,-9 1,-10 2,-8 3,-9 3,-10 0,-9 0,-10'))
				put(ox + ax + k * d, oy + y, 'K');
		}
	};

	// head and shoulders coming in from the right edge
	const blackBull = (ox: number, oy: number) => {
		const s = new Shape();
		s.ell(13, 2, 7.5, 5.6);
		s.rect(4, -2, 9, 3);
		s.ell(3, 0, 3.4, 2.4);
		// stays in the top row
		for (const [key, [, y]] of s.mask) if (oy + y >= PH) s.mask.delete(key);
		s.paint(c, ox, oy, 1, 'K');
		marks(ox, oy, 1, 'K', '3,-3 2,-4 1,-5 1,-6 2,-7 6,-3 6,-4 5,-5 5,-6 6,-7');
		marks(ox, oy, 1, 'L', '3,-1 0,1');
	};

	const hand = (ox: number, oy: number) => {
		rect(ox, oy, ox + 4, oy + 3, 'R');
		for (const i of [0, 2, 4]) rect(ox + i, oy - 3, ox + i, oy - 1, 'R');
		rect(ox + 5, oy + 1, ox + 6, oy + 1, 'R');
		put(ox + 6, oy, 'R');
	};

	// top row, one panel each; two red marks by the stag's antlers
	stag(7, 10);
	for (let i = 0; i < 2; i++) rect(1 + i * 3, 2, 2 + i * 3, 3, 'R');
	bull(25, 8, 1);
	bull(46, 8, -1);
	blackBull(57, 9);

	// bottom row
	cow(8, 21);
	horse(22, 22);
	horse(31, 20);
	horse(40, 20);
	horse(49, 22, 'Y');
	hand(58, 21);
	// ochre marks on the floor and three black dots climbing
	for (let i = 0; i < 5; i++) rect(56 + i * 3, 29, 57 + i * 3, 30, 'Y');
	for (let i = 0; i < 3; i++) rect(66 + i * 2, 23 - i * 3, 67 + i * 2, 24 - i * 3, 'K');
}

export const lascaux: Mural = {
	file: '00a-lascaux',
	name: 'The Hall of the Bulls',
	prefix: 'lascaux',
	notes: 'C',
	cols: COLS,
	panel: [PW, PH],
	// L pale stone, T tan stone, D dark rock floor, K charcoal, R red ochre, Y yellow ochre
	palette: {
		L: '#f0e2c4',
		T: '#c9a06c',
		D: '#6f5a4c',
		K: '#1d1512',
		R: '#a8402a',
		Y: '#e0a526'
	},
	ground: 'L',
	panels: [
		['stag', 'Stag', { mode: 'minor-pentatonic', spice: 'gentle', lead: 'kalimba' }],
		['west-bull', 'West Bull', { mode: 'pentatonic', spice: 'gentle', lead: 'mallet' }],
		['east-bull', 'East Bull', { mode: 'mixolydian', spice: 'gentle', lead: 'harp' }],
		['black-bull', 'Black Bull', { mode: 'dorian', spice: 'lively', lead: 'brass' }],
		['red-cow', 'Red Cow', { mode: 'pentatonic', spice: 'gentle', lead: 'flute' }],
		['red-horses', 'Red Horses', { mode: 'minor-pentatonic', spice: 'lively', lead: 'pizz' }],
		['yellow-horse', 'Yellow Horse', { mode: 'phrygian', spice: 'lively', lead: 'vibes' }],
		['hand-print', 'Hand Print', { mode: 'dorian', spice: 'gentle', lead: 'keys' }]
	],
	draw
};
