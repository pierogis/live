// The Surname-i Vehbi (Istanbul, about 1720): the book of the fifteen-day festival for the
// sons of Sultan Ahmed III, painted by Levni and his workshop in flat bright colors with
// crisp outlines and no shadows. Here the whole Hippodrome is one crowded square seen from
// above: the sultan's tent, his viziers and horse, the Egyptian obelisk with rope walkers
// strung to the Walled Obelisk, tumblers, a sugar garden and two wedding palms carried on
// poles, the band with its drum camel, a ship on wheels, the stands of spectators and the
// janissaries with their soup cauldron. Behind it all, fireworks at night over the Golden
// Horn. 4 by 3 panels of 32 by 30.
import { div, type Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 32;
const PH = 30;
const W = PW * 4;
const H = PH * 3;

/** Letters swapped when painting a pattern. */
type Map = Record<string, string>;

// hats, worn above a figure's face; t is the hat's color
const HATS: Record<string, string[]> = {
	turban: ['.ttt.', 'ttttt'],
	// a vizier's tall kavuk with its slanting gold band
	kavuk: ['.ttt.', '.ttt.', '.Ytt.', '.tYt.', 'ttttt'],
	// a pointed felt cap
	cap: ['..t..', '.ttt.', '.ttt.']
};

// the sultan sits cross-legged: a great white turban with a jewelled plume, black beard,
// a fur collar over a gold robe
const SULTAN = [
	'.....YRY.....',
	'......Y......',
	'....KWWWK....',
	'...KWWWWWK...',
	'..KWWWWWWWK..',
	'..KWWWWWWWK..',
	'...KFFFFFK...',
	'...KFKFKFK...',
	'...KFFFFFK...',
	'....KKKKK....',
	'..WWWKKKWWW..',
	'.WYYRWKWRYYW.',
	'KYYRYYWYYRYYK',
	'KYRYRYWYRYRYK',
	'KYYRYYWYYRYYK',
	'KKKKKKKKKKKKK'
];

// a janissary marching left: tall white bork falling behind, gold spoon holder, coat r
const JANISSARY = [
	'.WW..',
	'.WWW.',
	'.WWW.',
	'YWWWW',
	'FFWWW',
	'FKWWW',
	'rrrrW',
	'rYrr.',
	'rrrr.',
	'rrrr.',
	'.r.r.',
	'.K.K.'
];

// a white horse in a jewelled saddle cloth, a red plume, facing left
const HORSE = [
	'..R..............',
	'.KKK.............',
	'KWWWK............',
	'KWKWWK...........',
	'.KWWWWK..........',
	'..KKWWWKKKKKKKKK.',
	'....KWRYRYRYRYWWK',
	'....KWYRYRYRYRWWK',
	'....KWRYRYRYRYWWK',
	'....KWWWWWWWWWWWK',
	'....KWK.....KWWK.',
	'....KWK......KWK.',
	'....KK.......KK..'
];

// a camel with a long neck and a hump, facing left
const CAMEL = [
	'..KKK.............',
	'.KTTTK............',
	'KTKTTK............',
	'.KKTTK............',
	'...KTK.....KKK....',
	'...KTK...KKTTTKK..',
	'...KTTK.KTTTTTTTK.',
	'....KTTKTTTTTTTTTK',
	'....KTTTTTTTTTTTTK',
	'.....KTTTTTTTTTTK.',
	'......KTTKKKKKTTK.',
	'......KTK.....KTK.',
	'......KTK.....KTK.',
	'......KTK.....KTK.',
	'......KK......KK..'
];

function draw(c: Canvas) {
	const { put, rect, disk, line, dots, stamp } = c;

	/** Paint a pattern in its own letters, some swapped by `map`; '.' paints nothing. */
	const art = (p: string[], x: number, y: number, map: Map = {}, flip = false) => {
		const key: Map = {};
		for (const ch of p.join('')) if (ch !== '.') key[ch] = map[ch] ?? ch;
		stamp(p, x, y, key, flip);
	};
	/** Panel k's top left corner becomes (0, 0). */
	const panel = (k: number) => c.at((k % 4) * PW, div(k, 4) * PH);

	// a standing figure 5 wide centered on x, feet on row y: caftan r open over u
	const person = (
		x: number,
		y: number,
		r: string,
		u: string,
		{ hat = 'turban', t = 'W', beard = false } = {}
	) => {
		const body = ['.FFF.', beard ? '.KKK.' : '..F..'];
		body.push('rrurr', 'rrurr', 'rrurr', 'rrurr', 'rrurr', '.K.K.');
		const h = HATS[hat];
		art([...h, ...body], x - 2, y - h.length - 7, { t, r, u });
	};
	// a figure seen from above, sitting: turban, face, a robe spread round
	const sitter = (x: number, y: number, r: string, hat: string) => {
		put(x, y - 3, hat);
		put(x, y - 2, 'F');
		dots(r, [x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 1, y], [x + 1, y]);
		put(x, y, r === 'Y' ? 'R' : 'Y');
	};
	// a rug: dark edge, a border of bars, a field with little medallions
	const rug = (x0: number, y0: number, x1: number, y1: number, b: string, f: string, d: string) => {
		rect(x0, y0, x1, y1, 'K');
		for (let y = y0 + 1; y < y1; y++) {
			for (let x = x0 + 1; x < x1; x++) {
				const edge = x === x0 + 1 || x === x1 - 1 || y === y0 + 1 || y === y1 - 1;
				if (edge) put(x, y, (x + y) % 3 === 0 ? 'Y' : b);
				else put(x, y, (x + y) % 4 === 0 && (x - y) % 4 === 0 ? d : f);
			}
		}
	};
	// a firework: rays from the middle, tipped with sparks
	const burst = (cx: number, cy: number, r: number, a: string, b: string) => {
		for (let k = 0; k < 8; k++) {
			const t = (k * Math.PI) / 4;
			const dx = Math.cos(t);
			const dy = Math.sin(t);
			line(cx + dx, cy + dy, cx + dx * r, cy + dy * r, a);
			put(cx + dx * (r + 1) + 0.5, cy + dy * (r + 1) + 0.5, b);
		}
		put(cx, cy, 'W');
	};
	// a man on the rope holding a balancing pole, feet on row y
	const walker = (x: number, y: number, r: string, u: string, t: string) => {
		person(x, y, r, u, { t });
		line(x - 7, y - 5, x + 7, y - 5, 'K');
		dots('Y', [x - 8, y - 5], [x + 8, y - 5]);
	};
	// the rope from the obelisk to the Walled Obelisk: its row at column x
	const ry = (x: number) => {
		const t = (x - 47) / 32;
		return Math.round(14 - t + Math.sin(t * Math.PI) * 6);
	};

	// ---------- the square: green, set with tufts of grass ----------
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const u = (x + (div(y, 5) % 2) * 4) % 8;
			const v = y % 5;
			const tuft = (v === 2 && (u === 0 || u === 2)) || (v === 3 && u === 1);
			c.g[y][x] = tuft ? 'L' : 'G';
			if (v === 1 && u === 1 && (x + y) % 3 === 0) c.g[y][x] = 'R';
		}
	}

	// ---------- the night along the top: stars over the palaces round the Hippodrome ----------
	for (let y = 0; y < 7; y++) {
		for (let x = 0; x < W; x++) c.g[y][x] = (x * 13 + y * 29) % 23 === 0 ? 'Y' : 'N';
	}
	for (let x = 0; x < 96; x++) {
		// a long palace front: purple, a row of lit windows, a dome here and there
		put(x, 4, 'M');
		put(x, 5, x % 3 === 1 ? 'Y' : 'M');
		put(x, 6, 'K');
		const d = x % 16;
		if (d >= 5 && d <= 9) put(x, 3, 'M');
		if (d >= 6 && d <= 8) put(x, 2, 'M');
		if (d === 7) put(x, 1, 'Y');
	}
	burst(26, 2, 1, 'R', 'W');
	burst(90, 2, 1, 'O', 'W');

	// ---------- 1. the sultan in his tent ----------
	panel(0);
	// the canopy: red netted in gold, peaked, with a gold finial
	const hw = [0.5, 1.5, 3, 5, 7, 9, 11, 12.5, 13.5];
	for (let y = 2; y <= 10; y++) {
		const x0 = Math.round(15.5 - hw[y - 2]);
		const x1 = Math.round(15.5 + hw[y - 2]);
		for (let x = x0; x <= x1; x++) {
			const edge = x === x0 || x === x1 || y === 2;
			put(x, y, edge ? 'K' : (x + y) % 4 === 0 || (x - y + 40) % 4 === 0 ? 'Y' : 'R');
		}
	}
	dots('Y', [15, 1], [16, 1], [15, 0]);
	// the valance: blue and gold scallops
	rect(2, 11, 29, 11, 'K');
	for (let x = 2; x <= 29; x++) {
		put(x, 12, x % 3 === 0 ? 'Y' : 'B');
		if (x % 3 !== 0) put(x, 13, x % 3 === 1 ? 'B' : 'K');
	}
	// inside: a blue wall with the three-ball pattern in white and turquoise waves
	for (let y = 14; y <= 26; y++) {
		for (let x = 4; x <= 27; x++) {
			const u = x % 6;
			const v = y % 5;
			let k = 'B';
			if ((u === 1 && v === 0) || (u === 3 && v === 0) || (u === 2 && v === 1)) k = 'W';
			if (v === 3 && (u === 4 || u === 5)) k = 'C';
			put(x, y, k);
		}
	}
	// gold poles at the corners, the side curtains tied back
	for (const x of [3, 28]) {
		line(x, 12, x, 28, 'Y');
		put(x, 29, 'K');
	}
	for (let k = 0; k < 7; k++) {
		for (let j = 0; j <= 6 - k; j++) {
			put(4 + j, 14 + k, (j + k) % 2 ? 'R' : 'O');
			put(27 - j, 14 + k, (j + k) % 2 ? 'R' : 'O');
		}
	}
	// the throne: a gold dais, a red cushion behind
	rect(8, 21, 23, 27, 'K');
	for (let y = 22; y <= 26; y++) for (let x = 9; x <= 22; x++) put(x, y, (x + y) % 2 ? 'Y' : 'O');
	disk(15.5, 17, 5.5, 'R');
	art(SULTAN, 9, 10);
	// a sword bearer and the keeper of the sultan's bow case
	person(5, 27, 'M', 'Y', { hat: 'cap', t: 'R' });
	person(26, 27, 'C', 'R', { hat: 'cap', t: 'R' });
	line(8, 18, 8, 24, 'W');
	// the rug laid before the tent
	rug(3, 27, 28, 34, 'R', 'B', 'Y');

	// ---------- 2. the obelisk, a climber on the slanting rope ----------
	panel(1);
	line(10, 16, 1, 29, 'Y');
	dots('K', [0, 29], [2, 29]);
	person(5, 22, 'R', 'Y', { hat: 'cap', t: 'W' });
	line(1, 17, 9, 17, 'K');
	// friends watching from a rug
	rug(18, 20, 31, 29, 'B', 'R', 'W');
	for (const [x, y, r, t] of [
		[21, 25, 'C', 'W'],
		[24, 25, 'M', 'Y'],
		[27, 25, 'O', 'W'],
		[21, 28, 'W', 'R'],
		[24, 28, 'G', 'W'],
		[27, 28, 'Y', 'B']
	] as const)
		sitter(x, y, r, t);

	// ---------- the obelisk itself, top in panel 2 and its foot in panel 6 ----------
	c.at();
	// the pyramid tip
	dots('K', [44, 6], [45, 6]);
	rect(43, 7, 46, 7, 'K');
	rect(44, 7, 45, 8, 'Y');
	dots('K', [43, 8], [46, 8]);
	for (let y = 9; y <= 49; y++) {
		const half = 2 + (y - 9) / 28;
		const x0 = Math.round(44.5 - half);
		const x1 = Math.round(44.5 + half) - 1;
		for (let x = x0; x <= x1; x++) put(x, y, x === x0 || x === x1 ? 'K' : 'P');
		// the carved signs: a dark mark or two each row
		const s = (y * 7) % 5;
		if (y % 3 !== 0 && s < 3) put(x0 + 1 + s, y, 'K');
	}
	// four bronze blocks under it, then the carved marble base
	rect(40, 50, 49, 50, 'K');
	dots('Y', [41, 50], [42, 50], [47, 50], [48, 50]);
	rect(38, 51, 51, 58, 'K');
	rect(39, 52, 50, 57, 'W');
	// the emperor's box on the base: a row of little faces under an arch
	rect(40, 53, 49, 53, 'T');
	for (const x of [41, 43, 45, 47, 49]) {
		put(x, 55, 'F');
		put(x, 56, 'B');
	}
	put(45, 54, 'Y');
	rect(37, 59, 52, 59, 'K');

	// ---------- the rope across the square, a walker in each panel ----------
	for (let x = 47; x <= 79; x++) put(x, ry(x), 'Y');
	walker(56, ry(56) - 1, 'B', 'Y', 'W');
	walker(71, ry(71) - 1, 'G', 'W', 'R');

	// ---------- 3. the Walled Obelisk, a tent, a juggler ----------
	panel(2);
	// rough stone laid in courses
	for (let y = 13; y <= 28; y++) {
		const x0 = 15 - (y > 22 ? 1 : 0);
		const x1 = 20 + (y > 22 ? 1 : 0);
		for (let x = x0; x <= x1; x++) {
			const joint = y % 2 === 0 || (x + (y % 4 === 1 ? 0 : 2)) % 4 === 0;
			put(x, y, x === x0 || x === x1 || joint ? 'K' : 'T');
		}
	}
	dots('K', [17, 11], [18, 11]);
	rect(16, 12, 19, 12, 'K');
	rect(13, 29, 22, 29, 'K');
	// a striped tent
	for (let y = 21; y <= 29; y++) {
		const half = Math.min(6, (y - 21) * 0.9 + 0.5);
		for (let x = Math.round(5 - half); x <= Math.round(5 + half); x++) {
			put(x, y, y === 21 ? 'K' : x % 2 ? 'W' : 'R');
		}
	}
	dots('Y', [5, 20], [5, 19]);
	rect(0, 26, 11, 26, 'K');
	// a juggler and the balls in the air
	person(27, 29, 'M', 'W', { t: 'O' });
	dots('Y', [24, 15], [27, 13], [30, 15]);
	// a boy beating a tambourine for him
	art(['.R.', 'RRR', '.F.', 'BYB', 'BBB', 'K.K'], 22, 24);
	c.ring(24.5, 25, 1.2, 'Y');

	// ---------- 4. fireworks over the Golden Horn ----------
	panel(3);
	// the sky right down to the far shore
	for (let y = 7; y <= 12; y++) {
		for (let x = 0; x < PW; x++) put(x, y, (x * 13 + y * 29) % 23 === 0 ? 'Y' : 'N');
	}
	// the far shore: Galata's houses and its round tower
	for (let x = 0; x < PW; x++) {
		const roof = 12 - ((x % 5) % 3 === 0 ? 1 : 0);
		for (let y = roof; y <= 14; y++) put(x, y, y === 13 && x % 2 ? 'Y' : 'M');
		put(x, 15, 'K');
	}
	rect(21, 6, 24, 14, 'M');
	dots('Y', [22, 8], [23, 10], [22, 12]);
	rect(20, 6, 25, 6, 'K');
	dots('K', [21, 5], [24, 5], [22, 4], [23, 4], [22, 3], [23, 3]);
	// the water: dark bands with pale ripples
	for (let y = 16; y <= 26; y++) {
		for (let x = 0; x < PW; x++) {
			const wave = (x + y * 3) % 8;
			put(x, y, wave === 0 && y % 2 === 0 ? 'W' : y % 2 && wave < 3 ? 'B' : 'N');
		}
	}
	// a fire castle on a raft: towers, a burning wheel, rockets rising from it
	rect(5, 23, 19, 25, 'K');
	for (let x = 6; x <= 18; x++) put(x, 24, x % 2 ? 'T' : 'O');
	rect(7, 17, 17, 22, 'K');
	for (let y = 18; y <= 21; y++) for (let x = 8; x <= 16; x++) put(x, y, (x + y) % 2 ? 'R' : 'Y');
	for (const x of [7, 17]) rect(x - 1, 15, x + 1, 17, 'K');
	dots('O', [6, 14], [8, 14], [16, 14], [18, 14]);
	c.ring(12, 15, 2, 'O');
	put(12, 15, 'W');
	for (const [x0, y0, x1, y1] of [
		[7, 13, 4, 6],
		[12, 12, 13, 5],
		[17, 13, 28, 7]
	]) {
		for (let k = 0; k <= 6; k++) {
			put(x0 + ((x1 - x0) * k) / 6, y0 + ((y1 - y0) * k) / 6, k % 2 ? 'Y' : 'O');
		}
	}
	burst(4, 4, 3, 'R', 'Y');
	burst(13, 2, 2, 'W', 'O');
	burst(28, 3, 2.5, 'C', 'Y');
	// boats with oarsmen
	for (const x of [21, 24]) {
		const y = x === 21 ? 18 : 22;
		rect(x, y + 1, x + 7, y + 1, 'K');
		rect(x + 1, y + 2, x + 6, y + 2, 'T');
		dots('W', [x + 2, y], [x + 5, y]);
		dots('F', [x + 2, y - 1], [x + 5, y - 1]);
	}
	// a minaret on the near shore, the quay wall
	for (let y = 3; y <= 29; y++) dots('K', [0, y], [2, y]);
	rect(1, 3, 1, 29, 'W');
	art(['.K.', 'KBK', 'KBK'], 0, 0);
	for (const y of [9, 19]) rect(-1, y, 3, y, 'Y');
	for (let x = 3; x < PW; x++) {
		put(x, 27, 'K');
		put(x, 28, x % 3 === 0 ? 'K' : 'T');
		put(x, 29, 'K');
	}

	// ---------- 5. the viziers and the sultan's horse ----------
	panel(4);
	for (const [k, r, u] of [
		[0, 'R', 'Y'],
		[1, 'M', 'C'],
		[2, 'B', 'O'],
		[3, 'O', 'B'],
		[4, 'C', 'M']
	] as const) {
		person(3 + k * 6, 17, r, u, { hat: 'kavuk', beard: true });
		// fur collars
		dots('W', [1 + k * 6, 10], [5 + k * 6, 10]);
	}
	art(HORSE, 9, 17);
	// the groom with the reins
	person(4, 29, 'R', 'W', { hat: 'cap', t: 'Y' });
	line(7, 23, 10, 21, 'K');
	// the young princes, plumes in their turbans
	for (const [x, r] of [
		[27, 'P'],
		[30, 'C']
	] as const) {
		art(['.Y.', 'WWW', '.F.', 'rrr', 'rYr', 'rrr', 'K.K'], x - 1, 22, { r });
	}

	// ---------- 6. tumblers at the obelisk's foot ----------
	panel(5);
	// a man standing on another man's shoulders
	person(25, 29, 'R', 'Y', { t: 'W' });
	person(25, 19, 'B', 'W', { hat: 'cap', t: 'R' });
	dots('F', [22, 10], [28, 10], [21, 9], [29, 9]);
	dots('Y', [20, 6], [25, 3], [30, 6]);
	dots('C', [22, 4], [28, 4]);
	// one walking on his hands, legs apart in the air
	art(['.KK.', '.RR.', '.RR.', '.RR.', '.RR.', 'BYYB', 'BBBB', 'BBBB', 'F..F', 'FFFF'], 1, 7);
	rug(0, 18, 5, 29, 'Y', 'R', 'W');

	// ---------- 7. the sugar garden carried on poles ----------
	panel(6);
	rect(0, 4, 31, 4, 'T');
	rect(0, 17, 31, 17, 'T');
	rect(2, 2, 29, 19, 'K');
	for (let y = 3; y <= 18; y++) {
		for (let x = 3; x <= 28; x++) {
			const edge = x === 3 || x === 28 || y === 3 || y === 18;
			put(x, y, edge ? ((x + y) % 2 ? 'Y' : 'W') : (x * 3 + y * 5) % 11 === 0 ? 'P' : 'W');
		}
	}
	// candy trees: round crowns with fruit, a sugar cypress between
	for (const [x, y, k] of [
		[8, 8, 'L'],
		[23, 8, 'G'],
		[8, 14, 'G'],
		[23, 14, 'L']
	] as const) {
		disk(x, y, 2.4, k);
		dots('R', [x - 1, y - 1], [x + 1, y + 1]);
		dots(k === 'L' ? 'O' : 'Y', [x + 1, y - 1], [x - 1, y + 1]);
		put(x, y + 3, 'T');
	}
	// a little sugar kiosk in the middle
	rect(13, 8, 18, 15, 'K');
	for (let y = 9; y <= 14; y++) {
		for (let x = 14; x <= 17; x++) put(x, y, y === 9 ? 'R' : x % 2 ? 'P' : 'C');
	}
	dots('Y', [15, 7], [16, 7], [15, 6]);
	rect(15, 13, 16, 14, 'K');
	// the porters underneath
	['R', 'B', 'M', 'C', 'O'].forEach((r, k) => person(3 + k * 6, 29, r, 'Y'));

	// ---------- 8. two wedding palms of wax and tinsel ----------
	panel(7);
	// a slender spire of colored wax and tinsel in tiers, each tier's branch tips hung
	// with gold fruit, on a gilt stem
	const palm = (cx: number, top: number, base: number, a: string, b: string) => {
		const body = base - 2;
		for (let y = top; y <= body; y++) {
			const t = (y - top) / (body - top);
			const half = 0.6 + 3.6 * t ** 1.4;
			const x0 = Math.round(cx - half);
			const x1 = Math.round(cx + half);
			const row = (y - top) % 3;
			for (let x = x0; x <= x1; x++) {
				let k = row === 0 ? 'K' : row === 1 ? a : b;
				if (row === 2 && (x + y) % 2 === 0) k = 'W';
				if (x === x0 || x === x1) k = 'K';
				put(x, y, k);
			}
			if (row === 0 && y > top) {
				dots('K', [x0 - 1, y], [x1 + 1, y]);
				dots('Y', [x0 - 2, y + 1], [x1 + 2, y + 1]);
			}
		}
		for (let y = body + 1; y <= base; y++) dots(y % 2 ? 'Y' : 'K', [cx, y]);
		dots('Y', [cx, top - 1], [cx, top - 2]);
		put(cx, top - 3, 'R');
		rect(cx - 5, base + 1, cx + 5, base + 1, 'T');
	};
	palm(9, -2, 18, 'R', 'Y');
	palm(23, 1, 18, 'C', 'P');
	line(9, 2, 0, 18, 'K');
	line(23, 4, 31, 18, 'K');
	['B', 'R', 'O', 'M', 'R'].forEach((r, k) => person(3 + k * 6, 29, r, 'W', { t: 'Y' }));

	// ---------- 9. the band: shawms, cymbals, kettledrums, the drum camel ----------
	panel(8);
	// shawm players, their horns pointing down and out
	for (const x of [3, 9]) {
		person(x, 13, 'R', 'Y', { hat: 'cap', t: 'R' });
		line(x - 1, 6, x - 3, 9, 'Y');
		dots('Y', [x - 4, 10], [x - 3, 10], [x - 2, 10]);
	}
	// a cymbal player
	person(15, 13, 'B', 'Y', { hat: 'cap', t: 'R' });
	disk(12.5, 8, 1, 'Y');
	disk(17.5, 8, 1, 'Y');
	// a pair of small kettledrums
	person(21, 13, 'M', 'Y', { hat: 'cap', t: 'R' });
	disk(21, 12, 1.5, 'O');
	// the big drum
	person(27, 13, 'R', 'W', { hat: 'cap', t: 'R' });
	rect(28, 7, 31, 12, 'K');
	for (let y = 8; y <= 11; y++) for (let x = 29; x <= 31; x++) put(x, y, (x + y) % 2 ? 'R' : 'Y');
	// the camel with a kettledrum each side of its hump, a drummer riding
	art(CAMEL, 2, 15);
	disk(11, 22, 2.2, 'O');
	rect(10, 20, 12, 20, 'W');
	disk(17, 22, 2.2, 'O');
	rect(16, 20, 18, 20, 'W');
	person(14, 21, 'R', 'Y', { hat: 'cap', t: 'R' });
	// a trumpeter walking behind, and the standard with its horse tails
	person(27, 29, 'C', 'R', { hat: 'cap', t: 'R' });
	line(29, 21, 31, 17, 'Y');
	line(22, 15, 22, 29, 'T');
	dots('Y', [22, 14], [21, 13], [23, 13]);
	for (const [dx, n] of [
		[-1, 5],
		[1, 6],
		[0, 3]
	])
		line(22 + dx, 16, 22 + dx, 16 + n, 'K');

	// ---------- 10. the ship on wheels ----------
	panel(9);
	// the painted sea under it
	for (let x = 6; x <= 31; x++) {
		put(x, 23, x % 4 === 0 ? 'W' : 'B');
		put(x, 24, 'B');
	}
	// the hull: red and gold bands, gun ports, a castle at the stern
	for (let x = 7; x <= 31; x++) {
		const bottom = 22 - (x < 11 ? 11 - x : 0);
		for (let y = 16; y <= bottom; y++) {
			put(x, y, y === 16 ? 'K' : y === 18 ? (x % 3 === 0 ? 'K' : 'Y') : y === 20 ? 'Y' : 'R');
		}
	}
	rect(25, 12, 31, 15, 'K');
	for (let x = 26; x <= 31; x++) put(x, 13, x % 2 ? 'Y' : 'R');
	// sailors' heads along the rail
	for (const x of [9, 15, 18, 23]) dots('F', [x, 15]);
	// masts, sails, flags
	for (const [x, top] of [
		[13, 1],
		[21, 2]
	]) {
		line(x, top, x, 15, 'K');
		for (let y = top + 3; y <= top + 10; y++) {
			const half = 3 + (y - top - 3) * 0.3;
			for (let xx = Math.round(x - half); xx <= Math.round(x + half); xx++) {
				if (xx !== x) put(xx, y, y === top + 6 ? 'R' : 'W');
			}
		}
		dots('R', [x + 1, top], [x + 2, top], [x + 1, top + 1]);
	}
	// wheels
	for (const x of [11, 19, 27]) {
		c.ring(x, 26, 2.5, 'K');
		put(x, 26, 'Y');
	}
	// men hauling it on ropes
	line(7, 17, 3, 20, 'K');
	line(8, 21, 4, 25, 'K');
	person(2, 20, 'B', 'W');
	person(2, 29, 'O', 'W', { t: 'C' });

	// ---------- 11. the stands full of spectators ----------
	panel(10);
	const hats = ['W', 'R', 'Y', 'C', 'M', 'W', 'O', 'B'];
	const robes = ['B', 'O', 'M', 'R', 'Y', 'C', 'B', 'R'];
	for (const [top, shift] of [
		[0, 0],
		[15, 3]
	]) {
		// a striped awning with a scalloped edge
		rect(0, top, PW - 1, top, 'K');
		for (let x = 0; x < PW; x++) {
			put(x, top + 1, (x + shift) % 4 < 2 ? 'R' : 'W');
			put(x, top + 2, x % 2 ? 'R' : 'C');
		}
		// the box's back wall, people in turbans of many colors
		rect(0, top + 3, PW - 1, top + 7, 'C');
		for (let k = 0; k < 8; k++) {
			const x = 1 + k * 4;
			const t = hats[(k + shift) % 8];
			const r = robes[(k * 3 + shift) % 8];
			art(['.t.', 'ttt', '.F.', 'rrr', 'rYr'], x, top + 3, { t, r });
		}
		// a railing of turned wooden posts
		rect(0, top + 8, PW - 1, top + 8, 'Y');
		for (let y = top + 9; y <= top + 12; y++) {
			for (let x = 0; x < PW; x++) {
				put(x, y, x % 4 === 2 ? 'K' : x % 4 === 0 && y === top + 10 ? 'Y' : 'T');
			}
		}
		rect(0, top + 13, PW - 1, top + 13, 'K');
		for (const x of [0, 16, 31]) rect(x, top + 1, x, top + 13, 'K');
	}

	// ---------- 12. the janissaries with their cauldron ----------
	panel(11);
	// a rank marching, muskets on their shoulders
	for (let k = 0; k < 5; k++) {
		art(JANISSARY, 1 + k * 6, 0, { r: k % 2 ? 'B' : 'R' });
		line(5 + k * 6, 7, 6 + k * 6, 1, 'K');
	}
	// the soup cauldron on a pole between two of them, their officer with a plume
	art(JANISSARY, 2, 13, { r: 'B' });
	art(JANISSARY, 23, 13, { r: 'B' });
	line(4, 19, 25, 19, 'T');
	disk(14, 21, 4, 'K');
	disk(14, 21, 3, 'O');
	rect(10, 18, 18, 18, 'K');
	dots('Y', [12, 21], [14, 22], [16, 21]);
	art(JANISSARY, 27, 13, { r: 'M' });
	dots('Y', [28, 12], [28, 11], [29, 10]);
	dots('C', [27, 10], [30, 9]);
	// onlookers seen from behind at the bottom
	for (let k = 0; k < 8; k++) {
		const t = ['R', 'W', 'C', 'Y', 'M', 'W', 'O', 'B'][k];
		const r = ['B', 'M', 'R', 'C', 'O', 'R', 'B', 'M'][k];
		art(['.t.', 'ttt', 'rrr', 'rrr'], k * 4, 26, { t, r });
	}
	c.at();
}

