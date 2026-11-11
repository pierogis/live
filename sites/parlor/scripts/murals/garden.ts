/*
 * Hieronymus Bosch, The Garden of Earthly Delights (about 1500): Eden on the left, the
 * crowded garden in the middle, and hell on the right. 6 by 4 panels.
 */
import { int, mod, round, type Canvas } from './canvas.ts';
import type { Mural } from './mural.ts';

const W = 144;
const H = 88;
const EX = 108; // where hell starts
const HOR = 21;

/** How high Eden's blue hills stand at this column. */
function peak(x: number): number {
	return Math.max(
		8 - Math.abs(x - 5) * 1.1,
		11 - Math.abs(x - 15) * 1.2,
		7 - Math.abs(x - 31) * 0.9,
		2
	);
}

function draw(c: Canvas) {
	const { put, rect, disk, ell, line, dots, get, at } = c;

	// ---------- Eden and the garden share a sky and a lawn ----------
	// Bands of blue sky and white cloud with scalloped edges.
	for (let y = 0; y < HOR; y++) {
		for (let x = 0; x < EX; x++) {
			const yy = y + Math.abs(Math.sin((x * Math.PI) / 9)) * 2.4;
			c.g[y][x] = yy < 5 ? 'S' : yy < 9.5 ? 'W' : yy < 13.5 ? 'S' : yy < 17.5 ? 'W' : 'S';
		}
	}
	// Wavy bands of two greens, sprinkled with dark tufts.
	for (let y = HOR; y < H; y++) {
		for (let x = 0; x < EX; x++) {
			const yy = y + Math.sin((x * Math.PI) / 8) * 1.8;
			const tuft = (x + Math.floor(y / 3) * 4) % 8 === 0 && y % 3 === 0;
			c.g[y][x] = tuft ? 'D' : mod(int(Math.floor((yy - HOR) / 6)), 2) === 0 ? 'G' : 'L';
		}
	}

	// A small bare person: hair, arms out, body, legs.
	const person = (x: number, y: number, hair = 'K', skin = 'F') => {
		put(x, y - 3, hair);
		put(x, y - 2, skin);
		put(x - 1, y - 2, skin);
		put(x + 1, y - 2, skin);
		put(x, y - 1, skin);
		put(x, y, skin);
	};
	// A round dark tree with two fruits.
	const tree = (x: number, y: number, r = 2.5, fruit = 'R') => {
		rect(x, y - 3, x, y, 'K');
		disk(x, y - 3 - r, r, 'D');
		put(x - 1, y - 3 - r, fruit);
		put(x + 1, y - 4 - r, fruit);
	};
	// A small flame.
	const fire = (x: number, y: number) => {
		put(x, y, 'O');
		put(x, y - 1, 'Y');
		put(x, y + 1, 'R');
	};
	// Is there open lawn here, enough for a person to stand on?
	const free = (xx: number, yy: number) => {
		for (const dx of [-1, 0, 1]) {
			for (let dy = -1; dy < 5; dy++) if (!'GDL'.includes(get(xx + dx, yy - dy))) return false;
		}
		return true;
	};

	// ---------- Left wing: Eden ----------
	// Blue hills along the horizon.
	for (let x = 0; x < 36; x++) {
		for (let y = int(HOR + 1 - peak(x)); y < HOR + 2; y++) put(x, y, 'B');
	}
	// The pink rock with its stream of birds.
	rect(23, 6, 26, 20, 'P');
	rect(24, 3, 25, 5, 'P');
	disk(24.5, 11, 3.6, 'P');
	disk(24.5, 11, 1.6, 'K');
	rect(20, 16, 29, 16, 'P');
	dots('P', [21, 15], [28, 15], [24, 2], [22, 8], [27, 8]);
	dots('B', [24, 18], [25, 18]);
	dots('W', [23, 9], [26, 13]);
	for (let i = 0; i < 10; i++) {
		const t = i / 9;
		put(21 - t * 19, 10 - 8 * Math.sin(t * 2.3), 'K');
		put(20 - t * 19, 10 - 8 * Math.sin(t * 2.3), 'K');
	}
	// White birds on the hills, and a row of trees below them.
	dots('W', [9, 17], [10, 17], [4, 18], [33, 18]);
	for (const x of [3, 11, 19, 32]) tree(x, 27, 2);
	// Elephant and giraffe.
	at(2, 6);
	ell(3.5, 29, 3.2, 2.3, 'W');
	rect(1, 31, 2, 33, 'W');
	rect(5, 31, 6, 33, 'W');
	rect(0, 27, 1, 28, 'W');
	rect(0, 29, 0, 32, 'W');
	put(1, 27, 'K');
	dots('P', [2, 28], [3, 28], [3, 29]);
	at(9, 4);
	rect(18, 28, 22, 29, 'Y');
	rect(22, 22, 22, 27, 'Y');
	rect(22, 21, 23, 21, 'Y');
	rect(18, 30, 18, 33, 'Y');
	rect(21, 30, 21, 33, 'Y');
	dots('O', [19, 28], [21, 29], [22, 24], [22, 26], [20, 28]);
	put(23, 20, 'K');
	put(17, 29, 'K');
	at();
	// a unicorn's back
	dots('W', [14, 37], [15, 37], [15, 36], [16, 37], [15, 35], [14, 34]);
	person(22, 40, 'Y');
	person(7, 42);
	// Pond with the pink fountain.
	ell(17.5, 55, 15, 6.5, 'B');
	ell(17.5, 54, 6, 2.2, 'K');
	rect(17, 34, 18, 53, 'P');
	disk(17.5, 46, 4.2, 'P');
	disk(17.5, 46, 1.7, 'K');
	rect(12, 40, 23, 40, 'P');
	rect(14, 51, 21, 51, 'P');
	rect(15, 37, 20, 37, 'P');
	dots(
		'P',
		[17, 33],
		[18, 32],
		[12, 39],
		[23, 39],
		[11, 38],
		[24, 38],
		[15, 36],
		[20, 36],
		[13, 52],
		[22, 52]
	);
	dots('Y', [17, 42], [18, 43], [14, 51], [21, 51], [17, 35]);
	dots('W', [15, 45], [18, 38], [20, 48]);
	dots('Y', [17, 46], [18, 46]);
	// swans
	for (const [x, y] of [
		[6, 56],
		[27, 58],
		[10, 59],
		[24, 53]
	]) {
		dots('W', [x, y], [x + 1, y], [x + 1, y - 1]);
	}
	dots('K', [4, 54], [30, 55], [20, 60]);
	tree(33, 47, 2.4);
	tree(1, 49, 2);
	// The meeting of Adam and Eve, a dragon tree, and a dark pool.
	at(6, 24);
	// The dragon tree with its red fruit.
	rect(3, 45, 4, 55, 'K');
	disk(3.5, 43, 3.6, 'D');
	disk(1, 46, 2.2, 'D');
	disk(6.5, 46, 2.2, 'D');
	dots('R', [2, 42], [5, 44], [1, 46], [6, 46], [4, 41]);
	// The figure in a long pink robe, standing between the two.
	for (let dy = 0; dy < 11; dy++) {
		const w = 1 + Math.floor(dy / 3);
		rect(13 - w, 48 + dy, 13 + w, 48 + dy, 'P');
	}
	dots('F', [13, 46], [13, 47], [12, 47], [14, 47], [10, 51], [16, 50]);
	dots('K', [13, 45]);
	dots('Y', [12, 44], [13, 44], [14, 44]);
	dots('W', [13, 50], [13, 53], [13, 56]);
	// Adam, sitting on the grass.
	dots('K', [7, 51]);
	dots(
		'F',
		[7, 52],
		[7, 53],
		[8, 53],
		[7, 54],
		[8, 54],
		[9, 54],
		[10, 54],
		[11, 55],
		[7, 55],
		[6, 55]
	);
	// Eve, kneeling, with long fair hair.
	dots('Y', [19, 49], [20, 50], [20, 51]);
	dots(
		'F',
		[19, 50],
		[19, 51],
		[18, 51],
		[19, 52],
		[19, 53],
		[19, 54],
		[20, 54],
		[21, 54],
		[17, 51]
	);
	at();
	// The dark pool, with small creatures in it and around it.
	ell(18, 86, 12, 3.6, 'B');
	dots('K', [12, 85], [13, 86], [14, 85], [21, 86], [22, 85], [17, 87], [26, 86]);
	dots('W', [18, 84], [19, 84], [19, 83], [9, 86]);
	dots('W', [31, 80], [32, 80], [32, 79], [2, 82], [3, 82], [3, 81]);
	dots('O', [27, 71], [28, 71], [28, 70]);
	dots('K', [1, 76], [2, 76]);
	// A thin palm at the edge of Eden.
	rect(32, 62, 32, 72, 'K');
	for (const [dx, dy] of [
		[-2, 0],
		[-1, -1],
		[0, -1],
		[1, -1],
		[-3, 1],
		[-2, -2],
		[1, 0],
		[2, 1],
		[3, 2],
		[-4, 2]
	]) {
		put(32 + dx, 62 + dy, 'D');
	}

	// ---------- Centre: the garden ----------
	const MX = 71.5;
	// A lake across the back, its shores broken by grass.
	rect(36, HOR + 1, 107, 29, 'B');
	for (let x = 36; x < 108; x++) {
		if (Math.floor(x / 6) % 2 === 0) {
			put(x, 29, 'G');
			put(x, 28, [2, 3].includes(x % 6) ? 'G' : 'B');
		}
		if (Math.floor(x / 5) % 3 === 0) put(x, HOR + 1, 'G');
	}
	// A tall tower growing from a ball, with rings and horns in a second color.
	const tower = (cx: number, base: number, a: string, b: string, tall: number) => {
		const top = base - tall;
		disk(cx, base, 4.2, a);
		disk(cx, base, 1.4, 'K');
		rect(cx - 1, top + 4, cx + 1, base - 3, a);
		rect(cx, top, cx, top + 3, a);
		rect(cx - 4, top + 7, cx + 4, top + 7, b);
		rect(cx - 3, top + 11, cx + 3, top + 11, b);
		rect(cx - 2, top + 4, cx + 2, top + 4, b);
		dots(b, [cx - 5, top + 6], [cx + 5, top + 6], [cx - 5, top + 5], [cx + 5, top + 5]);
		dots('W', [cx - 3, base + 3], [cx + 3, base + 3], [cx - 1, top + 9]);
		dots('R', [cx, top - 1]);
		dots('Y', [cx, top + 14]);
	};
	tower(45, 25, 'P', 'B', 20);
	tower(57, 24, 'B', 'P', 15);
	tower(86, 24, 'B', 'P', 15);
	tower(98, 25, 'P', 'B', 20);
	// The blue globe in the middle, with its pink crown.
	disk(MX, 22, 7.8, 'W');
	disk(MX, 22, 6.8, 'B');
	disk(MX, 23, 2.2, 'K');
	dots('Y', [71, 23], [72, 23]);
	dots('W', [67, 19], [68, 18], [76, 19], [75, 18]);
	ell(MX, 22, 9.5, 1.2, 'P', (x) => Math.abs(x - MX) > 6.5);
	rect(71, 2, 72, 14, 'P');
	rect(66, 10, 77, 10, 'P');
	rect(68, 6, 75, 6, 'P');
	dots('P', [65, 9], [78, 9], [65, 8], [78, 8], [67, 5], [76, 5], [69, 12], [74, 12]);
	dots('R', [71, 1], [72, 1]);
	dots('Y', [71, 8], [72, 8]);
	// Things in the air.
	const flyer = (x: number, y: number, a: string, b: string) => {
		dots(a, [x - 1, y], [x, y - 1], [x + 1, y]);
		put(x, y + 1, b);
	};
	flyer(38, 5, 'K', 'R');
	flyer(51, 2, 'W', 'F');
	flyer(63, 12, 'K', 'F');
	flyer(81, 4, 'K', 'R');
	flyer(92, 2, 'P', 'F');
	flyer(105, 8, 'K', 'B');
	flyer(79, 13, 'W', 'R');
	dots('R', [51, 4]);
	dots('B', [92, 4], [93, 5]);
	// Groves at the sides.
	for (const [x, y] of [
		[38, 38],
		[105, 38],
		[37, 60],
		[106, 61],
		[41, 48],
		[102, 49]
	]) {
		tree(x, y, 2.2);
	}
	// The round pond and the ring of riders.
	const CX = MX;
	const CY = 49;
	ell(CX, CY, 11.4, 6.6, 'W');
	ell(CX, CY, 10.3, 5.5, 'B');
	// Bathers in the pond, dark and fair, with birds and fruit among them.
	const bathers: [x: number, y: number, hair: string][] = [
		[65, 48, 'K'],
		[68, 51, 'Y'],
		[72, 47, 'K'],
		[76, 50, 'K'],
		[69, 46, 'Y'],
		[74, 52, 'K'],
		[78, 47, 'Y'],
		[64, 51, 'K']
	];
	for (const [x, y, h] of bathers) {
		put(x, y, 'F');
		put(x, y - 1, h);
	}
	dots('W', [66, 52], [77, 46], [71, 50]);
	dots('R', [72, 50], [70, 48], [75, 48]);
	// Sixteen riders circle the pond, each on a beast of a different color.
	const beasts = ['K', 'W', 'O', 'R', 'Y', 'P', 'V', 'B'];
	const N = 16;
	for (let i = 0; i < N; i++) {
		const a = (2 * Math.PI * i) / N + 0.2;
		const x = round(CX + 25 * Math.cos(a));
		const y = round(CY + 12.5 * Math.sin(a));
		const b = beasts[(i * 3) % beasts.length];
		// Which way the beast faces: 1 is right, -1 is left.
		const f = Math.sin(a) < 0 ? 1 : -1;
		// The beast: body, two legs, head and tail.
		rect(x - 2, y, x + 2, y + 1, b);
		rect(x - 2, y + 2, x - 2, y + 3, b);
		rect(x + 2, y + 2, x + 2, y + 3, b);
		const hx = f > 0 ? x + 3 : x - 3;
		put(hx, y - 1, b);
		put(hx, y, b);
		put(hx + f, y - 1, b);
		put(f > 0 ? x - 3 : x + 3, y + 1, b);
		// antlers
		if (i % 4 === 1) {
			put(hx, y - 2, b);
			put(hx - f, y - 3, b);
		}
		// The rider, arms out.
		put(x, y - 1, 'F');
		put(x, y - 2, 'F');
		put(x - f, y - 2, 'F');
		put(x + f, y - 2, 'F');
		put(x, y - 3, i % 3 ? 'K' : 'Y');
	}
	// The crowd below: great birds, a duck, big fruit, a bubble, a shell.
	at(24, 22);
	ell(40, 47.5, 6.5, 2.4, 'B');
	rect(40, 46, 43, 47, 'W');
	rect(43, 44, 44, 45, 'D');
	put(45, 45, 'Y');
	put(39, 45, 'W');
	// goldfinch
	at(16, 22);
	ell(29.5, 51, 3.8, 4.3, 'O');
	ell(28, 52, 2.2, 3, 'K');
	rect(27, 51, 29, 51, 'Y');
	rect(27, 53, 28, 53, 'Y');
	disk(31.5, 46.5, 2.3, 'R');
	rect(30, 44, 33, 44, 'K');
	dots('W', [32, 47], [33, 47]);
	dots('K', [32, 46]);
	rect(34, 46, 35, 46, 'W');
	rect(29, 56, 29, 57, 'K');
	rect(31, 56, 31, 57, 'K');
	rect(25, 54, 26, 56, 'K');
	at();
	// a kingfisher beside it
	at(-4, 9);
	ell(57, 73, 3.2, 3.8, 'B');
	ell(58, 74.5, 2, 2.4, 'O');
	disk(58.5, 68.5, 2.1, 'B');
	rect(60, 68, 63, 68, 'K');
	dots('W', [58, 69], [59, 70]);
	dots('K', [59, 68]);
	rect(56, 77, 56, 78, 'K');
	rect(58, 77, 58, 78, 'K');
	at();
	// A giant strawberry with gold seeds and a green cap.
	at(26, 22);
	disk(41, 60, 4.2, 'R');
	dots('Y', [39, 59], [41, 58], [43, 59], [40, 61], [42, 61], [41, 63], [38, 61], [44, 61]);
	rect(39, 56, 43, 56, 'D');
	rect(41, 54, 41, 55, 'D');
	put(38, 57, 'D');
	put(44, 57, 'D');
	// A clear bubble with two people inside, resting on pink petals.
	at(12, 22);
	c.ring(30.5, 61, 4.4, 'W', 1.0);
	dots('F', [29, 61], [29, 62], [32, 61], [32, 62]);
	dots('K', [29, 60]);
	dots('Y', [32, 60]);
	dots('P', [26, 65], [27, 65], [34, 65], [35, 65], [30, 65], [31, 65]);
	// blue pod
	at(24, 22);
	disk(55, 50, 4.6, 'B');
	rect(51, 49, 59, 49, 'K');
	dots('F', [53, 48], [55, 48], [57, 48]);
	dots('K', [53, 47], [57, 47]);
	dots('Y', [55, 47]);
	dots('W', [53, 52], [57, 51], [55, 53]);
	rect(55, 44, 55, 45, 'D');
	dots('D', [54, 44], [56, 43]);
	// cherries
	at(30, 22);
	disk(63, 47, 2.2, 'R');
	disk(69, 48, 2.2, 'R');
	line(63, 44, 66, 42, 'D');
	line(69, 45, 66, 42, 'D');
	put(62, 46, 'W');
	put(68, 47, 'W');
	dots('D', [67, 42], [68, 43]);
	// pink tent
	at(28, 22);
	for (let dy = 0; dy < 7; dy++) {
		const half = Math.floor(dy / 2) + 1;
		rect(60 - half, 55 + dy, 60 + half, 55 + dy, 'P');
	}
	dots('B', [60, 54], [60, 53]);
	rect(60, 59, 60, 61, 'K');
	dots('B', [58, 58], [62, 58]);
	// mussel shell
	at(34, 22);
	ell(67.5, 62, 3.8, 2.4, 'K');
	ell(67.5, 61.4, 2.8, 1.2, 'V');
	dots('F', [71, 60], [71, 61], [70, 60]);
	dots('W', [66, 61]);
	// orange fruit and an owl
	at(24, 22);
	disk(51, 61, 2.6, 'O');
	rect(51, 57, 51, 58, 'D');
	put(52, 57, 'D');
	put(50, 60, 'Y');
	rect(46, 53, 48, 56, 'K');
	dots('Y', [46, 54], [48, 54]);
	dots('W', [47, 55]);
	at();
	// People wherever the ground is free.
	let k = 0;
	for (let y = 68; y < 88; y += 6) {
		for (let x = 38; x < 107; x += 5) {
			k += 1;
			const xx = x + ((k * 7) % 3);
			const yy = y + ((k * 5) % 3);
			if (yy < 88 && free(xx, yy)) person(xx, yy, k % 3 ? 'K' : 'Y', k % 5 ? 'F' : 'K');
		}
	}
	for (const [x, y] of [
		[48, 64],
		[58, 65],
		[84, 65],
		[95, 64],
		[71, 65],
		[40, 44],
		[103, 44],
		[50, 36],
		[93, 36],
		[64, 34],
		[79, 34]
	]) {
		if (free(x, y)) person(x, y, x % 2 ? 'K' : 'Y');
	}

	// ---------- Right wing: hell ----------
	// A night sky in thin bands, wide dusky bands below it, and black ground at the bottom.
	for (let y = 0; y < H; y++) {
		for (let x = EX; x < W; x++) {
			const yy = y + Math.sin((x * Math.PI) / 6) * 1.6;
			if (y < 16) c.g[y][x] = mod(int(Math.floor(yy / 4)), 2) === 0 ? 'N' : 'V';
			else if (yy < 67) c.g[y][x] = mod(int(Math.floor(yy / 6)), 2) === 0 ? 'V' : 'N';
			else c.g[y][x] = mod(int(Math.floor(yy / 4)), 3) === 0 ? 'N' : 'K';
		}
	}
	// Four fires in the sky, each red, then orange, then yellow at its heart.
	const blazes: [cx: number, cy: number, r: number][] = [
		[114, 9, 4.5],
		[125, 6, 5],
		[135, 10, 4],
		[141, 5, 3]
	];
	for (const [cx, cy, r] of blazes) {
		disk(cx, cy, r, 'R');
		disk(cx, cy + 0.5, r - 1.3, 'O');
		disk(cx, cy + 1, r - 2.6, 'Y');
	}
	// beams of light
	for (let i = 0; i < 22; i++) {
		if (i % 3 !== 2) put(125 - i * 0.8, 6 + i * 0.6, 'Y');
		if (i % 3 !== 0 && i > 8) put(118 + i * 0.9, 3 + i * 0.7, 'Y');
	}
	// The burning town: black buildings, the tall ones with lit windows and spires.
	const heights = [6, 9, 5, 11, 7, 4, 10, 6, 8, 5, 12, 7, 9, 4, 8, 11, 6, 9];
	heights.forEach((h, i) => {
		const x0 = EX + i * 2;
		rect(x0, 17 - h, x0 + 1, 17, 'K');
		if (h > 6) {
			put(x0, 17 - h + 2, 'O');
			put(x0 + 1, 17 - h + 5, 'Y');
		}
		if (h > 9) put(x0, 17 - h - 1, 'K');
	});
	// The river below the town, with the fires glinting on it.
	rect(EX, 18, 143, 23, 'B');
	for (let x = EX; x < W; x++) {
		if ((x * 3) % 7 < 2) put(x, 19, 'O');
		if ((x * 5) % 9 < 2) put(x, 21, 'R');
		if ((x * 2) % 11 < 2) put(x, 23, 'Y');
		if (x % 4 === 1) put(x, 18, 'K');
	}
	// A bridge with a small army crossing.
	rect(EX, 26, 143, 26, 'K');
	for (let x = EX + 1; x < W; x += 3) {
		put(x, 25, x % 2 ? 'O' : 'F');
		if (x % 6 < 3) put(x, 27, 'K');
	}
	// Ears with a knife.
	at(42, 8);
	ell(75, 25.5, 2.6, 3.2, 'F');
	ell(81, 25.5, 2.6, 3.2, 'F');
	dots('P', [75, 25], [75, 26], [81, 25], [81, 26], [75, 27], [81, 27]);
	rect(77, 20, 79, 26, 'W');
	rect(78, 18, 79, 19, 'W');
	rect(77, 27, 79, 29, 'Y');
	put(78, 30, 'Y');
	at();
	// A lantern, a ladder, fires.
	rect(135, 31, 138, 36, 'Y');
	rect(136, 32, 137, 35, 'W');
	rect(135, 30, 138, 30, 'K');
	rect(136, 28, 137, 29, 'K');
	rect(135, 37, 138, 37, 'K');
	for (const [x, y] of [
		[110, 31],
		[113, 40],
		[141, 41],
		[131, 40],
		[110, 46],
		[142, 52],
		[109, 57]
	]) {
		fire(x, y);
	}
	for (const [x, y] of [
		[127, 36],
		[132, 42],
		[111, 37]
	]) {
		person(x, y, 'K');
	}
	// The tree man on a dark pond.
	at(41, 20);
	ell(84, 42.5, 13.5, 2.8, 'B');
	// The two boats he stands in.
	rect(74, 41, 81, 42, 'O');
	rect(87, 41, 94, 42, 'O');
	put(73, 40, 'O');
	put(95, 40, 'O');
	put(82, 40, 'O');
	put(86, 40, 'O');
	// His legs, white like dead tree trunks.
	rect(78, 37, 79, 40, 'W');
	rect(89, 37, 90, 40, 'W');
	dots('W', [77, 39], [91, 39], [80, 37], [88, 37], [77, 40], [91, 40]);
	// His hollow body, a broken shell with a lit room inside.
	ell(84.5, 34.5, 8, 3.8, 'W');
	ell(89, 35, 3.2, 2.4, 'K');
	dots('O', [88, 35], [90, 36]);
	dots('Y', [89, 35]);
	// His face, looking back over his shoulder.
	rect(76, 32, 78, 35, 'F');
	dots('K', [76, 31], [77, 31], [78, 31], [76, 33]);
	put(75, 35, 'F');
	// The flat disc on his head, with a pink bagpipe and small walkers on it.
	rect(78, 30, 93, 30, 'Y');
	rect(81, 29, 90, 29, 'Y');
	disk(86, 25.5, 2.8, 'P');
	rect(88, 21, 88, 24, 'P');
	put(89, 20, 'P');
	rect(85, 28, 86, 28, 'P');
	dots('W', [86, 25]);
	dots('F', [82, 28], [91, 28]);
	dots('K', [82, 27], [91, 27]);
	// The ladder leaning against him.
	line(95, 41, 99, 31, 'Y');
	line(97, 41, 101, 31, 'Y');
	dots('Y', [97, 38], [98, 35], [99, 33]);
	at();
	// Musical hell: a harp, a lute, and the bird-headed prince on his high chair.
	at(37, 22);
	// The harp, with a person strung up in its strings.
	rect(74, 46, 75, 59, 'Y');
	line(75, 46, 82, 49, 'Y');
	line(75, 45, 82, 48, 'Y');
	line(82, 49, 77, 59, 'Y');
	rect(74, 59, 78, 60, 'Y');
	for (const x of [77, 79]) line(x, 48, x - 1, 58 - (x - 77) * 2, 'W');
	dots('F', [78, 52], [77, 53], [78, 53], [79, 53], [78, 54], [78, 55]);
	put(78, 51, 'K');
	// The lute.
	at(38, 22);
	disk(78, 63, 2.6, 'O');
	line(80, 61, 85, 57, 'O');
	rect(85, 55, 86, 56, 'O');
	dots('K', [78, 63]);
	dots('W', [81, 60], [83, 58]);
	// The prince: a gold chair, a blue bird's body and head, a pot for a hat.
	at(46, 22);
	rect(86, 57, 94, 58, 'Y');
	rect(87, 59, 87, 64, 'Y');
	rect(93, 59, 93, 64, 'Y');
	rect(87, 62, 93, 62, 'Y');
	rect(88, 51, 93, 56, 'B');
	rect(87, 47, 91, 51, 'B');
	rect(84, 48, 86, 49, 'Y');
	put(88, 48, 'W');
	rect(87, 45, 91, 46, 'K');
	rect(88, 44, 90, 44, 'K');
	// The person he is eating, and the pit under his chair.
	dots('F', [84, 50], [85, 50], [85, 51], [84, 52], [84, 51]);
	rect(94, 53, 95, 56, 'B');
	dots('W', [90, 53], [90, 55]);
	ell(90, 64.8, 2.6, 1.1, 'V');
	// A pale hound at his feet.
	at(42, 22);
	dots('W', [82, 64], [83, 64], [83, 63], [83, 62], [84, 61], [82, 65], [84, 64]);
	dots('P', [84, 63]);
	at();
	// A drum and a horn between them.
	rect(122, 68, 126, 72, 'R');
	rect(122, 68, 126, 68, 'W');
	rect(122, 72, 126, 72, 'W');
	dots('Y', [123, 70], [125, 70]);
	line(109, 85, 116, 86, 'Y');
	rect(108, 83, 109, 86, 'Y');
	for (const [x, y] of [
		[142, 70],
		[109, 68],
		[120, 76],
		[143, 84],
		[128, 86]
	]) {
		fire(x, y);
	}
	for (const [x, y] of [
		[116, 70],
		[129, 72]
	]) {
		person(x, y, 'K');
	}
	// Faint purple flecks in the black ground.
	for (let y = 68; y < H; y++) {
		for (let x = EX; x < W; x++) {
			if (get(x, y) === 'K' && (x + 2 * y) % 23 === 0) put(x, y, 'V');
		}
	}
}

