// Umar at Fulad Castle, after a Hamzanama folio (Mughal India, about 1570).
import { points, type Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 24;
const PH = 22;
const COLS = 3;
const W = COLS * PW;
const H = 4 * PH;
const TOP = 16;
const FOOT = 50;
const GROUND = 66;

const UMAR = [
	'....CCC......',
	'...CCYCC.....',
	'....TTT......',
	'....TTK......',
	'....KKK......',
	'..RRRRRR.....',
	'.TRRYRRRT....',
	'.T.RRRRR.T...',
	'...RRYRR..T..',
	'...RRRRRR....',
	'...RRRRRRR...',
	'....YY.YYYYYY',
	'....YY....KKK',
	'....YY.......',
	'....YY.......',
	'....YY.......',
	'...KKK.......'
];
const FALLEN = [
	'..........KK..',
	'.........BB...',
	'........BBB.KK',
	'.......BBBBBB.',
	'....BBBBBBB...',
	'..BBBBBBBB....',
	'CTBBBBBB......',
	'CTTBBB........',
	'CCT...........'
];
const CRAWL = [
	'...CC.......',
	'..CCCY......',
	'Y.TT.RRRRR..',
	'YTTRRRRRRRR.',
	'..T.RR..RYYY',
	'...T....Y..Y'
];
const PAVILION = [
	'....Y....',
	'...YYY...',
	'..YYYYY..',
	'.YYYYYYY.',
	'KKKKKKKKK',
	'P.P.P.P.P',
	'P.P.P.P.P'
];
const GUARD = ['.CC.', 'CCCC', '.TT.', 'BBBB'];

function draw(c: Canvas) {
	const { put, rect, disk, line, ell } = c;
	const stamp = (p: string[], x: number, y: number, key: Record<string, string>, flip = false) =>
		c.stamp(p, x, y, key, flip);
	const all = { C: 'C', Y: 'Y', T: 'O', K: 'K', R: 'R', B: 'B', P: 'P' };

	for (const [x, y, len] of points<[number, number, number]>(
		'2,2,14 30,2,20 54,5,16 18,7,8 40,8,12 60,11,10 0,22,6 16,23,5'
	)) {
		line(x, y, x + len, y, 'C');
		line(x + 2, y + 1, x + len - 3, y + 1, 'C');
		put(x - 1, y - 1, 'C');
		put(x + len + 1, y - 1, 'C');
		put(x + len + 2, y - 2, 'C');
	}

	for (const [x, y] of points('4,7 9,5 14,11 20,4 50,14 56,9')) {
		put(x, y, 'K');
		put(x - 1, y - 1, 'K');
		put(x + 1, y - 1, 'K');
	}

	rect(22, TOP, W - 1, FOOT, 'P');
	for (let y = TOP + 4; y < FOOT; y += 5) {
		for (let x = 22; x < W; x++) if ((x + y) % 4 === 0) put(x, y, 'M');
	}
	for (const y of [TOP + 12, TOP + 22]) {
		rect(22, y, W - 1, y + 1, 'M');
		for (let x = 22; x < W; x += 3) put(x, y, 'B');
	}
	for (let x = 22; x < W; x += 3) rect(x, TOP - 2, x + 1, TOP - 1, 'P');
	for (const x of [24, 62]) {
		rect(x, TOP - 8, x + 8, FOOT, 'P');
		for (let y = TOP - 6; y < FOOT; y += 4) rect(x, y, x + 8, y, 'M');
		stamp(PAVILION, x, TOP - 15, { ...all, P: 'P' });
	}
	ell(47, 36, 7, 8, 'Y');
	rect(40, 36, 54, FOOT, 'Y');
	ell(47, 37, 5, 6, 'K');
	rect(42, 37, 52, FOOT, 'K');
	line(47, 32, 47, FOOT, 'M');
	for (const y of [40, 45]) line(43, y, 51, y, 'M');
	const niche = (x: number, y: number) =>
		stamp(['.Y.', 'YKY', 'YKY', 'YYY'], x, y, { Y: 'Y', K: 'K' });
	for (const y of [TOP + 3, TOP + 8]) for (let x = 35; x <= 57; x += 5) niche(x, y);
	for (const y of [TOP + 9, TOP + 17, TOP + 25]) for (const x of [26, 30, 64, 68]) niche(x - 1, y);
	for (const y of [TOP + 17, TOP + 23]) for (const x of [35, 57]) niche(x, y);
	stamp(['.YYYYYYY.', 'YRRRRRRRY', 'YRCRCRCRY', 'KKKKKKKKK'], 43, TOP + 14, {
		Y: 'Y',
		R: 'R',
		C: 'C',
		K: 'K'
	});
	for (const x of [36, 44, 55]) stamp(GUARD, x, TOP - 5, all);

	const rock = (cx: number, cy: number, rx: number, ry: number, col: string) => {
		ell(cx, cy, rx, ry, col);
		line(cx - rx + 1, cy, cx + rx - 1, cy - ry + 1, 'K');
	};
	for (const [x, y, rx, ry, k] of points<[number, number, number, number, number]>(
		'4,44,6,6,0 14,48,7,5,1 3,54,5,5,2 18,40,5,6,2 8,36,6,5,1 20,52,6,4,0'
	)) {
		rock(x, y, rx, ry, 'VOL'[k]);
	}
	line(10, 18, 10, 34, 'M');
	line(11, 18, 11, 34, 'M');
	line(10, 26, 5, 20, 'M');
	line(11, 24, 16, 18, 'M');
	for (const [x, y, r] of points<[number, number, number]>(
		'10,11,4.5 5,16,3.5 16,15,3.5 7,8,3 14,8,3 10,19,3'
	)) {
		disk(x, y, r, 'D');
	}
	for (const [x, y] of points('8,9 12,12 5,15 16,14 11,18 7,7 14,7 9,15')) put(x, y, 'L');

	rect(0, FOOT + 1, W - 1, GROUND - 1, 'G');
	for (const [x, y] of points(
		'3,60 9,63 26,62 33,57 40,63 52,60 58,64 66,58 70,62 46,55 62,53 24,53'
	)) {
		stamp(['.R.', 'RYR', '.L.'], x, y, { R: 'R', Y: 'Y', L: 'L' });
	}
	for (const [x, y, r] of points<[number, number, number]>('3,58,3 10,61,2.5 16,58,2 12,55,1.6')) {
		disk(x, y, r, 'D');
		put(x, y - 1, 'R');
		put(x - 1, y + 1, 'L');
	}
	stamp(UMAR, 20, 48, all);
	stamp(FALLEN, 33, 52, all);
	disk(50, 55, 2.6, 'Y');
	put(50, 55, 'M');
	line(29, 46, 34, 50, 'C');
	line(30, 46, 35, 50, 'C');

	const strata = ['O', 'V', 'P', 'O', 'L', 'V', 'O'];
	for (let y = GROUND; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const band = Math.floor((y - GROUND + Math.round(2 * Math.sin(x / 5))) / 3);
			put(x, y, strata[Math.max(0, band) % strata.length]);
		}
	}
	const tunnel: [number, number][] = [];
	for (let x = 4; x <= 64; x++) {
		const y =
			x < 14
				? GROUND - 6 + (x - 4) * 1.6
				: x > 56
					? GROUND + 10 - (x - 56) * 2.4
					: GROUND + 10 + Math.round(Math.sin(x / 6));
		tunnel.push([x, y]);
	}
	for (const [x, y] of tunnel) rect(x, y - 2, x, y + 2, 'K');
	rect(62, FOOT - 2, 66, GROUND, 'K');
	rect(61, FOOT - 3, 67, FOOT - 3, 'Y');
	stamp(CRAWL, 30, GROUND + 6, all);
	stamp(['.Y.', 'YYY', '.M.'], 46, GROUND + 9, { Y: 'Y', M: 'M' });
	for (const x of [8, 24, 40, 56, 70]) line(x, GROUND, x + 1, GROUND + 4, 'M');

	rect(0, H - 4, W - 1, H - 1, 'S');
	for (let x = 0; x < W; x += 4) put(x, H - 3, 'C');
	for (const x of [10, 34, 58]) stamp(['.YY.', 'YYYK', '.YY.'], x, H - 4, { Y: 'Y', K: 'K' });
}

