// Madaba Map (Madaba, Jordan, 6th century).
import { points, type Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 24;
const PH = 22;
const COLS = 4;
const W = COLS * PW;
const H = 3 * PH;
const MOUTH = 60;

const bend = (x: number) => 24 + x * 0.3 + 3 * Math.sin(x / 7);

const FISH = ['.KK.K', 'KWKKK', '.KK.K'];
const LION = [
	'N..........NN..',
	'.N.......NNNNN.',
	'..YYYYYYYNNNKNY',
	'.YYYYYYYYYNNNYY',
	'.YYYYYYYYYYN...',
	'YY.........YY..',
	'Y............Y.'
];
const GAZELLE = [
	'..........KK',
	'..........TK',
	'.........TT.',
	'W.TTTTTTTTT.',
	'.TTTTTTTTT..',
	'..WWWWWWT...',
	'..K......K..',
	'.K........K.'
];
const CHURCH = [
	'.....K.....',
	'....KKK....',
	'.....T.....',
	'....TTT....',
	'...TTTTT...',
	'..TTTTTTT..',
	'.KKKKKKKKK.',
	'.KWWWWWWWK.',
	'.KWKWWWKWK.',
	'.KWWWKWWWK.',
	'.KWWKKKWWK.',
	'.KKKKKKKKK.'
];
const SAIL = ['....K.....', '...WWW....', '..WWWWW...', '....K.....', 'NNNNNNNNNN', '.NNNNNNNN.'];
const GRAIN = ['...YYY....', '..YYYYY...', 'NNNNNNNNNN', '.NNNNNNNN.'];
const SALT = ['..W..W..W.', '.WWWWWWWWW', 'NNNNNNNNNN', '.NNNNNNNN.'];
const BUSH = ['.O.O.', 'OGOGO', '.OGO.'];
const HOUSE = ['.TTT.', 'TTTTT', 'WWKWW', 'WWKWW'];

function draw(c: Canvas) {
	const { put, rect, line, ell, dots } = c;
	const stamp = (p: string[], x: number, y: number, flip = false) =>
		c.stamp(p, x, y, { K: 'K', W: 'W', N: 'N', Y: 'Y', T: 'T', O: 'O', G: 'G' }, flip);

	const palm = (x: number, y: number, h: number) => {
		line(x, y, x, y - h, 'N');
		for (let k = y - 1; k > y - h; k -= 2) put(x + 1, k, 'K');
		for (const a of [-2.8, -2.2, -1.75, -1.35, -0.9, -0.35]) c.leaf(x, y - h, a, 4, 'G', 'O');
		dots('Y', [x - 1, y - h + 1], [x + 1, y - h + 1]);
	};
	const hump = (x: number, y: number, rx: number, ry: number) => {
		ell(x, y, rx, ry, 'N');
		ell(x, y, rx - 1, ry - 1, 'T');
		ell(x - 0.7, y - 0.7, rx - 1.7, ry - 1.7, 'P');
		ell(x - 1.2, y - 1.2, rx - 2.6, ry - 2.6, 'W');
		ell(x - 0.6, y - 0.4, rx - 2.8, ry - 2.6, 'P');
	};
	const tower = (x: number, y: number) => {
		rect(x, y, x + 3, y + 4, 'W');
		rect(x, y, x + 3, y, 'T');
		rect(x + 1, y + 2, x + 2, y + 2, 'K');
	};
	const town = (x0: number, y0: number, x1: number, y1: number) => {
		rect(x0, y0, x1, y1, 'W');
		rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, 'K');
		rect(x0 + 2, y0 + 2, x1 - 2, y1 - 2, 'C');
		for (let y = y0 + 2; y + 3 <= y1 - 2; y += 5) {
			for (let x = x0 + 2; x + 4 <= x1 - 2; x += 6) stamp(HOUSE, x, y);
		}
		for (const [x, y] of [
			[x0 - 1, y0 - 2],
			[x1 - 2, y0 - 2],
			[x0 - 1, y1 - 3],
			[x1 - 2, y1 - 3]
		]) {
			tower(x, y);
		}
		rect(Math.floor((x0 + x1) / 2) - 1, y1 - 1, Math.floor((x0 + x1) / 2) + 1, y1, 'N');
	};
	const colonnade = (x: number, y: number, n: number) => {
		rect(x, y, x + 2 * n, y, 'T');
		rect(x, y + 1, x + 2 * n, y + 1, 'K');
		for (let k = 0; k <= 2 * n; k++) rect(x + k, y + 2, x + k, y + 4, k % 2 ? 'K' : 'W');
		rect(x, y + 5, x + 2 * n, y + 5, 'K');
	};

	for (const [x, y, rx, ry] of points<[number, number, number, number]>(
		'-1,-1,6,5 10,0,7,5.5 22,-1,6,5 33,0,7,5 45,-1,6,5.5 56,0,7,5 68,-1,6,6 80,0,7,6 92,0,6,6 ' +
			'5,5,5,4 17,6,6,4.5 28,4,5,4 39,6,6,4.5 51,5,5,4 62,6,6,5 74,6,6,5 87,6,6,5.5 ' +
			'41,10,3.5,3 23,10,3,2.5 68,11,4,3.5 95,13,5,5 90,17,4,4 94,21,5,4.5 95,28,4.5,4.5 91,33,4,4'
	)) {
		hump(x, y, rx, ry);
	}

	for (let x = 0; x <= MOUTH; x++) {
		const cy = bend(x);
		for (let y = Math.round(cy - 4.3); y <= Math.round(cy + 4.3); y++) {
			const d = y - cy;
			const band = Math.floor(d + 4.5 + 0.8 * Math.sin(x * 0.8)) % 2;
			put(x, y, Math.abs(d) > 3.3 ? 'U' : band ? 'L' : 'U');
		}
	}
	ell(72, 56, 23, 9.5, 'U');
	for (let y = 48; y < H; y += 2) {
		for (let x = 48; x < W; x++) {
			if (c.get(x, y) === 'U' && c.get(x, y - 1) === 'U' && Math.sin(x * 0.6 + y * 1.3) > -0.2) {
				put(x, y + (x % 4 < 2 ? 0 : 1), 'L');
			}
		}
	}
	for (const x of [3, 14, 25, 42]) stamp(FISH, x, Math.round(bend(x + 2)) - 1);
	stamp(FISH, 53, Math.round(bend(55)) - 1, true);

	for (const [x, side] of points('8,0 21,1 29,0 46,1 52,0 1,1 40,0')) {
		stamp(BUSH, x, Math.round(bend(x + 2)) + (side ? 5 : -7));
	}
	const fy = Math.round(bend(36));
	line(36, fy - 6, 36, fy + 6, 'K');
	rect(36, fy - 8, 36, fy - 6, 'N');
	rect(36, fy + 6, 36, fy + 8, 'N');
	stamp(['..K..', '.KWK.', 'NNNNN', '.NNN.'], 34, fy - 2);

	stamp(SAIL, 54, 49);
	stamp(GRAIN, 62, 57);
	stamp(SALT, 76, 55);
	stamp(SAIL, 84, 47, true);

	stamp(LION, 25, 13);
	stamp(GAZELLE, 50, 12);
	for (const [x, y] of points('19,16 41,17 44,12 61,18 66,13 1,18 74,18 32,21 56,21')) {
		stamp(BUSH, x, y);
	}
	stamp(CHURCH, 4, 9);
	palm(17, 19, 7);
	palm(70, 20, 7);
	palm(46, 21, 6);

	stamp(CHURCH, 12, 33);
	palm(4, 41, 6);
	palm(27, 42, 7);
	stamp(BUSH, 20, 39);

	for (const [x, y] of points('28,51 45,52 30,65 37,65 44,63 26,60 41,49')) palm(x, y, 5);
	for (const [x, y] of points('34,46 42,57 31,59 37,61 24,52 46,46 40,62 28,44 44,60 33,62'))
		stamp(BUSH, x, y);
	for (let k = 0; k < 12; k++) {
		const a = (k * Math.PI) / 6;
		const [x, y] = [36 + Math.round(5 * Math.cos(a)), 55 + Math.round(4 * Math.sin(a))];
		put(x, y, 'W');
		put(x, y + 1, 'N');
	}
	town(2, 47, 22, 63);
	palm(12, 55, 4);
	palm(24, 46, 4);

	town(50, 24, 66, 33);
	palm(69, 33, 6);
	palm(49, 37, 5);

	colonnade(74, 24, 6);
	rect(74, 32, 88, 37, 'L');
	rect(75, 33, 87, 36, 'U');
	for (const x of [77, 81, 85]) put(x, 34, 'W');
	palm(73, 41, 7);
	palm(90, 42, 7);
	stamp(CHURCH, 79, 11);
	tower(74, 14);
}

