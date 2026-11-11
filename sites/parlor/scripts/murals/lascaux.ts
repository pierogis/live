/*
 * The Hall of the Bulls (Lascaux cave, France, about 17,000 years ago): animals painted
 * on a cave wall in charcoal and ochre. Bulls and a stag above, a cow, horses and a
 * hand print below.
 */
import { int, type Canvas, type Point } from './canvas.ts';
import type { Mural } from './mural.ts';

const PW = 18;
const PH = 16;
const COLS = 4;
const ROWS = 2;
const W = PW * COLS;
const H = PH * ROWS;

/** The four dots that touch a dot's sides. */
const SIDES: Point[] = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1]
];

// ---------- shapes: build a mask, then paint a fill with a thick outline ----------
/** A flat shape built from ovals and boxes, painted in one go so it can have an outline. */
class Shape {
	/** The dots in the shape, by a `x,y` key. */
	mask = new Map<string, Point>();

	add(x: number, y: number) {
		this.mask.set(`${x},${y}`, [x, y]);
	}

	has(x: number, y: number): boolean {
		return this.mask.has(`${x},${y}`);
	}

	/** Add a filled oval. */
	ell(cx: number, cy: number, rx: number, ry: number) {
		for (let y = int(cy - ry) - 1; y < int(cy + ry) + 2; y++) {
			for (let x = int(cx - rx) - 1; x < int(cx + rx) + 2; x++) {
				if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.add(x, y);
			}
		}
	}

	/** Add a filled box; the corners can come in either order. */
	rect(x0: number, y0: number, x1: number, y1: number) {
		for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
			for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.add(x, y);
		}
	}

	/** Drop every dot that `keep` turns down. */
	keepOnly(keep: (x: number, y: number) => boolean) {
		for (const [key, [x, y]] of this.mask) if (!keep(x, y)) this.mask.delete(key);
	}

	/**
	 * Paint the shape at (ox, oy). `f` is 1 to face right or -1 to face left.
	 * With an `edge` color, the dots on the rim get that color as an outline.
	 */
	paint(c: Canvas, ox: number, oy: number, f: number, fill: string, edge?: string) {
		for (const [x, y] of this.mask.values()) {
			const inner = SIDES.every(([dx, dy]) => this.has(x + dx, y + dy));
			c.put(ox + f * x, oy + y, inner || edge === undefined ? fill : edge);
		}
	}
}