export const hamza: Mural = {
	file: 'hamzanama',
	name: 'Umar at Fulad Castle',
	prefix: 'hamzanama',
	notes: 'D',
	difficulty: 0.3,
	cols: COLS,
	panel: [PW, PH],
	palette: {
		S: '#1f3a78',
		C: '#f3eee0',
		P: '#eba393',
		M: '#6e1f1a',
		Y: '#f2c232',
		K: '#17120f',
		R: '#c8312a',
		B: '#4a9bd8',
		G: '#3f7f2f',
		D: '#18451f',
		L: '#bcd95f',
		O: '#ad6428',
		V: '#a57fc4'
	},
	ground: 'S',
	panels: [
		['cloud-ribbons', 'Cloud Ribbons', { mode: 'dorian', spice: 'gentle', lead: 'flute' }],
		['gold-domes', 'The Gold Domes', { mode: 'phrygian', spice: 'gentle', lead: 'harp' }],
		['the-towers', 'The Towers', { mode: 'mixolydian', spice: 'lively', lead: 'kalimba' }],
		['chinar', 'The Chinar', { mode: 'dorian', spice: 'gentle', lead: 'string' }],
		['the-gate', 'The Shut Gate', { mode: 'minor', spice: 'gentle', lead: 'pizz' }],
		['the-watch', 'The Watch', { mode: 'phrygian', spice: 'lively', lead: 'mallet' }],
		['umar', "'Umar", { mode: 'mixolydian', spice: 'adventurous', lead: 'flute', meter: 3 }],
		['the-kick', 'The Kick', { mode: 'phrygian', spice: 'adventurous', lead: 'brass' }],
		['flying-shield', 'The Flying Shield', { mode: 'dorian', spice: 'lively', lead: 'vibes' }],
		['the-way-in', 'The Way In', { mode: 'minor', spice: 'gentle', lead: 'keys' }],
		['crawling', 'Crawling', { mode: 'dorian', spice: 'lively', lead: 'kalimba' }],
		['under-the-wall', 'Under the Wall', { mode: 'phrygian', spice: 'gentle', lead: 'harp' }]
	],
	draw
};
