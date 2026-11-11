/*
 * The Bayeux Tapestry (England, about 1070s): the Norman conquest stitched in wool on linen,
 * between two borders of little beasts. 6 x 2 panels (144 x 44); each scene has two halves.
 */
import { div, int, points } from '../canvas.ts';
import type { Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const W = 144;

// the writing over the scenes: blocky marks, three dots tall, that spell nothing
const GLY =
	'11,10,11 1,1,1 11,11,10 10,10,11 11,01,01 101,111,101 11,10,10 1,1,1 111,010,010 11,11,11'
		.split(' ')
		.map((g) => g.split(','));

const BIRD = ['...##', '####.', '.#...'];
const BEAST = ['#..##', '####.', '#..#.'];
const FISH = ['.##..#', '#####.', '.##..#'];

function draw(c: Canvas) {
	const { put, rect, disk, line, dots } = c;

	// ---------- helpers ----------
	// a standing man, feet on row y: tunic t, legs l, facing f (1 right, -1 left), maybe an arm up
	const man = (
		x: number,
		y: number,
		t: string,
		l: string,
		f: number,
		{ hair = 'K', helm, up }: { hair?: string; helm?: string; up?: boolean } = {}
	) => {
		put(x, y - 6, helm || hair);
		put(x + f, y - 6, helm || hair);
		if (helm) put(x, y - 7, helm);
		put(x, y - 5, 'F');
		put(x + f, y - 5, 'F');
		rect(x - 1, y - 4, x + 1, y - 2, t);
		dots(l, [x - 1, y - 1], [x + 1, y - 1], [x - 1, y], [x + 1, y]);
		if (up) {
			dots(t, [x + 2 * f, y - 5], [x + 3 * f, y - 6]);
			put(x + 4 * f, y - 7, 'F');
		}
	};
	// a galloping horse facing right, hooves on row y; bl is half its body's length
	const horse = (x: number, y: number, col: string, bl: number, mane: string) => {
		const P = (dx: number, dy: number, k = col) => put(x + dx, y - dy, k);
		for (let dx = -bl; dx <= bl; dx++) for (let dy = 3; dy < 7; dy++) P(dx, dy);
		for (const [dx, dy] of points('1,6 1,7 1,8 2,7 2,8 2,9 3,9 3,8 4,8 2,10')) P(bl + dx, dy);
		P(bl, 7, mane);
		P(bl, 2);
		P(bl + 1, 1);
		P(bl + 2, 0, 'K');
		P(bl - 1, 2);
		P(bl - 1, 1);
		P(bl - 1, 0, 'K');
		P(-bl, 2);
		P(-bl - 1, 1);
		P(-bl - 2, 0, 'K');
		P(-bl + 1, 2);
		P(-bl + 1, 1);
		P(-bl + 1, 0, 'K');
		P(-bl - 1, 6, mane);
		P(-bl - 2, 5, mane);
		P(-bl - 2, 4, mane);
	};
	const rider = (x: number, y: number, t: string, leg: string, helm?: string) => {
		rect(x - 1, y - 8, x + 1, y - 6, t);
		put(x, y - 9, 'F');
		put(x + 1, y - 9, 'F');
		put(x, y - 10, helm || 'K');
		put(x + 1, y - 10, helm || 'K');
		if (helm) put(x, y - 11, helm);
		dots(leg, [x, y - 5], [x, y - 4], [x, y - 3], [x + 1, y - 2]);
	};
	const kite = (x: number, y: number, a: string, b: string) => {
		rect(x, y, x + 2, y + 2, a);
		put(x + 1, y + 3, a);
		put(x + 1, y + 4, a);
		put(x + 1, y + 1, b);
	};
	const tree = (x: number, y: number, h: number, a = 'S', b = 'T') => {
		rect(x, y - h, x + 1, y, 'K');
		put(x - 1, y, 'K');
		put(x + 2, y, 'K');
		line(x, y - h + 3, x - 3, y - h, 'K');
		line(x, y - h + 3, x + 3, y - h, 'K');
		disk(x + 0.5, y - h - 2, 2.7, a);
		disk(x - 4, y - h, 2, b);
		disk(x + 4.5, y - h, 2, b);
		dots('R', [x, y - h - 2], [x - 4, y - h], [x + 4, y - h]);
	};
	// a line of writing from x0 to no further than x1, starting at mark k
	const caption = (x0: number, x1: number, y: number, k = 0) => {
		let x = x0;
		while (true) {
			const g = GLY[k % GLY.length];
			if (x + g[0].length - 1 > x1) break;
			c.stamp(g, x, y, { 1: 'K' });
			// a wider gap after every third mark, like the space between words
			x += g[0].length + (k % 3 === 2 ? 3 : 1);
			k += 1;
		}
	};
	const ground = (x0: number, x1: number, y: number, a: string, b: string, rows: number) => {
		for (let x = x0; x <= x1; x++) {
			const k = div(x, 6) % 2 === 0 ? a : b;
			for (let r = 0; r < rows; r++) put(x, y - r, k);
			if ([1, 2, 3, 4].includes(x % 6)) put(x, y - rows, k);
			if (x % 6 === 0 && rows > 1) put(x, y, k === a ? b : a);
		}
	};
	const hill = (cx: number, base: number, rx: number, ry: number, cols = ['S', 'Y', 'T']) => {
		for (let y = int(base - ry) - 1; y <= base; y++) {
			for (let x = int(cx - rx) - 1; x < int(cx + rx) + 2; x++) {
				const d = ((x - cx) / rx) ** 2 + ((y - base - 0.5) / ry) ** 2;
				if (d <= 1) put(x, y, d > 0.6 ? cols[0] : d > 0.25 ? cols[1] : cols[2]);
			}
		}
	};

	// ---------- the borders ----------
	// five dots tall, top rule on row y0; every 12 dots a pair of slanted bars, then a beast.
	// panels in `fishes` get fish for beasts; panels in `empty` are left bare
	const border = (y0: number, fishes: number[] = [], empty: number[] = []) => {
		const low = y0 > 0 ? 1 : 0;
		rect(0, y0, W - 1, y0, 'K');
		rect(0, y0 + 4, W - 1, y0 + 4, 'K');
		for (let u = 0; u < 12; u++) {
			const x = u * 12;
			if (empty.includes(div(x, 24))) continue;
			const ca = ['R', 'N', 'T', 'Y'][(u + low) % 4];
			const cb = ['N', 'Y', 'R', 'T'][(u + low) % 4];
			const up = (u + low) % 2 === 0;
			for (let i = 0; i < 3; i++) {
				const yy = up ? y0 + 3 - i : y0 + 1 + i;
				put(x + i, yy, ca);
				put(x + 2 + i, yy, cb);
			}
			const an = ['R', 'N', 'S', 'K', 'T', 'Y'][(u * 5 + low * 2) % 6];
			const beast = fishes.includes(div(x, 24)) ? FISH : up ? BIRD : BEAST;
			c.stamp(beast, x + 6, y0 + 1, { '#': an }, u % 2 === 1);
		}
	};
	border(0);
	border(39, [3], [4, 5]);
	// the fallen lie in the lower border under the battle, among shields and broken spears
	const fallen = (x: number, y: number, t: string, f = 1) => {
		put(x, y, 'K');
		put(x + f, y, 'F');
		for (const i of [2, 3, 4]) put(x + i * f, y, t);
		put(x + 5 * f, y, 'K');
		put(x + 6 * f, y, 'K');
		put(x + 3 * f, y - 1, t);
		put(x + 4 * f, y - 2, 'F');
	};
	fallen(97, 42, 'T');
	fallen(117, 42, 'N', -1);
	fallen(123, 42, 'S');
	fallen(141, 42, 'R', -1);
	kite(105, 40, 'Y', 'R');
	kite(131, 40, 'N', 'Y');
	line(107, 42, 110, 40, 'K');
	line(127, 40, 129, 42, 'K');

	// ---------- 1. the king in his palace / riders with hawks and hounds ----------
	caption(5, 18, 6);
	// the palace: two towers, a chequered roof on two pillars
	for (const tx of [0, 21]) {
		rect(tx, 8, tx + 2, 20, 'N');
		rect(tx, 7, tx + 2, 7, 'R');
		put(tx + 1, 6, 'R');
		dots('Y', [tx + 1, 10], [tx + 1, 14], [tx + 1, 18]);
	}
	for (let x = 3; x < 21; x++) {
		put(x, 10, div(x, 2) % 2 ? 'R' : 'Y');
		put(x, 11, div(x, 2) % 2 ? 'Y' : 'R');
	}
	rect(7, 12, 7, 20, 'T');
	rect(16, 12, 16, 20, 'T');
	dots('T', [8, 12], [15, 12], [6, 12], [17, 12], [3, 12], [20, 12]);
	// the king on his throne, crowned, a sceptre in one hand
	rect(8, 14, 8, 20, 'Y');
	rect(15, 14, 15, 20, 'Y');
	put(8, 13, 'R');
	put(15, 13, 'R');
	rect(9, 19, 14, 19, 'Y');
	dots('Y', [10, 12], [13, 12], [10, 13], [11, 13], [12, 13], [13, 13]);
	rect(11, 14, 12, 15, 'F');
	put(10, 14, 'K');
	put(13, 14, 'K');
	rect(10, 16, 13, 18, 'N');
	dots('R', [10, 16], [13, 16], [10, 17], [13, 17], [11, 16], [12, 16]);
	dots('F', [9, 17], [14, 17]);
	dots('T', [9, 16], [9, 15]);
	dots('R', [10, 20], [13, 20], [10, 19], [13, 19]);
	man(4, 20, 'S', 'R', 1);
	man(19, 20, 'R', 'T', -1);
	rect(0, 21, 23, 21, 'K');
	for (let x = 1; x < 24; x += 3) put(x, 21, 'Y');
	// lower: a rider with a hawk on his fist
	ground(0, 23, 38, 'S', 'Y', 2);
	hill(18.5, 38, 8.5, 6);
	caption(13, 23, 22, 2);
	horse(7, 35, 'R', 3, 'K');
	rider(7, 34, 'T', 'N');
	dots('T', [9, 27], [10, 27]);
	put(11, 27, 'F');
	dots('K', [11, 26], [12, 25], [11, 25], [12, 26], [13, 25]);
	const hound = (x: number, y: number, k: string) => {
		rect(x, y - 2, x + 3, y - 1, k);
		dots(k, [x + 4, y - 3], [x + 5, y - 3], [x + 4, y - 2], [x, y], [x + 3, y], [x - 1, y - 3]);
	};
	hound(17, 31, 'K');
	hound(16, 27, 'N');
	dots('K', [2, 24], [3, 23], [4, 24], [5, 23]);
	dots('N', [3, 24], [4, 23]);

	// ---------- 2. the comet / the feast ----------
	caption(25, 37, 6, 5);
	ground(24, 47, 21, 'T', 'S', 1);
	// the comet, its tail streaming down to the left
	disk(43, 9, 2.1, 'Y');
	rect(42, 8, 44, 10, 'R');
	put(43, 9, 'Y');
	dots('Y', [43, 6], [43, 12], [40, 9], [46, 9], [41, 7], [45, 7], [45, 11]);
	for (let i = 0; i < 4; i++) line(40 - i, 10 + i, 32 - i, 10 + i * 2, i % 2 ? 'R' : 'Y');
	rect(42, 17, 47, 20, 'N');
	rect(44, 18, 45, 20, 'K');
	put(42, 18, 'Y');
	put(47, 18, 'Y');
	for (let i = 0; i < 3; i++) rect(41 + i, 16 - i, 47, 16 - i, i % 2 === 0 ? 'R' : 'Y');
	for (let i = 0; i < 4; i++) {
		man(25 + i * 4, 20, 'RTYN'[i], 'NKRT'[i], 1, { up: true, hair: i % 2 ? 'K' : 'R' });
	}
	// the feast hall: roof, side posts and a beam
	for (let x = 24; x < 48; x++) {
		put(x, 23, div(x, 2) % 2 ? 'N' : 'R');
		put(x, 24, div(x, 2) % 2 ? 'R' : 'N');
		put(x, 22, 'Y');
	}
	rect(24, 25, 25, 37, 'T');
	rect(46, 25, 47, 37, 'T');
	rect(24, 25, 47, 25, 'Y');
	// five diners with drinking horns, behind a table with a striped cloth
	for (let i = 0; i < 5; i++) {
		const x = 28 + i * 4;
		put(x, 27, i % 2 ? 'K' : 'R');
		put(x + 1, 27, i % 2 ? 'K' : 'R');
		put(x, 28, 'F');
		put(x + 1, 28, 'F');
		rect(x - 1, 29, x + 2, 31, 'RNSRN'[i]);
	}
	dots('K', [30, 29], [30, 28], [31, 27], [42, 29], [42, 28], [41, 27]);
	rect(26, 32, 45, 32, 'K');
	rect(26, 33, 45, 35, 'Y');
	for (let x = 26; x < 46; x++) {
		if (x % 4 === 0 || x % 4 === 1) rect(x, 33, x, 35, 'R');
	}
	for (const x of [27, 34, 39]) rect(x, 31, x + 1, 31, 'Y');
	rect(26, 36, 45, 36, 'K');
	for (let x = 24; x < 48; x++) {
		put(x, 37, div(x, 3) % 2 ? 'S' : 'N');
		put(x, 38, div(x, 3) % 2 ? 'N' : 'S');
	}

	// ---------- 3. felling trees / building ships ----------
	caption(55, 64, 6, 1);
	ground(48, 71, 21, 'S', 'T', 1);
	tree(52, 20, 9);
	tree(65, 20, 9, 'T', 'S');
	// a woodman swinging his axe high at the left tree
	man(57, 20, 'R', 'N', -1, { hair: 'R' });
	dots('R', [55, 16], [54, 15]);
	put(53, 14, 'F');
	dots('K', [53, 13], [53, 12], [53, 11]);
	dots('N', [54, 11], [55, 11], [54, 12], [55, 12]);
	man(61, 20, 'Y', 'T', 1);
	put(63, 16, 'Y');
	put(64, 16, 'F');
	put(65, 16, 'K');
	dots('N', [65, 15], [65, 17], [64, 15]);
	rect(58, 10, 61, 10, 'R');
	rect(58, 11, 61, 11, 'Y');
	rect(58, 12, 61, 12, 'R');
	caption(52, 66, 22, 6);
	ground(48, 71, 38, 'Y', 'S', 2);
	// the ship on the stocks: planks narrowing to the keel, gold-tipped stem and stern, props
	['R', 'Y', 'N', 'T', 'R'].forEach((k, i) => rect(51 + i, 30 + i, 68 - i, 30 + i, k));
	dots('R', [50, 29], [49, 28], [49, 27], [48, 26], [69, 29], [70, 28], [70, 27], [71, 26]);
	dots('Y', [48, 25], [49, 25], [71, 25], [70, 25]);
	for (const x of [56, 60, 64]) rect(x, 35, x, 37, 'K');
	[54, 60, 65].forEach((x, i) => {
		put(x, 26, 'K');
		put(x + 1, 26, 'K');
		put(x, 27, 'F');
		put(x + 1, 27, 'F');
		rect(x - 1, 28, x + 1, 29, 'TSN'[i]);
		put(x + 2, 28, 'F');
		dots('K', [x + 3, 28], [x + 3, 27], [x + 3, 26]);
		dots('N', [x + 2, 26], [x + 4, 26]);
	});

	// ---------- 4. the crossing ----------
	for (let y = 30; y < 39; y++) {
		for (let x = 72; x < 96; x++) {
			const yy = y + Math.sin((x * Math.PI) / 6) * 1.6;
			if (yy >= 31) c.g[y][x] = Math.floor((yy - 31) / 2) % 2 === 0 ? 'N' : 'T';
		}
	}
	caption(73, 80, 6, 3);
	caption(88, 95, 6, 8);
	rect(83, 7, 84, 25, 'K');
	dots('R', [85, 6], [86, 6], [87, 6], [85, 7], [86, 7]);
	for (let y = 10; y < 21; y++) {
		const hw = 6 + (y - 10) * 0.35;
		for (let x = 72; x < 96; x++) {
			if (Math.abs(x - 83.5) <= hw) put(x, y, ['R', 'Y', 'N'][div(x - 72, 3) % 3]);
		}
	}
	rect(76, 9, 91, 9, 'K');
	['R', 'Y', 'N', 'R'].forEach((k, i) => rect(75 + i, 27 + i, 92 - i, 27 + i, k));
	dots('R', [93, 26], [94, 25], [94, 24], [94, 23]);
	dots('Y', [94, 22], [95, 22], [95, 23]);
	put(94, 21, 'R');
	dots('R', [74, 26], [73, 25], [73, 24], [73, 23]);
	dots('Y', [73, 22], [72, 22]);
	for (let i = 0; i < 6; i++) {
		const x = 76 + i * 3;
		rect(x, 25, x + 1, 26, ['N', 'Y', 'T', 'R'][i % 4]);
	}
	[76, 86].forEach((x, i) => {
		put(x, 22, 'K');
		put(x + 1, 22, 'K');
		put(x, 23, 'F');
		put(x + 1, 23, 'F');
		rect(x, 24, x + 1, 24, 'TS'[i]);
	});
	[79, 89].forEach((x, i) => {
		for (const [dx, y] of points('0,24 1,24 0,23 1,23 0,22 1,22 2,22 3,22 3,23 0,21')) {
			put(x + dx, y, 'KN'[i]);
		}
	});

	// ---------- 5. the charge / the shield wall ----------
	ground(96, 119, 21, 'Y', 'S', 2);
	// a knight at the gallop, with shield and lance; bl is half his horse's length
	const knight = (
		x: number,
		bl: number,
		steed: string,
		tunic: string,
		shield: string,
		pennant: string,
		helm: string
	) => {
		horse(x, 19, steed, bl, steed === 'N' ? 'Y' : 'K');
		rider(x, 18, tunic, 'K', helm);
		kite(x - 4, 9, shield, 'K');
		put(x + 2, 11, tunic);
		put(x + 3, 10, 'F');
		line(x + 3, 9, x + 6, 7, 'K');
		rect(x + 5, 6, x + 7, 6, pennant);
		rect(x + 6, 7, x + 7, 7, pennant);
		put(x + 7, 8, pennant);
	};
	knight(100, 2, 'N', 'R', 'T', 'R', 'K');
	knight(112, 3, 'R', 'T', 'Y', 'N', 'N');
	dots('K', [107, 7], [108, 6], [109, 7], [110, 6]);
	ground(96, 119, 38, 'S', 'T', 2);
	caption(97, 105, 22);
	// a horse on its back, legs in the air
	rect(98, 31, 104, 33, 'T');
	for (const x of [98, 100, 102, 104]) {
		const outer = x === 98 || x === 104;
		rect(x, outer ? 28 : 29, x, 30, 'T');
		put(x, outer ? 27 : 28, 'K');
	}
	dots('T', [97, 33], [97, 34], [96, 34], [96, 35], [97, 35], [96, 33]);
	put(98, 34, 'R');
	dots('K', [105, 32], [105, 33], [105, 34]);
	// the shield wall: four men on foot, each with a helmet, a spear and a kite shield
	for (let i = 0; i < 4; i++) {
		const x = 108 + i * 3;
		put(x, 27, 'N');
		put(x - 1, 27, 'N');
		put(x, 26, 'N');
		put(x, 28, 'F');
		put(x - 1, 28, 'F');
		rect(x + 1, 22, x + 1, 29, 'K');
		put(x + 1, 22, 'N');
		kite(x - 1, 29, 'RNYR'[i], 'YYRN'[i]);
		dots('TSNT'[i], [x - 1, 32], [x + 1, 32]);
		dots('K', [x - 1, 33], [x + 1, 33], [x - 1, 34], [x + 1, 34], [x - 1, 35], [x + 1, 35]);
	}

	// ---------- 6. the castle on its mound / the king is struck ----------
	for (let y = 11; y < 22; y++) {
		for (let x = 120; x < 144; x++) {
			const d = ((x - 132) / 11.5) ** 2 + ((y - 22) / 8.5) ** 2;
			if (d <= 1) put(x, y, d > 0.62 ? 'S' : d > 0.3 ? 'Y' : 'T');
		}
	}
	rect(127, 9, 137, 14, 'R');
	for (let x = 127; x < 138; x += 2) put(x, 8, 'N');
	for (const x of [129, 135]) rect(x, 10, x, 14, 'N');
	rect(131, 11, 133, 14, 'K');
	put(132, 11, 'Y');
	rect(132, 6, 132, 7, 'K');
	dots('Y', [133, 6], [134, 6], [135, 6], [133, 7]);
	line(120, 20, 126, 14, 'K');
	line(121, 20, 127, 14, 'K');
	rect(120, 21, 143, 21, 'K');
	caption(121, 133, 22, 7);
	ground(120, 143, 38, 'S', 'Y', 2);
	hill(139, 38, 6, 6, ['T', 'Y', 'S']);
	[121, 125].forEach((x, i) => {
		man(x, 35, 'SY'[i], 'N', 1, { hair: 'RK'[i] });
		dots('N', [x + 2, 29], [x + 3, 30], [x + 3, 31], [x + 2, 32]);
	});
	// the king in his gold crown, with the arrow that strikes him
	man(133, 35, 'T', 'R', -1, { helm: 'Y' });
	put(133, 27, 'Y');
	put(132, 28, 'Y');
	line(127, 27, 131, 30, 'K');
	dots('R', [126, 26], [127, 26]);
	put(131, 31, 'T');
	put(130, 30, 'F');
	kite(134, 30, 'R', 'Y');
	// his standard bearer on the hill, holding the red dragon banner
	man(139, 31, 'N', 'K', -1, { helm: 'K' });
	rect(142, 22, 142, 32, 'K');
	dots('R', [138, 22], [139, 22], [140, 22], [141, 22], [139, 23], [141, 23]);
	put(137, 22, 'Y');
	put(138, 23, 'Y');
}

export const bayeux: Mural = {
	file: '00h-bayeux-tapestry',
	name: 'The Bayeux Tapestry',
	prefix: 'bayeux',
	notes: 'Bb',
	cols: 6,
	// L linen, R terracotta, N dark blue, T blue-green, S sage, Y mustard, K dark brown, F flesh
	palette: {
		L: '#f1e6cb',
		R: '#b8452c',
		N: '#22386b',
		T: '#2f8079',
		S: '#93a862',
		Y: '#dfa62a',
		K: '#2b1a14',
		F: '#e39a80'
	},
	ground: 'L',
	panels: [
		['king-enthroned', 'King Enthroned', { mode: 'mixolydian', spice: 'gentle', lead: 'harp' }],
		['comet', 'The Comet', { mode: 'lydian', spice: 'adventurous', lead: 'vibes', meter: 5 }],
		['felling-trees', 'Felling Trees', { mode: 'mixolydian', spice: 'lively', lead: 'mallet' }],
		[
			'striped-sail',
			'Striped Sail',
			{ mode: 'phrygian', spice: 'lively', lead: 'flute', meter: 3 }
		],
		['knights-charge', 'Knights Charge', { mode: 'dorian', spice: 'adventurous', lead: 'brass' }],
		['castle-mound', 'Castle on the Mound', { mode: 'dorian', spice: 'gentle', lead: 'keys' }],
		[
			'hawk-and-hounds',
			'Hawk and Hounds',
			{ mode: 'mixolydian', spice: 'lively', lead: 'pizz', meter: 3 }
		],
		['feast', 'The Feast', { mode: 'dorian', spice: 'lively', lead: 'kalimba' }],
		['shipwrights', 'Shipwrights', { mode: 'mixolydian', spice: 'gentle', lead: 'mallet' }],
		['crossing', 'The Crossing', { mode: 'lydian', spice: 'gentle', lead: 'string', meter: 3 }],
		['shield-wall', 'Shield Wall', { mode: 'minor', spice: 'lively', lead: 'brass' }],
		['arrow', 'The Arrow', { mode: 'phrygian', spice: 'adventurous', lead: 'string', meter: 7 }]
	],
	draw
};
