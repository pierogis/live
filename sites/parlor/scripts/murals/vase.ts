/*
 * The Black-Figure Vase (Athens, about 540 BC): black figures painted on orange clay.
 * Two warriors play a board game under a grapevine, with a chariot on one side and a
 * ship on the other. Below them a line of animals walks around the foot.
 */
import type { Canvas } from './canvas.ts';
import type { Mural } from './mural.ts';

const PW = 18;
const PH = 16;
const COLS = 4;
const ROWS = 3;
const W = COLS * PW;

// ---------- top band patterns: each repeats every 6 dots ----------
const MEANDER = ['.#####', '.#....', '.#.###', '.#...#', '####.#'];
const BUDS = ['###rrr', '###rrr', '.#..r.'];

// A warrior bent over the board, facing right. `t` is his cloak, colored when stamped.
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
// How far a ray reaches to each side of its middle, from its tip down to its base.
const RAY = [0, 0, 1, 1, 2];

function draw(c: Canvas) {
	const { put, rect, disk, line, ring } = c;

	// What each mark in a pattern paints. `t` (a cloak) is set before each warrior.
	const key: Record<string, string> = { '#': 'K', r: 'R', c: 'C', o: 'O' };

	/**
	 * Paint a pattern with its top left at (x, y). `flip` mirrors it left to right;
	 * `swap` trades one color for another.
	 */
	const stamp = (
		pattern: string[],
		x: number,
		y: number,
		flip = false,
		swap?: Record<string, string>
	) => {
		const colors = Object.fromEntries(
			Object.entries(key).map(([mark, col]) => [mark, swap?.[col] ?? col])
		);
		c.stamp(pattern, x, y, colors, flip);
	};

	// ---------- top band: Greek key, then a chain of buds ----------
	rect(0, 0, W - 1, 4, 'C');
	for (let x = 0; x < W; x++) {
		for (let r = 0; r < 5; r++) {
			if (MEANDER[r][x % 6] === '#') put(x, r, 'K');
		}
	}
	// a black line under the key
	rect(0, 5, W - 1, 5, 'K');
	for (let x = 0; x < W; x++) {
		for (let r = 0; r < 3; r++) {
			const ch = BUDS[r][x % 6];
			if (ch in key) put(x, 6 + r, key[ch]);
		}
	}

	// ---------- ground under the scene ----------
	rect(0, 31, W - 1, 31, 'R');

	// ---------- grapevine arching over the players ----------
	// the stem steps up and down every 6 dots, with a joint at each step
	for (let x = 0; x < 54; x++) {
		put(x, Math.floor(x / 6) % 2 ? 10 : 11, 'K');
		if (x % 6 === 0) {
			put(x, 10, 'K');
			put(x, 11, 'K');
		}
	}
	/** A bunch of grapes: one row for each width, each centered under the first. */
	const bunch = (x: number, y: number, widths: number[]) => {
		widths.forEach((w, i) => {
			const o = Math.floor((widths[0] - w) / 2);
			rect(x + o, y + i, x + o + w - 1, y + i, 'R');
		});
	};

	// ---------- the players ----------
	key.t = 'R';
	/** A round shield resting on the ground: black rim, colored face, a square boss. */
	const shield = (cx: number, cy: number, face: string, boss: string) => {
		disk(cx, cy, 3.6, 'K');
		disk(cx, cy, 2.5, face);
		rect(cx - 1, cy - 1, cx + 1, cy + 1, boss);
	};
	// left player: cream cloak, cream shield
	shield(21, 27, 'C', 'R');
	// his spear, leaning, with its tip
	line(21, 11, 25, 22, 'K');
	put(22, 11, 'K');
	put(20, 12, 'K');
	key.t = 'C';
	stamp(WARRIOR, 23, 13);
	// right player: red cloak, red shield
	shield(50, 27, 'R', 'C');
	// his spear, leaning the other way
	line(50, 11, 46, 22, 'K');
	put(49, 11, 'K');
	put(51, 12, 'K');
	key.t = 'R';
	stamp(WARRIOR, 35, 13, true);
	// the block with the board on it
	rect(34, 26, 37, 30, 'R');
	rect(35, 27, 36, 28, 'K');
	rect(33, 25, 38, 25, 'C');
	// grapes hanging between the players
	bunch(34, 12, [4, 4, 2, 2]);

	// ---------- chariot, two horses and a driver ----------
	// the far horse, in red, shows only its head and back behind the near black one
	stamp(HORSE.slice(1, 9), 4, 16, false, { K: 'R', C: 'R' });
	stamp(HORSE, 6, 16);
	// wheel, car, driver in a long white robe
	disk(3, 27, 3.5, 'C');
	ring(3, 27, 3.5, 'R', 1.0);
	line(0, 27, 6, 27, 'K');
	line(3, 24, 3, 30, 'K');
	rect(1, 18, 3, 21, 'C');
	rect(1, 16, 2, 17, 'K');
	put(3, 17, 'K');
	rect(0, 21, 4, 23, 'R');
	rect(0, 22, 4, 22, 'K');
	// the reins
	line(4, 19, 6, 19, 'K');
	// over the chariot: more of the vine, a heavy bunch and a bird
	bunch(9, 12, [5, 5, 3, 1]);
	stamp(['##..##', '.####.', '..##..'], 1, 13);

	// ---------- ship with a square sail, an eye on the prow, dolphins ----------
	// mast and yard
	line(63, 9, 63, 20, 'K');
	line(56, 10, 70, 10, 'K');
	// the sail and its two red stripes
	rect(57, 11, 69, 18, 'C');
	rect(57, 13, 69, 13, 'R');
	rect(57, 16, 69, 16, 'R');
	stamp(HULL, 54, 19);
	// the eye on the prow
	rect(56, 21, 58, 22, 'C');
	put(57, 22, 'K');
	// a red stripe along the hull
	rect(60, 23, 69, 23, 'R');
	stamp(DOLPHIN, 54, 26);
	stamp(DOLPHIN, 63, 27);

	// ---------- bottom: animals in line, rays, the black foot ----------
	rect(0, 32, W - 1, 39, 'C');
	rect(0, 40, W - 1, 40, 'R');
	// one animal to a panel
	[LION, DEER, GOOSE, BOAR].forEach((animal, k) => stamp(animal, k * PW + 1, 32));
	// black rays pointing up from the foot
	for (let y = 41; y < 46; y++) {
		for (let x = 0; x < W; x++) {
			if (Math.abs((x % 6) - 2) <= RAY[y - 41]) put(x, y, 'K');
		}
	}
	rect(0, 46, W - 1, 47, 'K');
	// small fillers, as on the real friezes: a plant under the big beasts, a rosette behind the others
	for (const k of [0, 3]) stamp(['.r.', 'rrr'], k * PW + 7, 38);
	stamp(['.#.', '###'], PW + 6, 38);
	stamp(['.#.', '###'], 2 * PW + 13, 38);
	const rosettes: [k: number, dx: number][] = [
		[1, 5],
		[2, 4]
	];
	for (const [k, dx] of rosettes) stamp(['.r.', 'r#r', '.r.'], k * PW + dx, 32);
}

