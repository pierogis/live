// Strawberry Thief, William Morris (Merton Abbey, Surrey, 1883).
import { around, mod, round, type Canvas, type Point } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 28;
const PH = 26;
const COLS = 4;
const W = PW * COLS;
const H = PH * 3;

const PERCH = [
	'...........KKKK....',
	'..........KTTTTK...',
	'.........KTTTekTK..',
	'.........KTTTTTTKKK',
	'.........KTTTTTWK..',
	'........KTTTTTWWWK.',
	'......KKTTTTTWsWWWK',
	'....KKTYTYTTWWWsWWK',
	'..KKTYTYTYTWsWWWWWK',
	'KKTYTYTYTTWWWWsWWK.',
	'KTYTYTYTTWsWWWWWK..',
	'KTTKKKKTWWWWsWWK...',
	'.KK....KKWWWWKK....',
	'........KK.KK......',
	'.........K..K......'
];

const WINGS = [
	'.KK...................',
	'KYTK....KK............',
	'KTYTK..KYTK...........',
	'.KTYTK.KTYTK..........',
	'.KYTYTKKYTYTK...KKK...',
	'..KTYTYKTYTYTK.KTTTK..',
	'..KKTYTYTYTYTKKTTekTK.',
	'....KTYTYTYTKTTTTTTKKK',
	'.....KTYTYTKTTTTTWWK..',
	'......KTTTTTTTTTWWWK..',
	'....KKTTTTTTTTTWsWWK..',
	'..KKTTTTTTTTTWWWWsWK..',
	'KKTTTTTTTTTWsWWWWWK...',
	'KTTTKKKKTWWWWsWWK.....',
	'.KK....KKWWsWWKK......',
	'........KKKKK.........',
	'.........K..K.........'
];

const ROUND = [
	'......KKKKK.....',
	'.....KTTTTTK....',
	'....KTTTTekTK...',
	'....KTTTTTTTKKK.',
	'....KTTTTTTWWK..',
	'...KTTTTTTWWWWK.',
	'..KTYTYTTWWsWWWK',
	'.KTYTYTYWsWWWsWK',
	'.KTYTYTYWWWsWWWK',
	'KTYTYTYTWsWWWsWK',
	'KTTYTYTTWWWsWWK.',
	'KTTKKTTTKWsWWK..',
	'.KK..KKKKKKKK...',
	'........K..K....'
];

const PECK = [
	'KKK.................',
	'KTTKK...............',
	'.KTYTKK.............',
	'.KTTYTTKKK..........',
	'..KTYTYTTTKKKK......',
	'..KTTYTYTYTTTTKK....',
	'...KTTYTYTYTTTTTK...',
	'...KTTTTTTTTTTTTTK..',
	'....KWWWTTTTTTTTTTK.',
	'....KWsWWWsTTTTTTTK.',
	'.....KWWsWWWTTTekTK.',
	'......KWWWsWWTTTTTK.',
	'.......KKWWWWKTTTK..',
	'.........KKKK.KKK...',
	'..............KK....',
	'..............K.....'
];

const SING = [
	'.........KKKK.....',
	'........KTTTTKKKK.',
	'.......KTTekTK....',
	'.......KTTTTTKKK..',
	'.......KTTTTWK....',
	'......KTTTTWWK....',
	'......KTTTWWWWK...',
	'.....KTYTWsWWWK...',
	'.....KTYTWWWsWK...',
	'....KTYTYWsWWWK...',
	'....KTYTYWWWsWK...',
	'....KTYTYWsWWWK...',
	'...KTYTYTWWWWK....',
	'...KTTYTTKWWK.....',
	'..KTTKKKKKKK......',
	'.KTTK...K.K.......',
	'KTTK...K..K.......',
	'KKK...............'
];

const HOP = [
	'..........KKKK.....',
	'.........KTTTTK....',
	'........KTTTekTK...',
	'KK......KTTTTTTKKKK',
	'KTK.....KTTTTTWK...',
	'KTTK...KTTTTTWWWK..',
	'.KTTKKKTTTTTWsWWK..',
	'.KTYTYTYTTTWWWsWK..',
	'..KTYTYTYTWsWWWWK..',
	'...KTYTYTWWWWsWK...',
	'....KKTTTWsWWWK....',
	'......KKKKWWKK.....',
	'........K...K......',
	'........K...K......',
	'.......KK..KK......'
];

const BIRD = { K: 'K', T: 'T', W: 'W', s: 'K', k: 'K', e: 'W', Y: 'Y' };