export const madaba: Mural = {
	file: 'madaba-map',
	name: 'Madaba Map',
	prefix: 'madaba-map',
	notes: 'E',
	difficulty: 0.25,
	cols: COLS,
	panel: [PW, PH],
	palette: {
		C: '#e3cc98',
		W: '#fffdf7',
		K: '#2a211c',
		N: '#6e4a2c',
		Y: '#d39a36',
		T: '#b0462a',
		P: '#c88676',
		O: '#7e9446',
		G: '#2f5e3c',
		U: '#3d6f98',
		L: '#92bccb'
	},
	ground: 'C',
	panels: [
		['sapsaphas', 'Sapsaphas', { mode: 'dorian', spice: 'gentle', lead: 'harp' }],
		['the-lion', 'The Lion', { mode: 'phrygian', spice: 'lively', lead: 'brass' }],
		['the-gazelle', 'The Gazelle', { mode: 'mixolydian', spice: 'lively', lead: 'flute' }],
		['hills-of-moab', 'Hills of Moab', { mode: 'minor', spice: 'gentle', lead: 'string' }],
		['the-jordan', 'The Jordan', { mode: 'lydian', spice: 'gentle', lead: 'kalimba' }],
		['the-ferry', 'The Ferry', { mode: 'dorian', spice: 'lively', lead: 'pizz' }],
		['turning-back', 'Turning Back', { mode: 'phrygian', spice: 'gentle', lead: 'vibes' }],
		['hot-springs', 'Hot Springs', { mode: 'mixolydian', spice: 'gentle', lead: 'keys' }],
		['jericho', 'Jericho', { mode: 'dorian', spice: 'adventurous', lead: 'mallet' }],
		['palm-groves', 'Palm Groves', { mode: 'lydian', spice: 'gentle', lead: 'harp' }],
		['salt-boat', 'The Salt Boat', { mode: 'minor', spice: 'lively', lead: 'flute', meter: 3 }],
		['dead-sea', 'The Dead Sea', { mode: 'dorian', spice: 'gentle', lead: 'string' }]
	],
	draw
};
