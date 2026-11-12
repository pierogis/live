// Rakuchū-rakugai-zu (Kyoto, Japan, 1500s–1600s).
import type { Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 36;
const PH = 32;
const COLS = 6;
const W = COLS * PW;
const H = 3 * PH;

const MAP = `
	B2#4B102
	#8B30#4B40#5B21
	#10B5#5B17#5B6Y3B8#B6#6B11#4B2#3B2#4B10
	#10B3YB#5B17#6B4Y4BYBY4#4B3#7B5#3B8#11B9
	YB6Y9B2Y4B10#9Y9#2YB2Y3#3Y3B#6B5#6B3Y4B3#7B4#3B2
	B3#18Y3B7#6B3Y5#8B3#4Y7#17Y6B4#4B3#7
	Y4#18Y3#4B5#7Y3#9B4#2Y2B4Y4#15Y3#5BY5B4#6
	Y4#24B7#6Y4#8B4Y3#6Y11#7Y2#6Y6B5#5
	Y4#25B4#9Y4#6Y2B4#6Y6#3Y6#6Y2B#2B3Y6B7#2
	#2Y8#27Y3#Y6#4Y3B2Y2#4Y7#7Y5#5Y12#5YB2Y2
	#4Y7#11Y6B3Y23B3Y#4Y8#6Y6#2Y5#2Y6#8Y3
	#4Y16#5YB3#2B2Y21B#5Y8#10Y9#6Y6B#6Y2
	#4Y4#Y13#27Y3B#4Y11#9Y9#9Y4B6Y3
	#5Y2#11BY8#21Y4#3BY5#19Y4#20BY3
	#5Y4#10Y6#2Y6#9Y12B2Y5#19Y4#20Y4
	#5Y10#29Y4#4YB3Y8#9BY11#15Y8
	#4Y8#2B2#19B3#14YB4Y8#10Y9#24
	#4Y6#6Y4#9Y5B4#11Y6B2Y12#7Y9#3Y6#14
	#4Y4#23Y3#2Y6#4Y22#13Y13#14
	#22Y3#11Y12#3Y9#26Y5B2#7Y3#3Y2
	#23Y4#6Y2B#5Y6#7Y7#26Y4#9Y8
	#22Y4#4Y5#22Y2BY11#2Y5#9Y3#16Y2
	#19Y8#3Y5#24Y7B#2Y10#15Y3#11
	#19Y5#6Y6B#21Y6#3Y12#15BY7#6
	Y3#9Y2B#3Y4#8Y5B#6Y7#8Y3#10Y2BY6#6Y2B#5B5Y4#4Y2
	Y2#10Y5#12Y5#11Y6#26Y22B#5Y3
	Y4#9Y5#9Y6#13Y3#7Y3#2Y6#11Y21#9
	#2Y6#4Y10#2Y7#13Y6#4BY17#11Y7#2Y9#7
	#6Y9B3Y11#16Y5#3B3Y16B3#9B3Y#4Y4B3Y8B
	#7Y7B#5Y6B#10Y5#4Y15#5Y6B3#15B2Y16
	#9Y4#8BY5B#9Y5#4Y9BY5#7B2Y2B3#7B2#10Y5#4B5
	#10BY#10Y4#46B3#5Y4#10Y4#5B5
	Y3#4Y6#8Y4#55BYB#10Y4#5B6
	Y2B#2Y6#9BY4#56BY5#14B7
	Y9#13B4#3B4#47BY5B#18B3
	Y2BY5#7B3#23Y12#15B15Y3B2#2B3Y5#6B4
	B3Y4B2#7B3Y3#19Y14B#12B16#19B5
	B11Y#4B2Y4#10B12Y8B6#12B13Y2#18B3#2
	B5#3Y7B6#8B16#3BY2B12#8B11Y3#15B6#2
	B4#4BY7B5#8B7#14B3#22B8#15B8#2
	#9B18#B9#40B4#15B6#6
	#16B4#4B9#2B4#22B8#7B5#10B10#7
	B4#23B5#11B2#3B5#7B10#3B8#8B11#8
	B11#17B5#11B25#4B8#6B14#7
	B10#20B4#10B24#8B8#10B4#10
	B4#35B33#6B7#8B3#12
	B8#5B4#3B10#7B37#5B7#2B8#9B3
	B10#B63#4B30
`
	.trim()
	.split('\n')
	.map((row) =>
		row.trim().replace(/([#YB])(\d*)/g, (_, c: string, n: string) => c.repeat(Number(n || 1)))
	);

const KINDS = `
	GGGG..G..NGG.GGNN.
	GNGGRNGGNGGGGGNGRG
	GGGGGRGGNGGGGGGUGG
	AGGGGGTTTTTTGUGUUG
	PPPPGNTTTTTTNGUAUU
	PPPPGGTTTTTTGANATA
	PPPPGNTTTTTTNGGNGG
	PPPPGTTTTTTTTTGAGR
	GGGGNTTTTRTTTTNAGA
	.GGGGTTTTTTTTTGGNN
	GGGANGGGGNGGGNANNG
	.GGGGNG....NR.NGNN
`
	.trim()
	.split('\n')
	.map((row) => row.trim());

const hash = (a: number, b: number, n: number) => {
	let h = Math.imul(a ^ Math.imul(b, 0x9e3779b1), 0x85ebca6b);
	h ^= h >>> 13;
	return (h >>> 0) % n;
};

const HOKO = [
	'...D...',
	'..DDD..',
	'...N...',
	'...N...',
	'...N...',
	'..NNN..',
	'.NNNNN.',
	'.RRRRR.',
	'.RWRWR.',
	'.RRRRR.',
	'.N...N.'
];

function draw(c: Canvas) {
	const { put, rect, disk, line, ell, get } = c;
	const stamp = (p: string[], x: number, y: number) =>
		c.stamp(p, x, y, { N: 'N', R: 'R', D: 'D', W: 'W', T: 'T' });
	const inPalace = (x: number, y: number) =>
		y >= 29 && y <= 60 && x >= 12 - (y - 32) / 2 && x <= 49 - (y - 32) / 2;
	const kindAt = (x: number, y: number) => KINDS[Math.floor(y / 8)]?.[Math.floor(x / 12)];
	const town = (x: number, y: number) => {
		if (kindAt(x, y) === 'T' && Math.floor(y / 8) % 2 === 1) return true;
		const wy = y + hash(y >> 2, x >> 2, 3) - 1;
		if (kindAt(x + hash(x >> 2, y >> 2, 5) - 2, wy) !== 'T') return undefined;
		return Math.floor(wy / 8) % 2 === 1;
	};
	const scene = (x: number, y: number) => {
		const t = town(x, y);
		return t ?? (MAP[y >> 1]?.[x >> 1] === '#' || inPalace(x, y));
	};

	const person = (x: number, y: number) => {
		put(x, y, 'N');
		put(x, y + 1, 'WRUW'[hash(x, y, 4)]);
	};
	const house = (
		x: number,
		y: number,
		w: number,
		h: number,
		walls: number,
		roof: string,
		seed: number
	) => {
		const right = x + w + h;
		for (let i = 0; i < h; i++) {
			const left = x + h - i;
			rect(left, y + i, left + w - 1, y + i, roof);
			put(left + w, y + i, 'N');
			if (left + w < right) rect(left + w + 1, y + i, right, y + i, 'W');
		}
		if (roof === 'T' && seed % 3 === 0)
			for (let k = x + h + 1; k < x + h + w - 1; k += 3) put(k, y + 1, 'N');
		rect(x, y + h, x + w, y + h, 'N');
		rect(x + w + 1, y + h, right, y + h, 'W');
		for (let j = 1; j <= walls; j++) {
			rect(x, y + h + j, right, y + h + j, 'W');
			put(right, y + h + j, 'N');
			for (let k = x + 1 + (seed % 2); k < x + w; k += 2 + (seed % 3)) put(k, y + h + j, 'N');
		}
		return w + h + 1;
	};
	const hip = (x: number, y: number, w: number, h: number, roof: string) => {
		for (let i = 0; i < h; i++) rect(x - 2 * i, y + i, x + w + i, y + i, roof);
		rect(x - 2 * h + 2, y + h - 1, x + w + h - 1, y + h - 1, roof === 'A' ? 'U' : 'N');
		rect(x - 2 * h + 3, y + h, x + w + h - 2, y + h, 'W');
		for (let k = x - 2 * h + 4; k < x + w + h - 2; k += 3) put(k, y + h, roof === 'N' ? 'R' : 'N');
	};
	const pagoda = (x: number, y: number, tiers: number) => {
		line(x, y - 3, x, y - 1, 'Y');
		for (let i = 0; i < tiers; i++) {
			const yy = y + i * 4;
			const w = 2 + Math.floor(i / 2);
			rect(x - w, yy, x + w, yy, 'N');
			rect(x - w - 2, yy + 1, x + w + 2, yy + 1, 'N');
			rect(x - w + 1, yy + 2, x + w - 1, yy + 3, 'R');
		}
	};
	const clump = (x: number, y: number, s: number) => {
		disk(x, y, s, 'D');
		disk(x + s, y + 0.6, s * 0.8, 'D');
		disk(x - s, y + 0.8, s * 0.7, 'D');
	};
	const wall = (x0: number, y0: number, x1: number, y1: number) => {
		const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
		for (let i = 0; i <= n; i++) {
			const x = Math.round(x0 + ((x1 - x0) * i) / n);
			const y = Math.round(y0 + ((y1 - y0) * i) / n);
			put(x, y, 'N');
			put(x, y + 1, 'W');
		}
	};
	const palace = () => {
		const slant = (y: number) => Math.round((y - 32) / 2);
		for (let y = 33; y <= 57; y++) rect(16 - slant(y) + 1, y, 46 - slant(y) - 1, y, 'Y');
		for (let y = 46; y <= 52; y++) rect(31 - slant(y), y, 38 - slant(y), y, 'W');
		hip(27, 35, 9, 6, 'N');
		hip(41, 34, 2, 3, 'N');
		hip(18, 43, 5, 4, 'N');
		hip(37, 44, 3, 3, 'N');
		house(6, 49, 6, 2, 1, 'N', 1);
		house(20, 52, 4, 2, 1, 'N', 2);
		for (const [x, y] of [
			[29, 47],
			[32, 48],
			[30, 50],
			[33, 51]
		])
			person(x, y);
		wall(16, 32, 46, 32);
		wall(16, 32, 4, 56);
		wall(46, 32, 34, 56);
		wall(4, 57, 34, 57);
		clump(44, 56, 2);
		clump(8, 38, 2);
		clump(13, 33, 1.6);
	};

	KINDS.forEach((row, r) => {
		const y = r * 8;
		let cx = -1;
		[...row].forEach((kind, k) => {
			const x = k * 12;
			if (kind === 'T') {
				if (r % 2 === 0) return;
				if (cx < x) cx = x + hash(k, r, 4);
				while (cx < x + 12) {
					const seed = hash(cx, r, 97);
					const w = 4 + (seed % 5);
					const h = 2 + (seed % 2);
					const walls = 1 + (Math.floor(seed / 5) % 2);
					const top = y + 5 - h - walls;
					const roof = seed % 7 === 0 ? 'N' : 'T';
					const temple = seed % 6 === 0;
					const span = temple ? 13 : w + h + 1;
					let inside = 0;
					for (let xx = cx; xx < cx + span; xx++) if (scene(xx, top) && scene(xx, y + 5)) inside++;
					if (inside >= 0.75 * span && kindAt(cx + span - 1, y) === 'T') {
						if (temple) hip(cx + 6, y + 1, 3, 4, 'A');
						else house(cx, top + (seed % 3 === 1 ? 1 : 0), w, h, walls, roof, seed);
						if (seed % 2) person(cx + 1 + (seed % 3), y + 6);
						if (seed % 3 === 2 && !temple) clump(cx + span + 2, y + 3, 1.2);
					} else if (scene(cx + 3, y + 3)) {
						clump(cx + 3, y + 3, 1.6);
						cx += 7;
						continue;
					}
					cx += span + 2 + (seed % 3);
				}
			} else if (kind === 'N') {
				hip(x + 6, y + 1, 4, 5, 'N');
				clump(x + 12, y + 6, 1.6);
			} else if (kind === 'A') {
				hip(x + 6, y, 5, 6, 'A');
				clump(x - 1, y + 6, 1.6);
			} else if (kind === 'G') {
				if (r < 2) {
					ell(x + 6, y + 8, 10, 7, 'G', (_, yy) => yy <= y + 8);
					ell(x + 10, y + 8, 5, 5, 'D', (_, yy) => yy <= y + 8);
				} else {
					clump(x + 3, y + 4, 2);
					clump(x + 9, y + 5, 1.8);
				}
			} else if (kind === 'U') {
				for (let xx = x; xx < x + 12; xx++) {
					const cy = Math.round(y + 4 + 1.5 * Math.sin(xx / 7));
					rect(xx, cy - 2, xx, cy + 1, 'U');
				}
				if (k % 3 === 0) {
					for (let d = -4; d <= 4; d++) {
						put(x + 5 - d, y + 4 + d, 'N');
						rect(x + 6 - d, y + 4 + d, x + 7 - d, y + 4 + d, 'T');
						put(x + 8 - d, y + 4 + d, 'N');
					}
				}
			} else if (kind === 'R') {
				if (r < 2 || r === 7) pagoda(x + 6, y - 2, 3);
				else stamp(HOKO, x + 3, y - 3);
			}
		});
	});
	palace();

	for (let y = 3; y < H - 3; y += 4) {
		for (let x = 4 + (y % 12) / 2; x < W - 4; x += 6) {
			const kind = kindAt(x, y);
			if (kind === 'T' || kind === 'P' || hash(x, y, 8) === 0) continue;
			let open = true;
			for (let dy = -1; dy <= 3 && open; dy++) {
				for (let dx = -3; dx <= 3; dx++) if (get(x + dx, y + dy) !== 'B') open = false;
			}
			if (open) clump(x, y, 1.6);
		}
	}
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) if (!scene(x, y)) put(x, y, 'Y');
	}
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (
				get(x, y) === 'Y' &&
				!scene(x, y) &&
				(scene(x - 1, y) || scene(x + 1, y) || scene(x, y - 1) || scene(x, y + 1))
			) {
				put(x, y, 'B');
			}
		}
	}
}