const TULIP = [
	'........K........',
	'...K...KYK...K...',
	'..KRK..KYK..KRK..',
	'..KRRK.KYK.KRRK..',
	'.KRRYRKKYKKRYRRK.',
	'.KRRYRRKYKRRYRRK.',
	'KRRYRRRKYKRRRYRRK',
	'KRRYRRRKKKRRRYRRK',
	'KRYRRWRRRRRWRRYRK',
	'.KRYRRWRWRWRRYRK.',
	'.KRRYYRRRRRYYRRK.',
	'..KRRRYYYYYRRRK..',
	'...KKRRRRRRRKK...',
	'.....KKKKKKK.....',
	'.......KGK.......',
	'.......KGK.......'
];

const CARNATION = [
	'..R.R...R...R.R..',
	'.RYRYR.RYR.RYRYR.',
	'RYYYYRRYYYRRYYYYR',
	'RYWYYYRYWYRYYYWYR',
	'.RYYWYYYWYYYWYYR.',
	'.RYYYWYYWYYWYYYR.',
	'..RYYYWYWYWYYYR..',
	'..KKKKKKKKKKKKK..',
	'...KGLGLGLGLGK...',
	'....KGLGLGLGK....',
	'.....KGLGLGK.....',
	'......KGLGK......',
	'.......KGK.......'
];

const BELL = [
	'...L...',
	'..KLK..',
	'.KWBWK.',
	'KWBWBWK',
	'KBWBWBK',
	'KWBWBWK',
	'KBWBWBK',
	'KWBWBWK',
	'.WKWKW.'
];

