/*
 * Pieter Bruegel the Elder, Children's Games (1560): a town square seen from above,
 * packed with children, every group playing a different game. 5 by 4 panels (120 x 88).
 */
import { int, mod, points, round, type Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const W = 120;
const H = 88;

// the lower edge of the green in the top left corner, by column
const edge = (x: number) => 29 - (x / 25) ** 3 * 29 + 1.5 * Math.sin(x * 0.9);
// the stream's middle row, by column
const sy = (x: number) => round(9 + 4 * Math.sin(x / 5 + 0.6));
// the street's left and right edges, by row; it narrows toward the top
const xl = (y: number) => 104 - (y * 20) / 43;
const xr = (y: number) => 109 - (y * 10) / 43;

function draw(c: Canvas) {
	const { put, rect, disk, ell, line, dots, ring } = c;

	// ---------- the square: scalloped bands of two sands, a few gray cobbles ----------
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const yy = y + Math.sin((x * Math.PI) / 9) * 2;
			c.g[y][x] = mod(Math.floor(yy / 5), 2) === 0 ? 'O' : 'T';
			if (y % 6 === 3 && [0, 1].includes((x + Math.floor(y / 6) * 5) % 12)) c.g[y][x] = 'E';
		}
	}

	// a child about 3 wide and 4 tall, feet at (x, y); '' for no hat or no legs
	const kid = (
		x: number,
		y: number,
		col: string,
		hat = '',
		{ legs = 'K', dress = false, up = false } = {}
	) => {
		put(x, y - 3, 'F');
		if (hat) put(x, y - 4, hat);
		if (up) {
			put(x - 1, y - 3, col);
			put(x + 1, y - 3, col);
			put(x, y - 2, col);
		} else {
			rect(x - 1, y - 2, x + 1, y - 2, col);
		}
		rect(x - 1, y - 1, x + 1, y - 1, col);
		if (dress) {
			put(x, y, legs);
		} else if (legs) {
			put(x - 1, y, legs);
			put(x + 1, y, legs);
		}
	};
	const tree = (x: number, y: number, r: number, tall: number) => {
		rect(x, y - tall, x + 1, y, 'K');
		disk(x + 0.5, y - tall - r + 1, r, 'D');
		dots('G', [x - 1, y - tall - r], [x, y - tall - r - 1], [x + 2, y - tall - r + 1]);
	};

	// ---------- top left: the green with its stream ----------
	for (let x = 0; x < 27; x++) {
		for (let y = 0; y < H; y++) {
			if (y < edge(x)) {
				const yy = y + Math.sin((x * Math.PI) / 7) * 1.6;
				c.g[y][x] = mod(Math.floor(yy / 4), 2) === 0 ? 'G' : 'L';
			}
		}
	}
	for (let x = 0; x < 26; x++) {
		for (let d = -2; d < 3; d++) {
			const y = sy(x) + d;
			if (y < edge(x) - 1 && y >= 0) put(x, y, 'S');
		}
	}
	for (const x of [2, 9, 15, 21]) dots('W', [x, sy(x) + 1], [x + 1, sy(x) + 1]);
	const swimmer = (x: number) => {
		const y = sy(x);
		put(x, y - 1, 'K');
		put(x, y, 'F');
		put(x - 1, y, 'F');
		put(x + 1, y, 'F');
		put(x - 2, y, 'W');
		put(x + 2, y, 'W');
	};
	swimmer(6);
	swimmer(12);
	swimmer(19);
	tree(3, 6, 2.5, 2);
	tree(14, 5, 2.2, 2);
	tree(20, 20, 2.6, 3);
	kid(3, 20, 'W', 'K');
	rect(6, 19, 8, 20, 'R');
	put(7, 18, 'B');
	kid(11, 20, 'R', '', { up: true });
	tree(4, 31, 3, 3);
	dots('D', [10, 25], [11, 25], [11, 24], [15, 22], [16, 22], [16, 21]);

	// ---------- the big building with its arcade ----------
	const BX0 = 33;
	const BX1 = 60;
	rect(BX0 - 1, 2, BX1 + 1, 5, 'E');
	rect(BX0, 1, BX1, 1, 'K');
	for (let x = BX0; x < BX1 + 1; x += 3) {
		put(x, 3, 'K');
		put(x + 1, 5, 'K');
	}
	rect(39, 0, 40, 1, 'N');
	rect(53, 0, 54, 1, 'N');
	rect(BX0, 6, BX1, 40, 'N');
	rect(BX0, 14, BX1, 14, 'T');
	rect(BX0, 24, BX1, 24, 'T');
	for (const wx of [36, 45, 54]) {
		rect(wx, 8, wx + 2, 11, 'K');
		rect(wx - 1, 8, wx - 1, 11, 'W');
		rect(wx + 3, 8, wx + 3, 11, 'W');
		rect(wx, 17, wx + 2, 20, 'K');
		rect(wx, 21, wx + 2, 21, 'W');
	}
	// children at the windows: one trails a streamer, one wears a mask
	put(46, 9, 'F');
	dots('R', [45, 10], [46, 10], [47, 10], [46, 11]);
	line(45, 12, 43, 19, 'W');
	dots('R', [44, 15], [43, 18]);
	dots('W', [55, 18], [54, 18], [56, 18], [55, 19]);
	dots('B', [54, 20], [55, 20], [56, 20]);
	put(37, 18, 'F');
	dots('B', [36, 19], [37, 19], [38, 19], [37, 20]);
	put(55, 9, 'F');
	dots('G', [54, 10], [55, 10], [56, 10], [55, 11]);
	for (const [a, b] of points('35,41 44,50 53,58')) {
		rect(a + 2, 26, b - 2, 26, 'K');
		rect(a + 1, 27, b - 1, 27, 'K');
		rect(a, 28, b, 40, 'K');
		rect(a, 39, b, 40, 'E');
	}
	rect(BX0 - 1, 41, BX1 + 1, 41, 'E');
	// children whipping tops under the arches and beside the building
	const top = (x: number, y: number) => {
		rect(x - 1, y - 1, x + 1, y - 1, 'W');
		put(x, y, 'R');
		put(x, y - 2, 'R');
	};
	kid(37, 38, 'R', 'W', { legs: 'W', up: true });
	top(40, 38);
	kid(46, 38, 'B', 'R', { legs: 'W' });
	line(47, 36, 49, 35, 'W');
	top(49, 38);
	kid(55, 38, 'G', 'W', { legs: 'W' });
	top(57, 37);
	kid(27, 37, 'B', 'K');
	line(28, 35, 31, 33, 'K');
	top(30, 37);
	kid(29, 43, 'W', 'R', { dress: true });

	// the tree being climbed: one halfway up the trunk, one waiting, one up in the leaves
	rect(28, 9, 29, 24, 'K');
	disk(28.5, 5.5, 4.4, 'D');
	dots('G', [26, 4], [27, 3], [30, 6], [31, 5], [28, 7]);
	dots('K', [27, 12], [30, 11]);
	dots('R', [29, 14], [30, 14], [29, 15], [30, 15], [27, 14], [30, 16]);
	put(30, 13, 'F');
	dots('K', [30, 12], [27, 17], [30, 17]);
	kid(25, 22, 'W', 'B', { up: true });
	put(27, 5, 'F');
	dots('B', [26, 6], [27, 6], [28, 6]);

	// ---------- stilts beside the building ----------
	kid(64, 12, 'R', 'B', { legs: '' });
	rect(63, 12, 63, 21, 'K');
	rect(65, 12, 65, 21, 'K');
	kid(69, 16, 'B', 'W', { legs: '' });
	rect(68, 16, 68, 21, 'K');
	rect(70, 16, 70, 21, 'K');
	for (let x = 62; x < 86; x++) {
		const dark = Math.floor(x / 3) % 2 === 0;
		rect(x, 0, x, dark ? 3 : 2, dark ? 'D' : 'G');
	}

	// ---------- the street running to the top right ----------
	for (let y = 3; y < 47; y++) {
		let a = round(xl(Math.min(y, 43)));
		let b = round(xr(Math.min(y, 43)));
		if (y > 43) {
			a += (y - 43) * 2 + (y % 2 ? 1 : 0);
			b -= (y - 43) * 2;
		}
		for (let x = a; x < b + 1; x++) put(x, y, 'E');
		if (y % 4 === 1 && y < 43) {
			put(Math.floor((a + b) / 2), y, 'T');
			put(Math.floor((a + b) / 2) + 1, y, 'T');
		}
	}
	for (let x = 100; x < W; x++) {
		for (let y = 0; y < 4; y++) {
			if (y < 3 + Math.sin(x * 0.8) * 0.9) put(x, y, 'S');
		}
	}
	dots('W', [111, 0], [112, 0], [113, 0], [112, 1], [117, 1], [118, 1]);
	// three houses down the left side, seen from the front
	[...'WNW'].forEach((wall, i) => {
		const y0 = 1 + 10 * i;
		const y1 = y0 + 9;
		const x1 = int(xl(y1)) - 1;
		const x0 = x1 - 8;
		const win = wall === 'W' ? 'K' : 'W';
		for (let r = 0; r < 3; r++) rect(x0 + (2 - r), y0 + r, x1 - (2 - r), y0 + r, 'RKB'[i]);
		rect(x0, y0 + 3, x1, y1, wall);
		rect(x0 + 1, y0 + 4, x0 + 2, y0 + 5, win);
		rect(x1 - 2, y0 + 4, x1 - 1, y0 + 5, win);
		rect(Math.floor((x0 + x1) / 2), y1 - 2, Math.floor((x0 + x1) / 2) + 1, y1, 'K');
	});
	const sideHouse = (wall: string, roof: string, y0: number, y1: number) => {
		const x0 = int(xr(y0)) + 2;
		rect(x0, y0, 119, y0 + 2, roof);
		rect(x0 + 1, y0 + 3, 119, y1, wall);
		const win = wall === 'N' ? 'W' : 'K';
		for (let wx = x0 + 3; wx < 118; wx += 4) rect(wx, y0 + 5, wx + 1, y0 + 6, win);
		rect(x0 + 1, y1 - 2, x0 + 2, y1, 'K');
	};
	sideHouse('N', 'K', 4, 12);
	sideHouse('W', 'R', 13, 22);
	sideHouse('N', 'K', 23, 32);
	// follow the leader, up the street, behind a flag
	kid(105, 8, 'R', 'K');
	kid(103, 13, 'B', 'W');
	kid(100, 18, 'W', 'R');
	kid(98, 24, 'G', 'K');
	kid(95, 30, 'R', 'B');
	line(106, 6, 106, 3, 'K');
	rect(107, 3, 108, 4, 'R');

	// ---------- ring dance ----------
	for (let i = 0; i < 8; i++) {
		const a = (2 * Math.PI * i) / 8 + 0.4;
		const x = round(78 + 5.5 * Math.cos(a));
		const y = round(13 + 5 * Math.sin(a)) + 2;
		kid(x, y, 'RBWG'[i % 4], i % 2 ? 'K' : '', { dress: i % 2 === 0 });
	}
	dots('N', [78, 12], [79, 12], [78, 13], [79, 13]);

	// ---------- headstands and tumbling ----------
	const headstand = (x: number, y: number, col: string) => {
		put(x, y, 'F');
		put(x - 1, y, 'K');
		put(x + 1, y, 'K');
		rect(x - 1, y - 2, x + 1, y - 1, col);
		for (const [dx, dy] of points('-1,-3 1,-3 -2,-4 2,-4 -2,-5 2,-5')) put(x + dx, y + dy, 'K');
	};
	headstand(10, 39, 'R');
	headstand(17, 42, 'B');
	headstand(3, 37, 'W');
	rect(14, 32, 16, 34, 'W');
	put(15, 33, 'F');
	put(16, 32, 'K');
	put(14, 34, 'K');
	kid(21, 34, 'G', 'R', { up: true });

	// ---------- blind man's buff ----------
	kid(66, 36, 'B');
	put(66, 33, 'W');
	put(66, 32, 'W');
	put(65, 33, 'W');
	put(67, 33, 'W');
	put(64, 34, 'B');
	put(68, 34, 'B');
	put(63, 34, 'F');
	put(69, 34, 'F');
	kid(62, 30, 'R', 'K');
	kid(70, 29, 'G', 'W', { up: true });
	kid(62, 42, 'W', 'R', { dress: true });
	kid(70, 42, 'R', 'B', { up: true });
	kid(50, 43, 'B', 'W', { dress: true });

	// ---------- tug of war ----------
	kid(74, 40, 'R', 'K');
	kid(78, 40, 'W', 'R');
	kid(82, 40, 'R', 'B');
	kid(87, 40, 'B', 'W');
	kid(91, 40, 'G', 'K');
	kid(95, 40, 'B', 'R');
	for (const x of [72, 76, 80, 84, 85, 89, 93]) put(x, 38, 'K');
	rect(84, 39, 85, 40, 'W');
	kid(75, 29, 'B', 'R');
	rect(77, 27, 79, 28, 'R');
	rect(77, 26, 79, 26, 'W');
	put(76, 27, 'K');
	rect(74, 24, 76, 24, 'W');
	put(77, 23, 'W');
	put(74, 25, 'W');
	put(76, 25, 'W');

	// ---------- piggyback fight ----------
	// one child carrying another, the rider reaching out toward side d
	const piggy = (x: number, y: number, c1: string, c2: string, d: number) => {
		kid(x, y, c1);
		put(x, y - 4, c2);
		rect(x - 1, y - 5, x + 1, y - 5, c2);
		put(x, y - 6, 'F');
		put(x, y - 7, 'K');
		put(x + 2 * d, y - 5, c2);
		put(x + 3 * d, y - 6, 'F');
		put(x - d, y - 3, c2);
	};
	piggy(106, 42, 'B', 'R', 1);
	piggy(113, 42, 'G', 'W', -1);
	kid(118, 41, 'R', 'K', { up: true });

	// ---------- fence riders ----------
	for (const px of [1, 8, 15, 22]) rect(px, 51, px, 60, 'N');
	rect(0, 54, 23, 54, 'N');
	rect(0, 57, 23, 57, 'N');
	const astride = (x: number, col: string, hat: string) => {
		kid(x, 53, col, hat);
		put(x - 1, 53, 'O');
		put(x + 1, 53, 'O');
		put(x, 53, col);
		put(x - 1, 55, 'K');
		put(x + 1, 55, 'K');
		put(x - 1, 56, 'K');
		put(x + 1, 56, 'K');
		line(x + 2, 51, x + 3, 48, 'K');
	};
	astride(4, 'R', 'K');
	astride(11, 'B', 'W');
	astride(18, 'W', 'R');
	kid(6, 65, 'G', 'W', { up: true });
	disk(12, 63, 1.3, 'W');
	put(12, 63, 'R');
	kid(20, 47, 'B', 'R', { dress: true });

	// ---------- wedding procession ----------
	// two rows of five, walking up to the right; each child: coat, hat, d for a dress
	const topRow = 'BK WRd RKd WB GRd'.split(' ');
	const botRow = 'RWd GK KWd BR RWd'.split(' ');
	for (let i = 0; i < 5; i++) {
		const x = 26 + 4 * i;
		const rise = Math.floor((i + 1) / 2);
		const [t, b] = [topRow[i], botRow[i]];
		kid(x, 54 - rise, t[0], t[1], { dress: t[2] === 'd' });
		kid(x, 61 - rise, b[0], b[1], { dress: b[2] === 'd', legs: b[0] === 'K' ? 'N' : 'K' });
	}
	dots('W', [33, 55], [35, 55]);
	put(34, 54, 'R');
	rect(45, 54, 47, 55, 'W');
	rect(45, 53, 47, 53, 'R');
	put(44, 54, 'K');
	dots('R', [46, 49], [47, 49], [44, 47], [45, 47], [46, 59], [47, 59]);
	kid(30, 47, 'G', 'W', { up: true });
	kid(40, 65, 'W', 'B', { dress: true });

	// ---------- leapfrog ----------
	// a child bent over, hands on knees, head to the right
	const back = (x: number, y: number, col: string) => {
		rect(x - 1, y - 2, x + 2, y - 1, col);
		put(x - 1, y, 'K');
		put(x, y, 'K');
		put(x + 2, y, col);
		put(x + 3, y - 1, 'F');
		put(x + 3, y - 2, 'K');
	};
	back(50, 64, 'B');
	back(56, 61, 'R');
	back(62, 58, 'G');
	back(68, 55, 'B');
	rect(62, 53, 64, 54, 'W');
	put(63, 52, 'F');
	put(63, 51, 'K');
	put(63, 55, 'W');
	dots('K', [61, 55], [60, 56], [65, 55], [66, 56]);
	kid(51, 57, 'W', 'R', { up: true });
	kid(53, 49, 'G', 'R', { up: true });
	kid(61, 48, 'R', 'W', { up: true });
	disk(57, 45, 1.3, 'W');
	put(57, 45, 'B');

	// ---------- riding the barrel ----------
	ell(83, 59, 6.5, 4.2, 'N');
	rect(79, 55, 79, 63, 'K');
	rect(83, 55, 83, 63, 'K');
	rect(87, 55, 87, 63, 'K');
	dots('T', [81, 57], [85, 57], [81, 61], [85, 61]);
	rect(76, 57, 76, 61, 'K');
	rect(90, 57, 90, 61, 'K');
	kid(81, 54, 'R', 'B', { up: true });
	kid(86, 54, 'B', 'W');
	dots('K', [80, 55], [82, 55], [85, 55], [87, 55]);
	kid(93, 62, 'G', 'K');
	put(91, 60, 'G');
	rect(74, 48, 77, 52, 'N');
	rect(74, 49, 77, 49, 'K');
	rect(74, 51, 77, 51, 'K');
	kid(80, 52, 'W', 'R');
	put(78, 50, 'W');

	// ---------- the long wall down the right side ----------
	rect(113, 44, 119, 87, 'N');
	rect(112, 44, 112, 87, 'K');
	for (const y of [47, 57, 76]) {
		rect(115, y, 117, y + 3, 'K');
		rect(115, y + 4, 117, y + 4, 'W');
	}
	rect(113, 54, 119, 54, 'T');
	rect(113, 73, 119, 73, 'T');
	rect(114, 64, 117, 70, 'K');
	kid(116, 70, 'W', 'R', { legs: 'E' });

	// ---------- running the gauntlet ----------
	for (let i = 0; i < 4; i++) {
		const x = 99 + i * 4;
		put(x, 49, i % 2 ? 'K' : 'R');
		put(x, 50, 'F');
		rect(x - 1, 51, x + 1, 51, 'RBWG'[i]);
		put(x, 52, 'K');
		put(x, 53, 'K');
		put(x, 62, 'F');
		rect(x - 1, 61, x + 1, 61, 'BWGR'[i]);
		put(x, 60, 'K');
		put(x, 59, 'K');
		put(x, 63, i % 2 === 0 ? 'K' : 'B');
	}
	rect(103, 56, 106, 56, 'R');
	put(107, 56, 'F');
	put(107, 55, 'K');
	put(102, 56, 'K');
	put(101, 56, 'K');

	// ---------- the shed and the hobby horse ----------
	rect(0, 70, 12, 85, 'N');
	rect(0, 66, 14, 69, 'K');
	rect(0, 68, 13, 68, 'E');
	for (const x of [3, 6, 9]) rect(x, 70, x, 74, 'K');
	rect(4, 76, 8, 85, 'K');
	kid(6, 85, 'W', 'R', { legs: 'E', dress: true });
	rect(10, 78, 11, 80, 'W');
	kid(18, 83, 'B', 'R');
	line(14, 85, 22, 79, 'K');
	rect(21, 77, 23, 78, 'W');
	put(21, 76, 'W');
	put(22, 77, 'K');
	put(18, 82, 'B');
	kid(17, 73, 'R', 'W', { up: true });
	line(19, 70, 22, 68, 'K');

	// ---------- hoops ----------
	ring(36, 76, 3.4, 'K');
	kid(29, 79, 'R', 'B');
	line(31, 77, 33, 77, 'N');
	ring(43, 84, 3, 'N');
	kid(36, 87, 'B', 'W', { dress: true });
	line(38, 85, 40, 85, 'K');
	rect(26, 69, 29, 70, 'W');
	put(30, 68, 'W');
	put(30, 69, 'W');
	put(26, 71, 'W');
	put(29, 71, 'W');
	put(25, 68, 'W');
	put(31, 69, 'K');
	kid(45, 72, 'G', 'R');
	ring(38, 70, 2.8, 'K');
	line(41, 70, 43, 70, 'N');
	put(38, 67, 'R');

	// ---------- whirligigs ----------
	const wheel = (x: number, y: number, a: string, b: string) => {
		for (const [dx, dy] of points('-1,0 1,0 0,-1 0,1 -2,0 2,0 0,-2 0,2')) put(x + dx, y + dy, a);
		dots(b, [x - 1, y - 1], [x + 1, y + 1], [x + 1, y - 1], [x - 1, y + 1]);
		put(x, y, 'K');
	};
	kid(52, 80, 'G', 'R');
	line(54, 78, 58, 74, 'K');
	wheel(59, 73, 'R', 'W');
	kid(69, 84, 'R', 'B');
	line(67, 82, 64, 79, 'K');
	wheel(63, 78, 'B', 'W');
	kid(54, 87, 'W', 'K', { dress: true });
	dots('K', [56, 85], [57, 85]);
	wheel(60, 85, 'G', 'R');
	rect(65, 68, 67, 70, 'R');
	rect(65, 68, 67, 68, 'W');
	kid(62, 71, 'B', 'W');
	put(64, 69, 'K');
	kid(51, 70, 'W', 'B', { up: true });

	// ---------- king of the hill ----------
	ell(83, 87, 10.5, 8.5, 'N');
	dots('T', [78, 84], [79, 84], [87, 82], [88, 82], [83, 86], [84, 86], [90, 86], [76, 87]);
	kid(83, 78, 'R', 'W', { up: true });
	line(85, 76, 85, 71, 'K');
	rect(86, 71, 88, 72, 'B');
	kid(77, 82, 'W', 'B', { up: true });
	kid(89, 81, 'B', 'R');
	kid(73, 86, 'G', 'K');
	kid(94, 85, 'W', 'R', { up: true });
	kid(75, 72, 'B', 'R');
	kid(93, 71, 'G', 'W', { dress: true });

	// ---------- marbles ----------
	ring(104, 81, 3.6, 'K', 0.8);
	dots('W', [103, 80], [105, 82]);
	put(105, 80, 'R');
	put(103, 82, 'B');
	kid(98, 82, 'R', 'K');
	kid(110, 82, 'B', 'W');
	kid(104, 75, 'G', 'R', { dress: true });
	kid(104, 87, 'W', 'B');
	rect(98, 68, 100, 69, 'W');
	put(101, 67, 'W');
	put(98, 70, 'W');
	put(100, 70, 'W');
	put(102, 67, 'K');
	kid(109, 71, 'R', 'W', { up: true });
}