export const rakuchu: Mural = {
	file: 'rakuchu-rakugai',
	name: 'Rakuchū-rakugai',
	prefix: 'rakuchu-rakugai',
	notes: 'D',
	difficulty: 0.25,
	cols: COLS,
	panel: [PW, PH],
	palette: {
		Y: '#f5dc7a',
		B: '#c48f2c',
		T: '#a99a7c',
		A: '#7f93b3',
		N: '#4e3a2c',
		U: '#1d2547',
		W: '#f1e9d4',
		G: '#4c8a3c',
		D: '#1d4a2e',
		R: '#c0392b'
	},
	ground: 'B',
	panels: [
		['western-hills', 'Western Hills', { mode: 'lydian', spice: 'gentle', lead: 'harp' }],
		['hill-temples', 'Hill Temples', { mode: 'pentatonic', spice: 'gentle', lead: 'string' }],
		['upper-river', 'The Upper River', { mode: 'dorian', spice: 'gentle', lead: 'flute' }],
		['upper-town', 'Upper Town', { mode: 'mixolydian', spice: 'gentle', lead: 'kalimba' }],
		['shimogamo', 'Shimogamo', { mode: 'dorian', spice: 'gentle', lead: 'string' }],
		['yasaka-pagoda', 'Yasaka Pagoda', { mode: 'pentatonic', spice: 'gentle', lead: 'mallet' }],
		['the-palace', 'The Palace', { mode: 'phrygian', spice: 'gentle', lead: 'harp' }],
		['town-roofs', 'Town Roofs', { mode: 'mixolydian', spice: 'lively', lead: 'pizz' }],
		['great-temple', 'The Great Temple', { mode: 'lydian', spice: 'gentle', lead: 'vibes' }],
		['gion-floats', 'Gion Floats', { mode: 'minor', spice: 'gentle', lead: 'pizz' }],
		['blue-roofs', 'Blue Roofs', { mode: 'minor-pentatonic', spice: 'gentle', lead: 'keys' }],
		['east-temples', 'East Temples', { mode: 'pentatonic', spice: 'lively', lead: 'mallet' }],
		['southern-groves', 'Southern Groves', { mode: 'dorian', spice: 'lively', lead: 'vibes' }],
		['muromachi', 'Muromachi Street', { mode: 'pentatonic', spice: 'gentle', lead: 'flute' }],
		['the-parade', 'The Parade', { mode: 'pentatonic', spice: 'lively', lead: 'kalimba' }],
		['gion-street', 'Gion Street', { mode: 'mixolydian', spice: 'lively', lead: 'brass' }],
		['temple-grove', 'Temple Grove', { mode: 'minor-pentatonic', spice: 'gentle', lead: 'flute' }],
		['red-pagoda', 'The Red Pagoda', { mode: 'minor-pentatonic', spice: 'lively', lead: 'kalimba' }]
	],
	draw
};