export const garden: Mural = {
	file: '00i-earthly-delights',
	name: 'The Garden of Earthly Delights',
	prefix: 'earthly-delights',
	notes: 'D',
	cols: 6,
	rows: 4,
	// S sky, W cloud, G and L the lawn's two greens, D dark leaves, F skin, N night, V dusk.
	palette: {
		S: '#86c2e6',
		W: '#f7f4ec',
		B: '#2f6fb5',
		G: '#6fae5a',
		L: '#bcd85a',
		D: '#2e6b3e',
		P: '#ee8fa8',
		F: '#f2c39b',
		R: '#cf2f2f',
		Y: '#f5cf45',
		O: '#ee7d2b',
		K: '#33201a',
		N: '#12163a',
		V: '#8a3f8f'
	},
	ground: 'G',
	panels: [
		['birds-of-eden', 'Birds of Eden', { mode: 'lydian', spice: 'gentle', lead: 'flute' }],
		['pink-rock', 'Pink Rock', { mode: 'lydian', spice: 'gentle', lead: 'harp' }],
		['west-tower', 'West Tower', { mode: 'major', spice: 'lively', lead: 'harp', meter: 3 }],
		['east-tower', 'East Tower', { mode: 'major', spice: 'lively', lead: 'vibes', meter: 3 }],
		['edge-of-night', 'Edge of Night', { mode: 'dorian', spice: 'adventurous', lead: 'vibes' }],
		['burning-town', 'Burning Town', { mode: 'phrygian', spice: 'adventurous', lead: 'brass' }],
		['elephant', 'Elephant', { mode: 'major', spice: 'gentle', lead: 'mallet' }],
		['giraffe', 'Giraffe', { mode: 'mixolydian', spice: 'gentle', lead: 'kalimba' }],
		['blue-globe', 'Blue Globe', { mode: 'lydian', spice: 'lively', lead: 'vibes' }],
		[
			'riders-north',
			'Riders North',
			{ mode: 'mixolydian', spice: 'lively', lead: 'pizz', meter: 3 }
		],
		[
			'ears-and-knife',
			'Ears and Knife',
			{ mode: 'minor', spice: 'adventurous', lead: 'pizz', meter: 5 }
		],
		['lantern', 'Lantern', { mode: 'minor', spice: 'gentle', lead: 'keys' }],
		['fountain-of-life', 'Fountain of Life', { mode: 'major', spice: 'gentle', lead: 'kalimba' }],
		['swan-pond', 'Swan Pond', { mode: 'lydian', spice: 'gentle', lead: 'flute', meter: 3 }],
		[
			'riders-west',
			'Riders West',
			{ mode: 'mixolydian', spice: 'lively', lead: 'mallet', meter: 3 }
		],
		[
			'riders-east',
			'Riders East',
			{ mode: 'mixolydian', spice: 'lively', lead: 'string', meter: 3 }
		],
		['hollow-tree', 'Hollow Tree', { mode: 'dorian', spice: 'lively', lead: 'string' }],
		['tree-man', 'Tree Man', { mode: 'minor', spice: 'adventurous', lead: 'string' }],
		['adam', 'Adam', { mode: 'major', spice: 'gentle', lead: 'harp' }],
		['eve', 'Eve', { mode: 'major', spice: 'gentle', lead: 'flute' }],
		['strawberry', 'Strawberry', { mode: 'dorian', spice: 'lively', lead: 'flute' }],
		['blue-pod', 'Blue Pod', { mode: 'mixolydian', spice: 'gentle', lead: 'kalimba' }],
		['cherries', 'Cherries', { mode: 'dorian', spice: 'lively', lead: 'mallet' }],
		[
			'bird-prince',
			'Bird Prince',
			{ mode: 'phrygian', spice: 'adventurous', lead: 'harp', meter: 7 }
		]
	],
	draw
};
