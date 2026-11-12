// Black-Figure Vase (Athens, about 540 BC).
import { points, type Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 18;
const PH = 16;
const COLS = 4;
const W = COLS * PW;

const MEANDER = ['.#####', '.#....', '.#.###', '.#...#', '####.#'];
const BUDS = ['###rrr', '###rrr', '.#..r.'];

const WARRIOR = [
	'.....rrrr....',
	'...rrrrrrr...',
	'..rrrrrrrr...',
	'.rrr#####....',
	'.rr#######...',
	'.rr####c##...',
	'.rr.#######..',
	'.r...####....',
	'...#######...',
	'..#tttt####..',
	'.#tttt######.',
	'.#ttt....###.',
	'.#ttt........',
	'.#####.......',
	'.#########...',
	'.#########...',
	'..###..ccc...',
	'.####.####...'
];
const HORSE = [
	'.......##...',
	'.....######.',
	'.....###.###',
	'...c####..##',
	'..c#####....',
	'.########...',
	'##########..',
	'##########..',
	'##########..',
	'#.###..###..',
	'#.##....##..',
	'..##....##..',
	'..##....##..',
	'..##....##..',
	'..###...###.'
];
const HULL = [
	'#...............##',
	'##..............##',
	'##################',
	'.#################',
	'..###############.',
	'...#############..',
	'.....#########....'
];
const DOLPHIN = ['...#...#', '#######.', '.####..#'];
const LION = [
	'............rrr.',
	'#..........rrrr#',
	'#....#####rrrr##',
	'.#########rrrr#.',
	'..########rrr...',
	'..##.....##.....',
	'..##.....##.....',
	'.###....###.....'
];
const DEER = [
	'..........#.#.#.',
	'...........###..',
	'..........rrr...',
	'.r........rrrr..',
	'.rrrrrrrrrrr....',
	'.rrrrrrrrrrr....',
	'.rr......rr.....',
	'.##......##.....'
];
const GOOSE = [
	'..........##....',
	'.........###rr..',
	'.........##.....',
	'.#.......##.....',
	'.#######rr#.....',
	'.####rrrrr#.....',
	'..########......',
	'....rr.rr.......'
];
const BOAR = [
	'................',
	'....rrrrrrr.....',
	'...#########....',
	'..###########.#.',
	'.#.############.',
	'...#########....',
	'...##....##.....',
	'..###...###.....'
];
const RAY = [0, 0, 1, 1, 2];

function draw(c: Canvas) {
	const { put, rect, disk, line, ring } = c;

	const key: Record<string, string> = { '#': 'K', r: 'R', c: 'C' };
	const stamp = (pattern: string[], x: number, y: number, flip = false, colors = key) =>
		c.stamp(pattern, x, y, colors, flip);

	rect(0, 0, W - 1, 4, 'C');
	for (let x = 0; x < W; x++) {
		for (let r = 0; r < 5; r++) {
			if (MEANDER[r][x % 6] === '#') put(x, r, 'K');
		}
	}
	rect(0, 5, W - 1, 5, 'K');
	for (let x = 0; x < W; x++) {
		for (let r = 0; r < 3; r++) {
			const ch = BUDS[r][x % 6];
			if (ch in key) put(x, 6 + r, key[ch]);
		}
	}

	rect(0, 31, W - 1, 31, 'R');
	for (let x = 0; x < 54; x++) {
		put(x, Math.floor(x / 6) % 2 ? 10 : 11, 'K');
		if (x % 6 === 0) {
			put(x, 10, 'K');
			put(x, 11, 'K');
		}
	}
	const bunch = (x: number, y: number, widths: number[]) => {
		widths.forEach((w, i) => {
			const o = Math.floor((widths[0] - w) / 2);
			rect(x + o, y + i, x + o + w - 1, y + i, 'R');
		});
	};

	const shield = (cx: number, cy: number, face: string, boss: string) => {
		disk(cx, cy, 3.6, 'K');
		disk(cx, cy, 2.5, face);
		rect(cx - 1, cy - 1, cx + 1, cy + 1, boss);
	};
	shield(21, 27, 'C', 'R');
	line(21, 11, 25, 22, 'K');
	put(22, 11, 'K');
	put(20, 12, 'K');
	stamp(WARRIOR, 23, 13, false, { ...key, t: 'C' });
	shield(50, 27, 'R', 'C');
	line(50, 11, 46, 22, 'K');
	put(49, 11, 'K');
	put(51, 12, 'K');
	stamp(WARRIOR, 35, 13, true, { ...key, t: 'R' });
	rect(34, 26, 37, 30, 'R');
	rect(35, 27, 36, 28, 'K');
	rect(33, 25, 38, 25, 'C');
	bunch(34, 12, [4, 4, 2, 2]);

	stamp(HORSE.slice(1, 9), 4, 16, false, { '#': 'R', c: 'R' });
	stamp(HORSE, 6, 16);
	disk(3, 27, 3.5, 'C');
	ring(3, 27, 3.5, 'R', 1.0);
	line(0, 27, 6, 27, 'K');
	line(3, 24, 3, 30, 'K');
	rect(1, 18, 3, 21, 'C');
	rect(1, 16, 2, 17, 'K');
	put(3, 17, 'K');
	rect(0, 21, 4, 23, 'R');
	rect(0, 22, 4, 22, 'K');
	line(4, 19, 6, 19, 'K');
	bunch(9, 12, [5, 5, 3, 1]);
	stamp(['##..##', '.####.', '..##..'], 1, 13);

	line(63, 9, 63, 20, 'K');
	line(56, 10, 70, 10, 'K');
	rect(57, 11, 69, 18, 'C');
	rect(57, 13, 69, 13, 'R');
	rect(57, 16, 69, 16, 'R');
	stamp(HULL, 54, 19);
	rect(56, 21, 58, 22, 'C');
	put(57, 22, 'K');
	rect(60, 23, 69, 23, 'R');
	stamp(DOLPHIN, 54, 26);
	stamp(DOLPHIN, 63, 27);

	rect(0, 32, W - 1, 39, 'C');
	rect(0, 40, W - 1, 40, 'R');
	[LION, DEER, GOOSE, BOAR].forEach((animal, k) => stamp(animal, k * PW + 1, 32));
	for (let y = 41; y < 46; y++) {
		for (let x = 0; x < W; x++) {
			if (Math.abs((x % 6) - 2) <= RAY[y - 41]) put(x, y, 'K');
		}
	}
	rect(0, 46, W - 1, 47, 'K');
	for (const k of [0, 3]) stamp(['.r.', 'rrr'], k * PW + 7, 38);
	stamp(['.#.', '###'], PW + 6, 38);
	stamp(['.#.', '###'], 2 * PW + 13, 38);
	for (const [k, dx] of points('1,5 2,4')) stamp(['.r.', 'r#r', '.r.'], k * PW + dx, 32);
}

export const vase: Mural = {
	file: 'greek-vase',
	name: 'Black-Figure Vase',
	prefix: 'greek-vase',
	notes: 'G',
	difficulty: 0.35,
	cols: COLS,
	panel: [PW, PH],
	palette: { O: '#e9852b', K: '#1d1613', C: '#f6e7c1', R: '#8f2618' },
	ground: 'O',
	panels: [
		['grapes-and-bird', 'Grapes and a Bird', { mode: 'lydian', spice: 'gentle', lead: 'harp' }],
		['spear-and-crest', 'Spear and Crest', { mode: 'dorian', spice: 'gentle', lead: 'kalimba' }],
		['under-the-vine', 'Under the Vine', { mode: 'mixolydian', spice: 'gentle', lead: 'flute' }],
		['striped-sail', 'The Striped Sail', { mode: 'phrygian', spice: 'lively', lead: 'pizz' }],
		['chariot', 'The Chariot', { mode: 'mixolydian', spice: 'lively', lead: 'brass' }],
		['first-player', 'The First Player', { mode: 'dorian', spice: 'gentle', lead: 'harp' }],
		['second-player', 'The Second Player', { mode: 'minor', spice: 'gentle', lead: 'string' }],
		[
			'ship-with-an-eye',
			'Ship with an Eye',
			{ mode: 'dorian', spice: 'adventurous', lead: 'flute', meter: 3 }
		],
		['lion', 'The Lion', { mode: 'minor', spice: 'lively', lead: 'mallet' }],
		['deer', 'The Deer', { mode: 'lydian', spice: 'gentle', lead: 'vibes' }],
		['goose', 'The Goose', { mode: 'mixolydian', spice: 'lively', lead: 'kalimba' }],
		['boar', 'The Boar', { mode: 'phrygian', spice: 'lively', lead: 'keys' }]
	],
	draw
};