export const games: Mural = {
	file: '00j-childrens-games',
	name: "Children's Games",
	prefix: 'childrens-games',
	notes: 'F',
	cols: 5,
	// O and T the square's two sands, E stone, N brick and wood, G and L grass, D dark leaves,
	// S water and sky, F skin
	palette: {
		O: '#d9993a',
		T: '#f0d596',
		E: '#9a9892',
		N: '#9c4324',
		K: '#2b1b16',
		R: '#d42c28',
		B: '#2a5aae',
		W: '#ffffff',
		G: '#4f9a3e',
		L: '#c6e06a',
		D: '#255c36',
		S: '#86c8ee',
		F: '#f29c86'
	},
	ground: 'O',
	panels: [
		['swimming', 'Swimming', { mode: 'lydian', spice: 'gentle', lead: 'flute' }],
		['tree-climbing', 'Tree Climbing', { mode: 'pentatonic', spice: 'lively', lead: 'kalimba' }],
		['stilts', 'Stilts', { mode: 'mixolydian', spice: 'adventurous', lead: 'pizz', meter: 5 }],
		['ring-dance', 'Ring Dance', { mode: 'major', spice: 'lively', lead: 'harp', meter: 3 }],
		[
			'follow-the-leader',
			'Follow the Leader',
			{ mode: 'mixolydian', spice: 'gentle', lead: 'brass' }
		],
		['headstands', 'Headstands', { mode: 'dorian', spice: 'lively', lead: 'mallet' }],
		[
			'spinning-tops',
			'Spinning Tops',
			{ mode: 'dorian', spice: 'lively', lead: 'vibes', meter: 3 }
		],
		['blind-mans-buff', "Blind Man's Buff", { mode: 'minor', spice: 'adventurous', lead: 'pizz' }],
		['tug-of-war', 'Tug of War', { mode: 'mixolydian', spice: 'lively', lead: 'brass' }],
		[
			'piggyback-fight',
			'Piggyback Fight',
			{ mode: 'phrygian', spice: 'adventurous', lead: 'string' }
		],
		['fence-riders', 'Fence Riders', { mode: 'harmonic', spice: 'gentle', lead: 'kalimba' }],
		[
			'wedding-procession',
			'Wedding Procession',
			{ mode: 'pentatonic', spice: 'gentle', lead: 'string' }
		],
		['leapfrog', 'Leapfrog', { mode: 'lydian', spice: 'lively', lead: 'mallet' }],
		['barrel-ride', 'Barrel Ride', { mode: 'mixolydian', spice: 'lively', lead: 'keys' }],
		[
			'running-the-gauntlet',
			'Running the Gauntlet',
			{ mode: 'minor', spice: 'lively', lead: 'pizz', meter: 7 }
		],
		[
			'hobby-horse',
			'Hobby Horse',
			{ mode: 'minor-pentatonic', spice: 'gentle', lead: 'harp', meter: 3 }
		],
		['hoop-rolling', 'Hoop Rolling', { mode: 'lydian', spice: 'gentle', lead: 'vibes' }],
		['whirligigs', 'Whirligigs', { mode: 'dorian', spice: 'gentle', lead: 'flute' }],
		[
			'king-of-the-hill',
			'King of the Hill',
			{ mode: 'minor', spice: 'adventurous', lead: 'brass' }
		],
		['marbles', 'Marbles', { mode: 'major', spice: 'gentle', lead: 'keys' }]
	],
	draw
};