function draw(c: Canvas) {
	const { put, rect } = c;

	/** Single dots of one color, placed like a shape: at (ox, oy), facing `f`. */
	const marks = (ox: number, oy: number, f: number, col: string, ...points: Point[]) => {
		for (const [x, y] of points) put(ox + f * x, oy + y, col);
	};

	// ---------- wall: pale upper wall, tan middle, dark rocky floor, soft wavy edges ----------
	for (let x = 0; x < W; x++) {
		// where the pale stone ends: lower at the sides, higher in the middle, with small steps
		const arch = x < 14 ? 8 : x < 20 ? 6 : x < 52 ? 4 : x < 58 ? 6 : 8;
		const top = arch + (Math.floor(x / 5) % 2 ? 1 : 0);
		// tan / floor edge, long low humps
		const floor = 26 - (Math.floor((x + 3) / 9) % 2 ? 1 : 0);
		for (let y = 0; y < H; y++) put(x, y, y < top ? 'L' : y < floor ? 'T' : 'D');
	}

	const bull = (ox: number, oy: number, f: number) => {
		// Great aurochs, 17 long so it fits one panel: black outline, pale body, spotted face, curved horns.
		const s = new Shape();
		// body and heavy shoulder
		s.ell(-1, 0, 5.5, 3.2);
		s.ell(3, -1, 3, 3.4);
		// neck and head
		s.rect(4, -3, 6, 0);
		s.ell(7, -1.5, 2, 2);
		// legs
		s.rect(-5, 2, -4, 6);
		s.rect(2, 2, 3, 6);
		s.paint(c, ox, oy, f, 'L', 'K');
		// horns
		marks(ox, oy, f, 'K', [8, -4], [9, -5], [9, -6], [9, -7], [5, -4], [5, -5], [5, -6], [6, -7]);
		// face spots, tail
		marks(ox, oy, f, 'K', [7, -2], [5, -1], [-7, 0], [-7, 1], [-7, 2]);
		// hooves
		marks(ox, oy, f, 'K', [-5, 7], [-4, 7], [2, 7], [3, 7]);
	};

	const horse = (ox: number, oy: number, f: number, col = 'R') => {
		// Small trotting horse, 9 long: ochre body and head, black mane, legs and tail.
		const s = new Shape();
		// body, neck and head
		s.ell(0, 0, 3.2, 1.8);
		s.rect(2, -3, 3, 0);
		s.rect(3, -4, 4, -3);
		s.paint(c, ox, oy, f, col);
		// mane
		marks(ox, oy, f, 'K', [1, -3], [1, -2], [2, -4], [2, -5], [3, -5]);
		// legs, tail
		marks(
			ox,
			oy,
			f,
			'K',
			[-3, 2],
			[-3, 3],
			[-2, 2],
			[2, 2],
			[3, 3],
			[2, 3],
			[-4, 0],
			[-4, 1],
			[-4, 2]
		);
	};

	const cow = (ox: number, oy: number, f: number) => {
		// Red cow, about 16 long: all red ochre, black horns, hooves and tail.
		const s = new Shape();
		// body, neck and head
		s.ell(0, 0, 5.5, 2.8);
		s.rect(4, -3, 6, 0);
		s.ell(7, -2, 1.8, 1.5);
		// legs
		s.rect(-4, 2, -3, 5);
		s.rect(3, 2, 4, 5);
		s.paint(c, ox, oy, f, 'R');
		// horns, then the tail, the hooves and the eye
		marks(
			ox,
			oy,
			f,
			'K',
			[7, -4],
			[8, -5],
			[9, -5],
			[6, -4],
			[6, -5],
			[-6, 0],
			[-7, 1],
			[-7, 2],
			[-7, 3],
			[-4, 6],
			[-3, 6],
			[3, 6],
			[4, 6],
			[8, -2]
		);
	};

	const stag = (ox: number, oy: number, f: number) => {
		// Stag, yellow ochre, with tall branching black antlers.
		const s = new Shape();
		// body, neck and head
		s.ell(0, 0, 4.6, 2.5);
		s.rect(3, -4, 4, -1);
		s.rect(4, -5, 6, -4);
		// legs
		s.rect(-3, 2, -2, 4);
		s.rect(2, 2, 3, 4);
		s.paint(c, ox, oy, f, 'Y');
		// hooves, nose and tail
		marks(ox, oy, f, 'K', [-3, 5], [-2, 5], [2, 5], [3, 5], [7, -4], [-5, -1], [-5, -2]);
		// two antler beams, each with tines
		const beams: [ax: number, d: number][] = [
			[3, -1],
			[5, 1]
		];
		for (const [ax, d] of beams) {
			marks(
				ox,
				oy,
				f,
				'K',
				[ax, -6],
				[ax, -7],
				[ax + d, -8],
				[ax + d, -9],
				[ax + d, -10],
				[ax + 2 * d, -8],
				[ax + 3 * d, -9],
				[ax + 3 * d, -10],
				[ax, -9],
				[ax, -10]
			);
		}
	};

	const blackBull = (ox: number, oy: number) => {
		// The great black bull: head and shoulders coming in from the right edge, facing left.
		const s = new Shape();
		// shoulder hump and chest
		s.ell(13, 2, 7.5, 5.6);
		// neck and long head
		s.rect(4, -2, 9, 3);
		s.ell(3, 0, 3.4, 2.4);
		// stays in the top row
		s.keepOnly((_x, y) => oy + y < PH);
		s.paint(c, ox, oy, 1, 'K');
		// horns
		marks(
			ox,
			oy,
			1,
			'K',
			[3, -3],
			[2, -4],
			[1, -5],
			[1, -6],
			[2, -7],
			[6, -3],
			[6, -4],
			[5, -5],
			[5, -6],
			[6, -7]
		);
		// eye and nostril
		marks(ox, oy, 1, 'L', [3, -1], [0, 1]);
	};

	const hand = (ox: number, oy: number, col = 'R') => {
		// Hand-print: square palm, three fingers up, thumb out to the side.
		rect(ox, oy, ox + 4, oy + 3, col);
		for (const i of [0, 2, 4]) rect(ox + i, oy - 3, ox + i, oy - 1, col);
		rect(ox + 5, oy + 1, ox + 6, oy + 1, col);
		put(ox + 6, oy, col);
	};

	// ---------- top row ----------
	// panel 1
	stag(7, 10, 1);
	// two red marks by the antlers
	for (let i = 0; i < 2; i++) rect(1 + i * 3, 2, 2 + i * 3, 3, 'R');
	// panel 2, facing right
	bull(25, 8, 1);
	// panel 3, facing left
	bull(46, 8, -1);
	// panel 4, entering from the right
	blackBull(57, 9);

	// ---------- bottom row ----------
	// panel 5
	cow(8, 21, 1);
	// panel 6
	horse(22, 22, 1);
	horse(31, 20, 1);
	// panel 7
	horse(40, 20, 1);
	horse(49, 22, 1, 'Y');
	// panel 8
	hand(58, 21);
	// row of bold ochre marks on the floor
	for (let i = 0; i < 5; i++) rect(56 + i * 3, 29, 57 + i * 3, 30, 'Y');
	// three black dots climbing
	for (let i = 0; i < 3; i++) rect(66 + i * 2, 23 - i * 3, 67 + i * 2, 24 - i * 3, 'K');
}

export const lascaux: Mural = {
	file: '00a-lascaux',
	name: 'The Hall of the Bulls',
	prefix: 'lascaux',
	notes: 'C',
	cols: COLS,
	rows: ROWS,
	panel: [PW, PH],
	// Cave wall: L pale stone, T tan stone, D dark rock floor, K charcoal black,
	// R red ochre, Y yellow ochre.
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
		['stag', 'Stag', { mode: 'major', spice: 'gentle', lead: 'kalimba' }],
		['west-bull', 'West Bull', { mode: 'major', spice: 'gentle', lead: 'mallet' }],
		['east-bull', 'East Bull', { mode: 'mixolydian', spice: 'gentle', lead: 'harp' }],
		['black-bull', 'Black Bull', { mode: 'dorian', spice: 'lively', lead: 'brass' }],
		['red-cow', 'Red Cow', { mode: 'major', spice: 'gentle', lead: 'flute' }],
		['red-horses', 'Red Horses', { mode: 'mixolydian', spice: 'lively', lead: 'pizz' }],
		['yellow-horse', 'Yellow Horse', { mode: 'major', spice: 'lively', lead: 'vibes' }],
		['hand-print', 'Hand Print', { mode: 'dorian', spice: 'gentle', lead: 'keys' }]
	],
	draw
};
