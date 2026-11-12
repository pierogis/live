// Nebamun Hunting in the Marshes (Thebes, about 1350 BC).
import { points, type Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 24;
const PH = 22;
const COLS = 4;
const W = COLS * PW;
const H = 3 * PH;
const WATER = 50;
const DECK = 46;

const DUCK = ['...ww....', '..wwww...', 'Kbbbbbbb.', '.bbbbbbK>', '...bb....'];
const GOOSE = ['.....KK.', '.....bK>', '.....b..', '.bbbbb..', 'bwwwbb..', '.bbbb...', '..K.K...'];
const HERON = ['.K.', '.K.', 'ww.', 'www', 'www', '.ww', '.w.', '.wK', '.K.'];
const FLY = ['y.y', 'yKy', 'y.y'];
const FISH = ['..bb....', '.bbbbbb.', 'bbbbbbKb', '.bbbbbb.', '..r..r..'];
const CAT = [
	'..........o.o',
	'.........oooo',
	'........ooKoo',
	'.ooooooooooo.',
	'oKoooKoooKoo.',
	'.ooooooooooo.',
	'.oo.......oo.',
	'oo.........oo'
];
const UMBEL = [
	'l.l.l.l.l.l',
	'ggggggggggg',
	'.ggggggggg.',
	'..ggggggg..',
	'...ggggg...',
	'....ggg....',
	'.....g.....'
];

function draw(c: Canvas) {
	const { put, rect, disk, line } = c;
	const stamp = (p: string[], x: number, y: number, key: Record<string, string>, flip = false) =>
		c.stamp(p, x, y, key, flip);

	rect(0, WATER, W - 1, H - 1, 'U');
	for (let y = WATER + 2; y < H; y += 4) {
		for (let x = 0; x < W; x++) put(x, y + (Math.abs((x % 6) - 3) > 1 ? 0 : 1), 'K');
	}
	const fish = (x: number, y: number, body: string, flip = false) =>
		stamp(FISH, x, y, { b: body, K: 'K', r: 'R' }, flip);
	for (const [x, y, k] of points<[number, number, number]>(
		'4,53,0 16,58,1 28,54,2 40,60,0 52,55,1 63,59,2 74,53,0 86,58,1 10,61,2 46,52,1 80,62,2 92,54,0'
	)) {
		fish(x, y, ['W', 'Y', 'R'][k], k === 1);
	}
	for (const x of [37, 58, 70, 90]) {
		stamp(['W.W.W', '.WWW.', '..G..'], x, WATER - 2, { W: 'W', G: 'G' });
	}

	for (let x = 0; x < W; x++) put(x, 0, 'RUGY'[Math.floor(x / 3) % 4]);
	for (let x = 0; x < W; x += 3) put(x, 0, 'K');
	rect(0, 1, W - 1, 1, 'K');

	const umbel = (x: number, y: number) => stamp(UMBEL, x - 5, y, { g: 'G', l: 'L' });
	const stalk = (x: number, top: number) => {
		line(x, top + 6, x + ((x * 7) % 3) - 1, WATER - 1, 'G');
		umbel(x, top);
	};
	for (const [x, top] of points(
		'49,22 53,12 57,26 60,5 64,17 67,3 71,13 74,24 78,6 81,18 85,3 88,12 91,25 94,7 63,30 76,33 89,34'
	)) {
		stalk(x, top);
	}
	for (const [x, top] of points('2,4 5,14 1,24')) stalk(x, top);
	for (const [x, y] of points('58,30 66,26 74,30 82,32 90,28 70,38 86,40 62,40')) {
		stamp(['.L.', 'LLL', '.G.'], x, y, { L: 'L', G: 'G' });
	}
	stamp(['GGGGG', 'GWWWG', '.GGG.'], 78, 42, { G: 'G', W: 'W' });

	const duck = (x: number, y: number, body: string, wing: string, flip = false) =>
		stamp(DUCK, x, y, { b: body, w: wing, K: 'K', '>': 'Y' }, flip);
	for (const [x, y, k] of points<[number, number, number]>(
		'10,3,1 14,22,0 36,3,2 44,8,0 46,16,1 56,9,2 66,11,0 74,9,1 86,15,0 50,13,2 74,25,2 90,32,0 54,36,1 82,26,1 60,20,0'
	)) {
		duck(x, y, ['W', 'R', 'U'][k], ['U', 'W', 'R'][k], k === 1);
	}
	for (const [x, y] of points('20,8 40,14 61,17 79,14 93,20 47,24 85,36 70,32 3,34 16,26')) {
		stamp(FLY, x, y, { y: 'Y', K: 'K' });
	}

	stamp(CAT, 46, 27, { o: 'O', K: 'K' });
	duck(42, 24, 'W', 'R', true);
	duck(44, 34, 'R', 'W', true);
	duck(56, 33, 'U', 'W');

	rect(4, DECK, 54, DECK + 3, 'L');
	for (let x = 6; x < 54; x += 4) line(x, DECK, x, DECK + 3, 'K');
	for (let k = 0; k < 5; k++) {
		rect(4 - k, DECK - k, 6 - k, DECK - k, 'L');
		rect(52 + k, DECK - k, 54 + k, DECK - k, 'L');
	}
	stamp(UMBEL, 53, DECK - 9, { g: 'G' });

	stamp(['.W.', 'WYW', 'WWW'], 9, 3, { W: 'W', Y: 'Y' });
	disk(10, 10, 3.6, 'K');
	rect(8, 10, 11, 18, 'K');
	rect(12, 8, 13, 12, 'Y');
	put(13, 9, 'K');
	rect(9, 15, 14, 16, 'U');
	for (let y = 17; y < DECK; y++) {
		const half = 2 + Math.floor((y - 17) / 6);
		rect(11 - half, y, 12 + Math.min(half, 3), y, 'W');
	}
	line(10, 22, 10, DECK - 1, 'Y');
	line(13, 18, 18, 24, 'Y');
	stamp(['W.W', 'WWW', '.G.', '.G.'], 17, 17, { W: 'W', G: 'G' });

	disk(30, 9, 3.6, 'K');
	rect(31, 7, 33, 12, 'R');
	put(32, 8, 'W');
	put(33, 8, 'K');
	rect(26, 14, 34, 15, 'U');
	rect(26, 16, 34, 16, 'Y');
	for (let y = 17; y < 25; y++) rect(27 + Math.floor((y - 17) / 4), y, 33, y, 'R');
	line(27, 15, 22, 7, 'R');
	line(26, 15, 21, 7, 'R');
	line(19, 2, 23, 6, 'Y');
	line(20, 2, 24, 6, 'Y');
	put(19, 1, 'K');
	line(33, 17, 39, 20, 'R');
	line(33, 18, 39, 21, 'R');
	stamp(HERON, 38, 9, { w: 'W', K: 'K' });
	stamp(HERON, 40, 10, { w: 'W', K: 'K' });
	stamp(HERON, 42, 9, { w: 'W', K: 'K' });
	rect(26, 25, 35, 25, 'Y');
	for (let y = 26; y < 33; y++)
		rect(26 - Math.floor((y - 26) / 3), y, 35 + Math.floor((y - 26) / 3), y, 'W');
	line(28, 33, 25, DECK - 1, 'R');
	line(29, 33, 26, DECK - 1, 'R');
	line(34, 33, 38, DECK - 1, 'R');
	line(35, 33, 39, DECK - 1, 'R');

	disk(31, 39, 1.6, 'K');
	rect(32, 38, 33, 40, 'Y');
	rect(30, 41, 34, 45, 'W');
	line(34, 42, 37, 47, 'Y');

	stamp(GOOSE, 0, 37, { b: 'R', w: 'W', K: 'K', '>': 'Y' });
	stamp(GOOSE, 41, 39, { b: 'W', w: 'R', K: 'K', '>': 'Y' });
	duck(37, 27, 'U', 'R', true);
	for (const [x, y] of points('31,3 45,2 37,21 43,32 25,35')) stamp(FLY, x, y, { y: 'Y', K: 'K' });
}

export const marsh: Mural = {
	file: 'marsh-hunt',
	name: 'Hunting in the Marshes',
	prefix: 'marsh-hunt',
	notes: 'A',
	difficulty: 0.25,
	cols: COLS,
	panel: [PW, PH],
	palette: {
		B: '#d2ae6e',
		K: '#1e1712',
		R: '#a3432a',
		Y: '#e6b22e',
		W: '#f8f4ea',
		G: '#2f6f3a',
		L: '#9cbc52',
		U: '#3a7fb4',
		O: '#d9731c'
	},
	ground: 'B',
	panels: [
		['cone-and-flock', 'The Scented Cone', { mode: 'dorian', spice: 'gentle', lead: 'harp' }],
		['throwstick', 'The Throwstick', { mode: 'mixolydian', spice: 'lively', lead: 'flute' }],
		['umbels', 'Papyrus Umbels', { mode: 'lydian', spice: 'gentle', lead: 'kalimba' }],
		['birds-rising', 'Birds Rising', { mode: 'major', spice: 'lively', lead: 'vibes' }],
		['the-wife', 'His Wife', { mode: 'dorian', spice: 'gentle', lead: 'string' }],
		['three-herons', 'Three Herons', { mode: 'minor', spice: 'gentle', lead: 'pizz' }],
		['the-cat', 'The Cat', { mode: 'phrygian', spice: 'adventurous', lead: 'mallet' }],
		['the-nest', 'The Nest', { mode: 'lydian', spice: 'gentle', lead: 'harp' }],
		['the-skiff', 'The Skiff', { mode: 'mixolydian', spice: 'gentle', lead: 'keys' }],
		['the-daughter', 'His Daughter', { mode: 'major', spice: 'gentle', lead: 'flute' }],
		['tilapia', 'Tilapia', { mode: 'dorian', spice: 'lively', lead: 'kalimba', meter: 3 }],
		['lotus-water', 'Lotus Water', { mode: 'lydian', spice: 'gentle', lead: 'vibes' }]
	],
	draw
};