export const surname: Mural = {
	file: '06-surname-i-vehbi',
	name: 'Surname-i Vehbi',
	prefix: 'surname-i-vehbi',
	notes: 'D',
	cols: 4,
	panel: [PW, PH],
	// G green, L grass, K outline, W white, F skin, R red, P pink, Y gold, B lapis,
	// C turquoise, N night, M purple, T brown, O orange
	palette: {
		G: '#4f8a3a',
		L: '#a6c84a',
		K: '#2b1b14',
		W: '#f5efdf',
		F: '#e3a97e',
		R: '#c8301f',
		P: '#ec97a6',
		Y: '#e3b22b',
		B: '#2a48a0',
		C: '#4fb3b8',
		N: '#0e1a44',
		M: '#7b2f6b',
		T: '#8a5a2c',
		O: '#ee7b22'
	},
	ground: 'G',
	panels: [
		['sultan', 'The Sultan', { mode: 'major', spice: 'gentle', lead: 'brass' }],
		['obelisk', 'The Obelisk', { mode: 'dorian', spice: 'lively', lead: 'flute' }],
		['rope-walkers', 'Rope Walkers', { mode: 'lydian', spice: 'adventurous', lead: 'pizz' }],
		['fireworks', 'Fireworks', { mode: 'phrygian', spice: 'adventurous', lead: 'vibes' }],
		['viziers', 'The Viziers', { mode: 'harmonic', spice: 'gentle', lead: 'string' }],
		['tumblers', 'Tumblers', { mode: 'mixolydian', spice: 'lively', lead: 'kalimba' }],
		['sugar-garden', 'Sugar Garden', { mode: 'major', spice: 'gentle', lead: 'harp' }],
		['wedding-palms', 'Wedding Palms', { mode: 'lydian', spice: 'gentle', lead: 'mallet' }],
		['band', 'The Band', { mode: 'phrygian', spice: 'lively', lead: 'brass' }],
		['ship', 'The Ship', { mode: 'dorian', spice: 'lively', lead: 'keys' }],
		['spectators', 'Spectators', { mode: 'mixolydian', spice: 'gentle', lead: 'vibes' }],
		['janissaries', 'Janissaries', { mode: 'harmonic', spice: 'adventurous', lead: 'pizz' }]
	],
	draw
};