export const vase: Mural = {
	file: '00d-greek-vase',
	name: 'The Black-Figure Vase',
	prefix: 'greek-vase',
	notes: 'G',
	cols: COLS,
	rows: ROWS,
	panel: [PW, PH],
	// Black-figure ware: O orange clay, K black glaze, C cream slip, R dark red.
	palette: { O: '#e9852b', K: '#1d1613', C: '#f6e7c1', R: '#8f2618' },
	ground: 'O',
	panels: [
		['grapes-and-bird', 'Grapes and a Bird', { mode: 'major', spice: 'gentle', lead: 'harp' }],
		['spear-and-crest', 'Spear and Crest', { mode: 'dorian', spice: 'gentle', lead: 'kalimba' }],
		['under-the-vine', 'Under the Vine', { mode: 'mixolydian', spice: 'gentle', lead: 'flute' }],
		['striped-sail', 'The Striped Sail', { mode: 'major', spice: 'lively', lead: 'pizz' }],
		['chariot', 'The Chariot', { mode: 'mixolydian', spice: 'lively', lead: 'brass' }],
		['first-player', 'The First Player', { mode: 'dorian', spice: 'gentle', lead: 'harp' }],
		['second-player', 'The Second Player', { mode: 'minor', spice: 'gentle', lead: 'string' }],
		[
			'ship-with-an-eye',
			'Ship with an Eye',
			{ mode: 'dorian', spice: 'adventurous', lead: 'flute', meter: 3 }
		],
		['lion', 'The Lion', { mode: 'minor', spice: 'lively', lead: 'mallet' }],
		['deer', 'The Deer', { mode: 'major', spice: 'gentle', lead: 'vibes' }],
		['goose', 'The Goose', { mode: 'mixolydian', spice: 'lively', lead: 'kalimba' }],
		['boar', 'The Boar', { mode: 'dorian', spice: 'lively', lead: 'keys' }]
	],
	draw
};