const hash = (x: number, y: number) => {
	let h = (x * 374761393 + y * 668265263) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

function curve(pts: Point[], step = 0.05): Point[] {
	const out: Point[] = [];
	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[Math.max(0, i - 1)];
		const [p1, p2] = [pts[i], pts[i + 1]];
		const p3 = pts[Math.min(pts.length - 1, i + 2)];
		for (let t = 0; t < 1; t += step) {
			const t2 = t * t;
			const t3 = t2 * t;
			const f = (a: number, b: number, c: number, d: number) =>
				0.5 *
				(2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
			out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
		}
	}
	out.push(pts[pts.length - 1]);
	return out;
}

const LOBES: Point[][] = [
	[
		[55, -2],
		[44, 5],
		[30, 11],
		[22, 20],
		[28, 30],
		[42, 35],
		[55, 40]
	],
	[
		[55, 40],
		[42, 46],
		[28, 52],
		[22, 61],
		[28, 71],
		[42, 75],
		[55, 80]
	],
	[
		[-2, 36],
		[8, 31],
		[16, 24],
		[22, 20]
	],
	[
		[-2, 44],
		[8, 50],
		[16, 56],
		[22, 61]
	]
];

const LEAVES = [
	['L', 'G'],
	['W', 'B'],
	['G', 'L'],
	['B', 'I']
];

function draw(c: Canvas) {
	const { put, get, dots, stamp, line, disk } = c;

	const stem = (pts: Point[], col = 'L') => {
		let last: Point | null = null;
		for (const [fx, fy] of curve(pts)) {
			const x = round(fx);
			const y = round(fy);
			if (last && last[0] !== x && last[1] !== y) put(x, last[1], col);
			put(x, y, col);
			last = [x, y];
		}
	};
	const bigLeaf = (x: number, y: number, a: number, len: number, w = 2, scheme = 0) => {
		const [edge, fill] = LEAVES[scheme % LEAVES.length];
		const ca = Math.cos(a);
		const sa = Math.sin(a);
		const inside = (px: number, py: number) => {
			const u = (px - x) * ca + (py - y) * sa;
			const v = -(px - x) * sa + (py - y) * ca;
			if (u < 0 || u > len) return false;
			return Math.abs(v) <= w * Math.sin(Math.PI * (u / len) ** 0.8) + 0.25;
		};
		const r = Math.ceil(len) + 1;
		for (let py = Math.floor(y) - r; py <= y + r; py++) {
			for (let px = Math.floor(x) - r; px <= x + r; px++) {
				if (!inside(px, py)) continue;
				const rim = [
					[1, 0],
					[-1, 0],
					[0, 1],
					[0, -1]
				].some(([dx, dy]) => !inside(px + dx, py + dy));
				put(px, py, rim ? edge : fill);
			}
		}
		for (let t = 0.1; t <= 0.75; t += 0.08) put(x + ca * len * t, y + sa * len * t, edge);
	};
	const curl = (x: number, y: number, r: number, from: number, dir = 1, col = 'L') => {
		let last: Point | null = null;
		for (let t = 0; t < 1.6 * Math.PI; t += 0.08) {
			const rr = r * (1 - t / (2.2 * Math.PI));
			const px = round(x + Math.cos(from + dir * t) * rr);
			const py = round(y + Math.sin(from + dir * t) * rr);
			if (last && last[0] !== px && last[1] !== py) put(px, last[1], col);
			put(px, py, col);
			last = [px, py];
		}
	};
	const berry = (x: number, y: number, big = true, red = 'R') => {
		const key = { G: 'G', L: 'L', R: red, Y: red === 'R' ? 'Y' : 'G' };
		if (big) stamp(['.GLG.', 'RRYRR', 'RYRYR', '.RRR.', '..R..'], x - 2, y, key);
		else stamp(['.G.', 'RRR', 'RYR', '.R.'], x - 1, y, key);
	};
	const blossom = (x: number, y: number) => {
		stamp(['.W.', 'WYW', 'W.W'], x - 1, y - 1, { W: 'W', Y: 'Y' });
	};
	const flower = (x: number, y: number) => {
		for (const [px, py] of around(5, 1.6, x, y, -Math.PI / 2)) {
			disk(px, py, 0.8, 'W');
		}
		put(x, y, 'Y');
	};
	const trefoil = (x: number, y: number, a: number, scheme = 0) => {
		for (const d of [-0.9, 0, 0.9]) bigLeaf(x, y, a + d, d ? 6 : 7, 2.2, scheme);
	};

	const mirror = (pts: Point[]): Point[] => pts.map(([x, y]) => [W - 1 - x, y]);
	LOBES.forEach((l, i) => {
		const pts = curve(l, 0.01);
		let run = 4;
		let n = i;
		for (let k = 1; k < pts.length - 1; k++) {
			const [x, y] = pts[k];
			run += Math.hypot(x - pts[k - 1][0], y - pts[k - 1][1]);
			if (run < 7) continue;
			run = 0;
			n++;
			const [nx, ny] = pts[k + 1];
			const a = Math.atan2(ny - y, nx - x) + (n % 2 ? 0.75 : -0.75);
			const len = 8 + (n % 3);
			const scheme = [0, 2, 0, 3, 2, 1][n % 6];
			bigLeaf(x, y, a, len, 2.6, scheme);
			bigLeaf(W - 1 - x, y, Math.PI - a, len, 2.6, scheme);
		}
	});
	for (const l of LOBES) {
		stem(l);
		stem(mirror(l));
	}
	for (const [x, y, r, f, d] of [
		[18, 18, 3, 0, 1],
		[18, 63, 3, 0, -1],
		[46, 39, 2.6, Math.PI, 1],
		[8, 40, 3, -1.5, 1]
	] as const) {
		curl(x, y, r, f, d);
		curl(W - 1 - x, y, r, Math.PI - f, -d);
	}

	for (const [top, bottom] of [
		[9, 25],
		[60, 77]
	]) {
		line(55, top, 55, bottom, 'L');
		line(56, top + 2, 56, bottom, 'L');
		for (const [dx, dy] of [
			[-3, 2],
			[4, 1],
			[-4, 8],
			[5, 7]
		]) {
			line(55.5 + dx * 0.4, top + dy, 55.5 + dx * 0.7, top + dy + 1, 'L');
			berry(55.5 + dx, top + dy + 1, Math.abs(dx) > 3);
		}
		bigLeaf(55, top + 13, -2.6, 6, 1.8, 2);
		bigLeaf(56, top + 13, -0.5, 6, 1.8, 0);
		blossom(55, top - 1);
	}

	c.at(0, 0);
	stem([
		[1, 25],
		[6, 18],
		[10, 12],
		[16, 6],
		[24, 2]
	]);
	stem([
		[10, 12],
		[6, 6],
		[3, 1]
	]);
	trefoil(9, 13, 2.4, 0);
	trefoil(17, 7, -2.2, 2);
	trefoil(4, 20, -0.3, 1);
	for (const [x, y] of [
		[4, 7],
		[13, 9],
		[20, 5],
		[11, 16],
		[18, 14],
		[24, 9]
	])
		berry(x, y);
	berry(1, 13, false);
	berry(16, 20, false, 'L');
	for (const [x, y] of [
		[9, 3],
		[23, 18],
		[2, 2],
		[13, 23]
	])
		blossom(x, y);

	c.at(PW, 0);
	stem([
		[0, 22],
		[10, 19],
		[20, 21],
		[27, 18]
	]);
	stamp(PERCH, 2, 5, BIRD);
	line(21, 8, 23, 8, 'K');
	berry(22, 9);
	bigLeaf(8, 20, 1.9, 5, 1.8, 0);
	berry(17, 22, false);

	c.at(PW * 2, 0);
	stamp(WINGS, 4, 3, BIRD, true);
	stem([
		[0, 22],
		[10, 21],
		[20, 22],
		[27, 18]
	]);

	c.at(PW * 3, 0);
	const daisy = (cx: number, cy: number, r: number) => {
		for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) {
			for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
				const d = Math.hypot(x - cx, y - cy);
				const a = Math.atan2(y - cy, x - cx);
				const petal = mod(a / ((2 * Math.PI) / 11), 1);
				const edge = r - 1.6 * (1 - Math.sin(petal * Math.PI));
				if (d > edge + 0.5) continue;
				if (d > edge - 0.5 || (petal < 0.14 && d > r * 0.35)) put(x, y, 'K');
				else if (d < r * 0.3) put(x, y, (x + y) % 2 ? 'Y' : 'T');
				else if (d < r * 0.38) put(x, y, 'K');
				else put(x, y, d < r * 0.6 ? 'B' : 'W');
			}
		}
	};
	daisy(14, 11, 8.5);
	stem([
		[14, 20],
		[13, 24],
		[11, 27]
	]);
	bigLeaf(13, 23, 0.3, 7, 2, 2);
	bigLeaf(13, 22, 3.1, 6, 1.8, 1);

	c.at(0, PH);
	stem([
		[0, 19],
		[8, 19],
		[16, 21],
		[24, 18]
	]);
	stamp(ROUND, 5, 6, BIRD);
	berry(4, 20, false);
	berry(22, 19);

	c.at(PW, PH);
	stamp(TULIP, 6, 2, { K: 'K', R: 'R', Y: 'Y', W: 'W', G: 'G' });
	bigLeaf(14, 18, 2.5, 8, 2, 0);
	bigLeaf(15, 18, 0.5, 8, 2, 1);

	c.at(PW * 2, PH);
	bigLeaf(2, 25, -1.0, 10, 2.6, 0);
	bigLeaf(26, 25, -2.1, 9, 2.4, 2);
	stem([
		[1, 25],
		[3, 12],
		[9, 3],
		[18, 2],
		[25, 6],
		[26, 12]
	]);
	for (const [x, y, sx, sy] of [
		[6, 6, 7, 8],
		[14, 2, 15, 6],
		[22, 4, 22, 11]
	]) {
		line(x, y, sx, sy, 'L');
		stamp(BELL, sx - 3, sy, { L: 'L', K: 'K', B: 'B', W: 'W' });
	}

	c.at(PW * 3, PH);
	stem([
		[0, 18],
		[5, 18],
		[12, 17],
		[18, 21]
	]);
	stamp(PECK, 5, 3, BIRD, true);
	for (const [x, y] of [
		[4, 19],
		[8, 19],
		[12, 18]
	])
		berry(x, y);

	c.at(0, PH * 2);
	stamp(CARNATION, 5, 3, { R: 'R', Y: 'Y', W: 'W', K: 'K', G: 'G', L: 'L' });
	stem([
		[13, 15],
		[13, 20],
		[11, 25]
	]);
	bigLeaf(13, 19, 2.9, 9, 2, 0);
	bigLeaf(13, 20, 0.1, 9, 2, 3);

	c.at(PW, PH * 2);
	stamp(SING, 7, 3, BIRD);
	stem([
		[0, 21],
		[10, 21],
		[20, 22],
		[27, 20]
	]);
	berry(22, 7);
	c.at(PW * 2, PH * 2);
	stamp(HOP, 4, 6, BIRD, true);
	stem([
		[0, 21],
		[10, 21],
		[20, 22],
		[27, 20]
	]);

	c.at(PW * 3, PH * 2);
	stem([
		[26, 25],
		[21, 18],
		[16, 12],
		[10, 7],
		[3, 4]
	]);
	stem([
		[16, 12],
		[19, 6],
		[24, 2]
	]);
	stem([
		[21, 18],
		[13, 20],
		[6, 18]
	]);
	trefoil(17, 14, 0.9, 0);
	trefoil(12, 9, -2.2, 2);
	trefoil(22, 19, -0.6, 2);
	for (const [x, y] of [
		[4, 5],
		[13, 4],
		[24, 3],
		[7, 13],
		[6, 19],
		[14, 20]
	])
		flower(x, y);
	berry(19, 6, false, 'L');
	berry(10, 21, false, 'L');
	berry(25, 9);
	blossom(2, 23);
	blossom(26, 15);
	c.at();

	const open = (x: number, y: number, r: number) => {
		for (let dy = -r; dy <= r; dy++)
			for (let dx = -r; dx <= r; dx++) if (get(x + dx, y + dy) !== 'I') return false;
		return true;
	};
	for (let y = 3; y < H - 3; y += 2) {
		for (let x = 3; x < W - 3; x += 2) {
			if (!open(x, y, 3)) continue;
			const h = hash(x * 3, y + 11);
			if (h < 0.3) {
				line(x, y + 3, x, y - 1, 'L');
				bigLeaf(x, y + 1, -0.6 - Math.PI * (h < 0.15 ? 1 : 0), 4, 1.3, 0);
				bigLeaf(x, y, -2.5 + Math.PI * (h < 0.15 ? 1 : 0), 4, 1.3, 2);
			} else if (h < 0.55) {
				line(x - 1, y - 2, x, y, 'L');
				berry(x, y, false);
			} else if (h < 0.8) {
				blossom(x, y);
				dots('L', [x, y + 2], [x - 1, y + 3]);
			} else {
				bigLeaf(x - 2, y + 2, -0.8, 5, 1.4, 3);
			}
		}
	}
	for (let y = 1; y < H - 1; y++) {
		for (let x = 1; x < W - 1; x++) {
			if (!open(x, y, 2) || hash(y, x) > 0.6) continue;
			const h = hash(x + 7, y);
			if (h < 0.4) dots('W', [x, y - 1], [x - 1, y], [x + 1, y], [x, y + 1]);
			else if (h < 0.7) line(x - 1, y + 1, x + 1, y - 1, 'B');
			else dots('L', [x - 1, y], [x, y], [x + 1, y - 1]);
		}
	}
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const h = hash(x, y);
			if (get(x, y) !== 'I') continue;
			if (h < 0.05) put(x, y, 'W');
			else if (h < 0.08) put(x, y, 'B');
		}
	}
}

