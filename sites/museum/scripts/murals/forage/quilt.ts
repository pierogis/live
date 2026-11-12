// A Baltimore album quilt (Maryland, 1840s): appliqué blocks in turkey red and green on
// cream, each sewn by a different hand: wreaths, baskets, birds, an eagle, a ship. The
// cream is quilted in a diagonal grid. Twelve blocks of 26 by 26, each framed in green.
import { around as ring, turn, type Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 26;
const PH = 26;
const COLS = 4;
/** A block's middle. */
const MID = 12.5;

const HEART = [
	'.##...##.',
	'####.####',
	'#########',
	'#########',
	'.#######.',
	'..#####..',
	'...###...',
	'....#....'
];
const TULIP = ['#.#.#', '#####', '#####', '.###.'];
const EAGLE = [
	'K....................K',
	'KK..................KK',
	'KKY................YKK',
	'KKKY......WW......YKKK',
	'.KKKY....WWWyy...YKKK.',
	'.KKKKY...WWW....YKKKK.',
	'..KKKKY.KKKKK..YKKKK..',
	'..KKKKKYKKKKKKYKKKKK..',
	'...KKKKKKBBBBKKKKKK...',
	'....KKKKKBWBBKKKKK....',
	'.....KKKKRWRWKKKK.....',
	'......KKKRWRWKKK......',
	'........KRWRWK........',
	'.........RWRW.........',
	'..........RW..........',
	'.........yKKy.........',
	'........y..K.y........'
];
const BIRD = ['..rr....', '.rrrr...', 'rkrrrr..', 'yrrrrrrr', '.rrrrrrr', '..rrrrr.', '...k.k..'];

function draw(c: Canvas) {
	const { put, rect, disk, ell, line, dots, stamp, leaf } = c;
	/** Points round a block's middle (or a given one). */
	const around = (n: number, r: number, from = 0, cx = MID, cy = MID) => ring(n, r, cx, cy, from);

	/** A round rose: red, a pink heart, a yellow eye. */
	const rose = (x: number, y: number, r = 2.4) => {
		disk(x, y, r, 'R');
		disk(x, y, r * 0.5, 'P');
		put(Math.round(x), Math.round(y), 'Y');
	};

	// every block: a green frame with red corners, the cream quilted in a diagonal grid
	const block = (col: number, row: number) => {
		c.at(col * PW, row * PH);
		c.clip(0, 0, PW - 1, PH - 1);
		rect(0, 0, PW - 1, PH - 1, 'G');
		rect(1, 1, PW - 2, PH - 2, 'W');
		for (let y = 2; y < PH - 2; y++) {
			for (let x = 2; x < PW - 2; x++)
				if ((x + y) % 8 === 1 || (x - y + 80) % 8 === 1) put(x, y, 'Q');
		}
		dots('R', [0, 0], [PW - 1, 0], [0, PH - 1], [PW - 1, PH - 1]);
	};

	// ---------- 1. a wreath of roses ----------
	block(0, 0);
	c.ring(MID, MID, 7.5, 'G', 0.8);
	for (const [x, y, a] of around(8, 7.5, Math.PI / 8)) {
		leaf(x, y, a + Math.PI / 2, 3.5, 'G');
		leaf(x, y, a - Math.PI / 2, 3.5, 'G');
	}
	for (const [x, y] of around(4, 7.5)) rose(x, y);
	rose(MID, MID, 2.2);

	// ---------- 2. four hearts and four tulips ----------
	block(1, 0);
	// tips to the middle
	let heart = HEART;
	for (const [dx, dy] of [
		[8, 2],
		[14, 8],
		[9, 14],
		[3, 9]
	]) {
		stamp(heart, dx, dy, { '#': 'R' });
		heart = turn(heart);
	}
	// a tulip in each corner, on a stem from the middle
	for (const [x, y, a] of around(4, 9.5, Math.PI / 4)) {
		line(MID + Math.cos(a) * 4, MID + Math.sin(a) * 4, x, y, 'G');
		disk(x + Math.cos(a) * 0.8, y + Math.sin(a) * 0.8, 1.7, 'Y');
		put(x + Math.cos(a) * 1.5, y + Math.sin(a) * 1.5, 'R');
	}

	// ---------- 3. a red bird on a cherry branch ----------
	block(2, 0);
	line(3, 21, 22, 6, 'K');
	line(3, 22, 22, 7, 'K');
	line(10, 16, 7, 9, 'K');
	for (const [x, y, a] of [
		[6, 19, -2.2],
		[13, 14, 1.2],
		[17, 10, -2.4],
		[20, 8, 0.9],
		[8, 11, -2.6],
		[16, 12, 1.9]
	] as const)
		leaf(x, y, a, 4, 'G', 'L');
	// cherries hang in pairs on fine stems
	for (const [x, y] of [
		[5, 22],
		[11, 18],
		[19, 12],
		[7, 13]
	]) {
		dots('K', [x, y], [x + 2, y]);
		dots('R', [x - 1, y + 2], [x, y + 2], [x - 1, y + 3], [x, y + 3]);
		dots('R', [x + 2, y + 2], [x + 3, y + 2], [x + 2, y + 3], [x + 3, y + 3]);
	}
	stamp(BIRD, 9, 5, { r: 'R', k: 'K', y: 'Y' });

	// ---------- 4. a pineapple ----------
	block(3, 0);
	ell(MID, 15, 6, 7.5, 'Y');
	// its scales: a brown diamond grid, an orange eye in some
	for (let y = 8; y <= 22; y++) {
		for (let x = 6; x <= 19; x++) {
			if (c.get(x, y) !== 'Y') continue;
			if ((x + y) % 4 === 0 || (x - y + 40) % 4 === 0) put(x, y, 'K');
			else if ((x + y) % 8 === 2 && (x - y + 40) % 8 === 2) put(x, y, 'R');
		}
	}
	for (const a of [-2.6, -2.1, -1.57, -1.05, -0.55]) leaf(MID, 8, a, 5.5, 'G', 'L');
	leaf(MID, 6, -1.57, 3.5, 'G');
	line(9, 23, 16, 23, 'G');

	// ---------- 5. a basket of flowers ----------
	block(0, 1);
	// woven: rows of blue and cream, shifted each row
	for (let y = 15; y <= 22; y++) {
		const half = 7 - (y - 15) * 0.4;
		for (let x = Math.round(MID - half); x <= Math.round(MID + half); x++) {
			put(x, y, (x + (y % 2) * 2) % 4 < 2 ? 'B' : y % 2 ? 'W' : 'B');
		}
	}
	rect(5, 14, 20, 14, 'B');
	c.ring(MID, 14, 6, 'B', 0.8);
	rect(6, 14, 19, 14, 'B');
	for (const [x, y] of [
		[7, 10],
		[12, 7],
		[18, 10]
	])
		rose(x, y, 2.3);
	disk(9, 4, 1.4, 'Y');
	disk(16, 5, 1.4, 'Y');
	dots('P', [4, 8], [21, 8], [10, 12], [15, 12]);
	for (const [x, y, a] of [
		[9, 12, 2.6],
		[16, 12, 0.5],
		[12, 10, -2.3],
		[13, 10, -0.8]
	] as const)
		leaf(x, y, a, 3.5, 'G', 'L');

	// ---------- 6. a lyre with a wreath ----------
	block(1, 1);
	for (const s of [-1, 1]) {
		for (let y = 8; y <= 21; y++) {
			const x = MID + s * (4 + 2.4 * Math.sin(((y - 8) / 13) * Math.PI));
			put(x, y, 'Y');
			put(x + s, y, 'Y');
		}
	}
	rect(7, 21, 18, 22, 'Y');
	rect(8, 9, 17, 9, 'K');
	for (const x of [10, 12, 13, 15]) line(x, 10, x, 20, 'K');
	// a ribbon bow on top, laurel round it
	dots('R', [11, 7], [14, 7], [10, 6], [15, 6], [12, 7], [13, 7]);
	dots('R', [11, 8], [14, 8]);
	for (const [x, y, a] of around(9, 9.5, Math.PI * 0.6)) {
		if (y < 6) continue;
		leaf(x, y, a + Math.PI / 2, 3, 'L');
	}
	dots('R', [4, 18], [21, 18], [3, 13], [22, 13]);

	// ---------- 7. a cornucopia ----------
	block(2, 1);
	// the horn curls from its tip at the bottom right up to a wide mouth at the left
	for (let k = 0; k <= 30; k++) {
		const t = k / 30;
		const x = 21 - t * 11;
		const y = 21 - t * 7 - Math.sin(t * Math.PI) * 3;
		disk(x, y, 0.6 + t * 3.6, Math.floor(k / 5) % 2 ? 'K' : 'Y');
	}
	// spilling out of the mouth: an apple, a pear, grapes, cherries
	disk(7, 9, 2.6, 'R');
	put(7, 6, 'K');
	leaf(7, 6, -0.6, 3, 'G');
	disk(11, 7, 1.9, 'L');
	disk(11, 5, 1.2, 'L');
	put(11, 3, 'K');
	for (const [x, y] of [
		[3, 12],
		[5, 12],
		[4, 14],
		[6, 14],
		[3, 16],
		[5, 16],
		[4, 18],
		[2, 14]
	])
		put(x, y, 'B');
	dots('K', [4, 11], [4, 10]);
	dots('R', [14, 4], [16, 4], [16, 3]);
	leaf(2, 9, -1.2, 3.5, 'G', 'L');
	dots('P', [9, 12], [10, 13]);

	// ---------- 8. an urn of flowers ----------
	block(3, 1);
	ell(MID, 18, 4.5, 3.5, 'B');
	rect(9, 14, 16, 15, 'B');
	rect(10, 21, 15, 22, 'B');
	dots('Y', [8, 18], [17, 18], [10, 17], [15, 17], [12, 19], [13, 19]);
	c.ring(7.5, 17, 1.8, 'B', 0.8);
	c.ring(17.5, 17, 1.8, 'B', 0.8);
	line(MID, 13, MID, 6, 'G');
	line(MID, 13, 7, 7, 'G');
	line(MID, 13, 18, 7, 'G');
	rose(MID, 5, 2.3);
	stamp(TULIP, 5, 4, { '#': 'R' });
	stamp(TULIP, 16, 4, { '#': 'Y' });
	for (const [x, y, a] of [
		[10, 10, 3.6],
		[15, 10, -0.5],
		[12, 9, -2.4],
		[13, 11, -0.6]
	] as const)
		leaf(x, y, a, 3.5, 'G', 'L');
	dots('P', [9, 12], [16, 12], [5, 10], [20, 10]);

	// ---------- 9. an eagle with a shield ----------
	block(0, 2);
	// a dark edge round the white head, so it shows on the cream
	disk(12.5, 6, 2.6, 'K');
	stamp(EAGLE, 2, 2, { K: 'K', Y: 'Y', y: 'Y', W: 'W', B: 'B', R: 'R' });
	// olive branch and arrows in the talons
	line(3, 22, 10, 19, 'G');
	leaf(5, 21, -2, 2.5, 'L');
	leaf(7, 20, -1.9, 2.5, 'L');
	leaf(6, 21, 1.2, 2.5, 'L');
	line(15, 19, 22, 22, 'K');
	line(15, 20, 21, 23, 'K');
	dots('R', [22, 21], [21, 22], [21, 24]);

	// ---------- 10. a ship ----------
	block(1, 2);
	for (let y = 19; y <= 23; y++)
		for (let x = 2; x <= 23; x++) put(x, y, (x + (y % 3) * 2) % 6 < 2 && y > 19 ? 'W' : 'B');
	for (let x = 5; x <= 20; x++) {
		const bottom = 19 - Math.round(Math.abs(x - MID) > 5 ? (Math.abs(x - MID) - 5) * 0.8 : 0);
		for (let y = 16; y <= bottom; y++) put(x, y, y === 17 ? 'Y' : 'K');
	}
	for (const x of [8, 13, 18]) line(x, 4, x, 15, 'K');
	for (const [x, top, h] of [
		[8, 6, 8],
		[13, 4, 10],
		[18, 6, 8]
	]) {
		for (let k = 0; k < h; k++) {
			const half = 2 + Math.round(k * 0.15);
			for (let dx = -half; dx <= half; dx++) if (dx !== 0) put(x + dx, top + k, 'Q');
		}
	}
	dots('R', [13, 2], [14, 2], [15, 3], [14, 3]);
	dots('R', [3, 15], [22, 15]);

	// ---------- 11. a brick church ----------
	block(2, 2);
	rect(6, 11, 19, 22, 'R');
	for (let y = 12; y <= 22; y += 2) for (let x = 6 + (y % 4) / 2; x <= 19; x += 4) put(x, y, 'K');
	for (let k = 0; k <= 7; k++) rect(MID - k, 3 + k, MID + k, 3 + k, k < 2 ? 'Y' : 'K');
	rect(11, 17, 14, 22, 'K');
	for (const x of [8, 16]) {
		rect(x, 13, x + 1, 15, 'Y');
	}
	rect(12, 6, 13, 8, 'Y');
	for (const x of [3, 22]) {
		line(x, 22, x, 16, 'K');
		disk(x, 13, 2.5, 'G');
		dots('L', [x - 1, 12], [x + 1, 14]);
	}

	// ---------- 12. a grape wreath with two birds ----------
	block(3, 2);
	c.ring(MID, 13, 8, 'K', 0.7);
	for (const [x, y, a] of around(6, 8, Math.PI / 6, MID, 13)) {
		const ox = Math.cos(a) * 1.5;
		const oy = Math.sin(a) * 1.5;
		for (const [dx, dy] of [
			[0, 0],
			[1, 0],
			[-1, 0],
			[0, 1],
			[1, 1],
			[0, 2]
		])
			put(Math.round(x + ox) + dx, Math.round(y + oy) + dy, (dx + dy) % 2 ? 'P' : 'B');
	}
	for (const [x, y, a] of around(6, 8, 0, MID, 13)) leaf(x, y, a + Math.PI / 2, 3, 'G', 'L');
	// two lovebirds face each other inside it
	stamp(BIRD, 4, 10, { r: 'R', k: 'K', y: 'Y' }, true);
	stamp(BIRD, 14, 10, { r: 'R', k: 'K', y: 'Y' });
	c.at();
	c.clip();
}

export const quilt: Mural = {
	file: 'album-quilt',
	name: 'The Album Quilt',
	prefix: 'album-quilt',
	notes: 'F',
	cols: COLS,
	panel: [PW, PH],
	// W cream, Q quilting, G green, L light green, R turkey red, P pink, Y yellow, B blue, K brown
	palette: {
		W: '#f3ead3',
		Q: '#bfa06a',
		G: '#2e7d32',
		L: '#9cc248',
		R: '#c0272d',
		P: '#f29aa8',
		Y: '#f2b134',
		B: '#2a5196',
		K: '#4a2c1a'
	},
	ground: 'W',
	panels: [
		['rose-wreath', 'Rose Wreath', { mode: 'major', spice: 'gentle', lead: 'harp' }],
		['four-hearts', 'Four Hearts', { mode: 'pentatonic', spice: 'gentle', lead: 'kalimba' }],
		['cherry-bird', 'Cherry Bird', { mode: 'mixolydian', spice: 'gentle', lead: 'flute' }],
		['pineapple', 'Pineapple', { mode: 'lydian', spice: 'gentle', lead: 'vibes' }],
		['flower-basket', 'Flower Basket', { mode: 'minor-pentatonic', spice: 'lively', lead: 'pizz' }],
		['lyre', 'The Lyre', { mode: 'dorian', spice: 'gentle', lead: 'harp' }],
		['cornucopia', 'Cornucopia', { mode: 'mixolydian', spice: 'lively', lead: 'mallet' }],
		['urn', 'The Urn', { mode: 'major', spice: 'gentle', lead: 'string' }],
		['eagle', 'The Eagle', { mode: 'mixolydian', spice: 'lively', lead: 'brass' }],
		['ship', 'The Ship', { mode: 'dorian', spice: 'lively', lead: 'keys' }],
		['brick-church', 'Brick Church', { mode: 'harmonic', spice: 'gentle', lead: 'string' }],
		['grape-wreath', 'Grape Wreath', { mode: 'lydian', spice: 'adventurous', lead: 'kalimba' }]
	],
	draw
};