export const thief: Mural = {
	file: 'strawberry-thief',
	name: 'Strawberry Thief',
	prefix: 'strawberry-thief',
	notes: 'D',
	cols: COLS,
	difficulty: 0.15,
	panel: [PW, PH],
	palette: {
		I: '#1d2a5c',
		B: '#6d93cf',
		W: '#f1e8cf',
		G: '#2f6b3a',
		L: '#9fbb5a',
		R: '#c3302c',
		Y: '#e8b23a',
		T: '#93592d',
		K: '#1e140e'
	},
	ground: 'I',
	panels: [
		['ripe-berries', 'Ripe Berries', { mode: 'major', spice: 'gentle', lead: 'harp' }],
		['berry-thief', 'Berry Thief', { mode: 'mixolydian', spice: 'lively', lead: 'flute' }],
		['wings-up', 'Wings Up', { mode: 'lydian', spice: 'lively', lead: 'pizz' }],
		['daisy', 'The Daisy', { mode: 'pentatonic', spice: 'gentle', lead: 'kalimba' }],
		['resting-thrush', 'Resting Thrush', { mode: 'dorian', spice: 'gentle', lead: 'string' }],
		['red-tulip', 'Red Tulip', { mode: 'harmonic', spice: 'gentle', lead: 'vibes' }],
		['hanging-bells', 'Hanging Bells', { mode: 'dorian', spice: 'lively', lead: 'harp' }],
		[
			'pecking-thrush',
			'Pecking Thrush',
			{ mode: 'mixolydian', spice: 'adventurous', lead: 'mallet' }
		],
		['carnation', 'Carnation', { mode: 'lydian', spice: 'gentle', lead: 'keys' }],
		[
			'singing-thrush',
			'Singing Thrush',
			{ mode: 'minor-pentatonic', spice: 'lively', lead: 'flute' }
		],
		['hopping-thrush', 'Hopping Thrush', { mode: 'minor', spice: 'adventurous', lead: 'brass' }],
		['blossoms', 'Blossoms', { mode: 'major', spice: 'gentle', lead: 'kalimba' }]
	],
	draw
};
