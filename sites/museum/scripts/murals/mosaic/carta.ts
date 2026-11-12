// Olaus Magnus, Carta Marina (1539): a sea chart of the north, its waters full of
// monsters and ships, its land full of mountains, towns and kings. 5 by 4 panels.
import { inell, int, points, round, SIDES, type Canvas, type Point } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const W = 120;
const H = 88;

// ---------- where the land is ----------

function inpoly(x: number, y: number, pts: Point[]): boolean {
	let r = false;
	for (let i = 0; i < pts.length; i++) {
		const [x0, y0] = pts[i];
		const [x1, y1] = pts[(i + pts.length - 1) % pts.length];
		if (y0 > y !== y1 > y && x < x0 + ((x1 - x0) * (y - y0)) / (y1 - y0)) r = !r;
	}
	return r;
}

const SCANDINAVIA = points(
	'83,-3 79,10 75,20 72,30 68,42 66,54 65,62 66,69 70,72 76,69 80,70 85,73 91,72 94,66 96,56 ' +
		'96,40 97,27 105,27 106,40 108,54 110,59 116,60 116,64 111,66 110,72 111,79 107,82 98,82 ' +
		'90,83 80,83 78,77 75,74 71,75 69,80 69,83 60,83 53,84 50,92 124,92 124,-3'
);
const SCOTLAND = points('-4,75 5,76 9,80 12,84 12,92 -4,92');

// the spot is nudged by waves first, so the coast comes out ragged
function land(x: number, y: number): boolean {
	const xj = x + 1.2 * Math.sin(y * 0.9) + 0.8 * Math.sin(y * 2.3 + 1);
	const yj = y + 1.1 * Math.sin(x * 0.8) + 0.7 * Math.sin(x * 1.9);
	return (
		inpoly(xj, yj, SCANDINAVIA) ||
		inpoly(xj, yj, SCOTLAND) ||
		inell(xj, yj, 12.5, 15, 10.6, 5.6) || // Iceland
		inell(xj, yj, 43, 68.5, 3.6, 2.1) ||
		inell(xj, yj, 19.5, 83.5, 3, 2)
	);
}

// the cartouche's writing: blocky marks that look like letters and spell nothing
const GLYPH = [
	'0,0 0,1 0,2 1,0',
	'0,0 1,0 1,1 1,2',
	'0,0 0,1 0,2 1,2',
	'0,0 1,0 0,2 1,2 0,1',
	'1,0 0,1 1,1 1,2',
	'0,0 0,1 0,2 1,1',
	'0,0 1,1 0,2 1,2',
	'0,0 1,0 0,1 0,2 1,2'
].map(points);

function draw(c: Canvas) {
	const { put, rect, disk, ell, line, dots, get, at } = c;

	const LAND = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => land(x, y)));
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (LAND[y][x]) {
				const band = Math.floor((x * 0.6 + y + 3 * Math.sin(x / 4)) / 7);
				c.g[y][x] = band % 2 === 0 ? 'L' : 'C';
			} else {
				const yy = y + Math.abs(Math.sin((x * Math.PI) / 12)) * 2.4;
				c.g[y][x] = 'SBT'[Math.floor(yy / 5) % 3];
			}
		}
	}
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const onCoast = SIDES.some(([dx, dy]) => LAND[y + dy]?.[x + dx] === false);
			if (LAND[y][x] && onCoast) c.g[y][x] = 'N';
		}
	}

	// ---------- small things ----------

	const person = (x: number, y: number, coat: string) => {
		put(x, y - 3, 'K');
		put(x, y - 2, 'F');
		rect(x - 1, y - 1, x + 1, y - 1, coat);
		put(x, y, 'K');
	};
	const tree = (x: number, y: number) => {
		put(x, y, 'N');
		disk(x, y - 2, 1.5, 'G');
	};
	const mountain = (x: number, y: number, h: number, snow = true) => {
		for (let d = 0; d <= h; d++) rect(x - d, y - h + d, x + d, y - h + d, 'N');
		for (let d = 1; d <= h; d++) put(x + d, y - h + d, 'K');
		if (snow) {
			put(x, y - h, 'W');
			rect(x - 1, y - h + 1, x, y - h + 1, 'W');
		}
	};
	const ship = (x: number, y: number, sail: string, stripe: string, flag: string) => {
		rect(x - 4, y, x + 4, y, 'N');
		rect(x - 3, y + 1, x + 3, y + 1, 'K');
		put(x - 5, y - 1, 'N');
		put(x + 5, y - 1, 'N');
		rect(x, y - 7, x, y - 1, 'K');
		rect(x - 3, y - 6, x + 3, y - 2, sail);
		for (const dx of [-2, 0, 2]) rect(x + dx, y - 6, x + dx, y - 2, stripe);
		rect(x + 1, y - 8, x + 2, y - 8, flag);
	};
	const boat = (x: number, y: number, sail: string, flag = 'R') => {
		rect(x - 3, y, x + 3, y, 'N');
		rect(x - 2, y + 1, x + 2, y + 1, 'K');
		rect(x, y - 5, x, y - 1, 'K');
		rect(x - 2, y - 4, x + 2, y - 2, sail);
		put(x + 1, y - 5, flag);
	};
	const spout = (x: number, top: number, base: number) => {
		rect(x, top + 1, x, base, 'W');
		dots('W', [x - 1, top], [x + 1, top]);
		for (const dx of [-2, 2]) rect(x + dx, top + 1, x + dx, top + 2, 'W');
	};
	const house = (x: number, y: number) => {
		rect(x, y - 1, x + 2, y, 'W');
		rect(x, y - 2, x + 2, y - 2, 'R');
		put(x + 1, y - 3, 'R');
		put(x + 1, y, 'K');
	};
	const tower = (x: number, y: number, h: number, flag = 'Y') => {
		rect(x, y - h, x + 1, y, 'W');
		rect(x - 1, y - h - 1, x + 2, y - h - 1, 'R');
		rect(x, y - h - 2, x + 1, y - h - 2, 'R');
		put(x, y - h + 1, 'K');
		rect(x + 1, y - h - 4, x + 1, y - h - 3, 'K');
		put(x + 2, y - h - 4, flag);
	};
	const shield = (x: number, y: number, a: string, b: string, crowns = false) => {
		rect(x - 2, y - 2, x + 2, y + 1, a);
		rect(x - 1, y + 2, x + 1, y + 2, a);
		put(x, y + 3, a);
		if (crowns) {
			dots(b, [x - 1, y - 1], [x + 1, y - 1], [x, y + 1]);
		} else {
			rect(x - 1, y - 2, x - 1, y + 2, b);
			rect(x - 2, y - 1, x + 2, y - 1, b);
		}
	};
	// a fat line through the points: a tail, a neck, a claw arm
	const thick = (pts: Point[], r: number, col: string) => {
		for (let k = 0; k + 1 < pts.length; k++) {
			const [x0, y0] = pts[k];
			const [x1, y1] = pts[k + 1];
			const n = int(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) || 1;
			for (let i = 0; i <= n; i++) {
				disk(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, r, col);
			}
		}
	};
	const floe = (cx: number, cy: number, rx: number, ry: number) => {
		ell(cx, cy, rx, ry, 'W');
		ell(cx, cy, rx, ry, 'E', (_x, y) => y > cy + ry * 0.35);
	};
	// ink the sea dots that touch white, so a pale beast stands out
	const outline = (x0: number, y0: number, x1: number, y1: number) => {
		for (let y = y0; y <= y1; y++) {
			for (let x = x0; x <= x1; x++) {
				const touches = SIDES.some(([dx, dy]) => get(x + dx, y + dy) === 'W');
				if ('SBT'.includes(get(x, y)) && touches) put(x, y, 'K');
			}
		}
	};

	// ---------- 1. Iceland and its volcanoes ----------
	for (const [x, h] of points('5,3 12,5 20,3')) {
		mountain(x, 16, h, false);
		const t = 16 - h;
		dots('R', [x, t], [x - 1, t - 1], [x + 1, t - 1], [x, t - 1]);
		dots('O', [x, t - 2], [x - 1, t - 2], [x + 1, t - 3]);
		dots('Y', [x, t - 3], [x + 1, t - 2]);
		for (let i = 0; i < t - 5; i++) {
			put(x + 1 + Math.floor(i / 2), t - 4 - i, 'E');
			put(x + 2 + Math.floor(i / 2), t - 4 - i, i % 2 ? 'W' : 'E');
		}
	}
	house(7, 20);
	house(16, 20);

	// ---------- 2. ice floes and the white bear ----------
	ell(33, 10.5, 8.5, 2.6, 'E');
	rect(26, 9, 28, 9, 'W');
	rect(38, 9, 40, 9, 'W');
	rect(27, 11, 39, 11, 'W');
	floe(26.5, 4, 2.5, 1.3);
	floe(44.5, 4.5, 2.6, 1.4);
	floe(28, 19, 3.5, 1.4);
	rect(29, 3, 35, 6, 'W');
	rect(29, 7, 30, 8, 'W');
	rect(34, 7, 35, 8, 'W');
	rect(36, 2, 38, 4, 'W');
	put(36, 1, 'W');
	rect(39, 3, 39, 4, 'W');
	put(28, 4, 'W');
	dots('K', [40, 4], [37, 2], [29, 9], [30, 9], [34, 9], [35, 9]);
	outline(27, 1, 41, 8);
	ship(41, 19, 'R', 'W', 'Y');

	// ---------- 3. the sea unicorn ----------
	at(0, 2);
	ell(60, 14, 7, 3, 'W');
	ell(60, 15.6, 6, 1.5, 'E');
	rect(52, 9, 54, 14, 'W');
	disk(52.5, 8, 2, 'W');
	dots('W', [50, 9], [49, 9], [50, 8]);
	line(52, 6, 50, 2, 'Y');
	line(53, 6, 51, 2, 'Y');
	dots('K', [52, 8], [49, 10]);
	dots('R', [55, 7], [55, 9], [56, 10], [55, 11], [56, 8]);
	thick(points('66,13 69,11 70,9'), 0.8, 'W');
	dots('R', ...points('69,8 70,7 71,8 71,10 55,17 54,18 56,18 63,17 64,18 62,18'));
	dots('E', [58, 13], [61, 13], [64, 13]);
	at();
	outline(48, 8, 71, 16);
	boat(65, 7, 'Y');

	// ---------- 4. the reindeer sled ----------
	mountain(86, 7, 4);
	mountain(95, 7, 3);
	at(0, 2);
	rect(88, 13, 93, 14, 'N');
	rect(88, 15, 88, 17, 'N');
	rect(93, 15, 93, 17, 'N');
	dots('N', ...points('89,15 92,15 94,13 94,12 94,11 95,11 96,11 94,10 95,10'));
	put(87, 13, 'W');
	dots('K', [97, 11], [95, 9], [94, 8], [96, 8], [93, 9], [97, 9], [88, 18], [93, 18], [95, 10]);
	rect(79, 17, 85, 17, 'K');
	put(86, 16, 'K');
	rect(80, 15, 84, 16, 'R');
	rect(85, 14, 87, 14, 'K');
	person(82, 14, 'Y');
	put(83, 13, 'K');
	put(84, 12, 'K');
	at();
	boat(74, 8, 'W');

	// ---------- 5. the cartouche and the tents ----------
	rect(100, 3, 116, 13, 'R');
	rect(101, 4, 115, 12, 'W');
	for (const [cx, cy] of points('99,2 116,2 99,13 116,13')) rect(cx, cy, cx + 1, cy + 1, 'Y');
	for (let i = 0; i < 4; i++) {
		for (const [dx, dy] of GLYPH[i]) put(103 + i * 3 + dx, 5 + dy, 'K');
		for (const [dx, dy] of GLYPH[i + 4]) put(104 + i * 3 + dx, 9 + dy, 'K');
	}
	dots('R', [102, 10], [114, 6]);
	const tent = (x: number, y: number, a: string, b: string) => {
		for (let d = 0; d < 5; d++) rect(x - d, y - 4 + d, x + d, y - 4 + d, a);
		line(x - 2, y - 2, x - 3, y, b);
		line(x + 2, y - 2, x + 3, y, b);
		rect(x, y - 1, x, y, 'K');
		put(x, y - 5, 'K');
		put(x + 1, y - 6, 'R');
		put(x, y - 6, 'K');
	};
	tent(103, 20, 'R', 'Y');
	tent(113, 20, 'B', 'Y');
	person(108, 20, 'O');
	dots('R', [118, 20]);
	dots('O', [118, 19]);

	// ---------- 6. the whale taken for an island ----------
	ell(11, 37, 10, 5, 'K');
	ell(11, 35.2, 8.5, 2.6, 'E');
	ell(9, 40.6, 6, 1.2, 'W');
	dots('W', [4, 37]);
	dots('Y', [3, 37]);
	rect(1, 39, 5, 39, 'R');
	dots('W', [2, 39], [4, 39]);
	thick(points('19,36 21,33 22,30'), 0.9, 'K');
	dots('K', [20, 29], [21, 28], [23, 29], [23, 28]);
	spout(4, 24, 31);
	spout(9, 23, 31);
	person(13, 31, 'R');
	dots('R', [16, 32]);
	dots('O', [16, 31], [15, 32]);
	dots('Y', [16, 30]);
	boat(18, 28, 'O');
	line(15, 29, 14, 33, 'K');
	dots('K', [13, 34], [15, 34], [14, 34]);
	// after the boat, so its crown covers the hull
	tree(18, 32);

	// ---------- 7. the red serpent around a ship ----------
	ship(36, 36, 'W', 'B', 'Y');
	const path = points('25,30 27,34 26,39 29,41 33,40 37,37 41,35 44,31 43,27 40,25 37,25');
	thick(path, 1.1, 'R');
	// a gold spot on every third dot along its spine
	let k = 0;
	for (let s = 0; s + 1 < path.length; s++) {
		const [x0, y0] = path[s];
		const [x1, y1] = path[s + 1];
		const n = int(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
		for (let i = 0; i < n; i++) {
			k += 1;
			if (k % 3 === 0) {
				put(round(x0 + ((x1 - x0) * i) / n), round(y0 + ((y1 - y0) * i) / n), 'Y');
			}
		}
	}
	disk(35, 25.5, 2.2, 'R');
	rect(32, 27, 34, 27, 'R');
	rect(31, 25, 33, 25, 'R');
	dots('W', [32, 26], [33, 26], [34, 26]);
	dots('Y', [35, 24]);
	dots('K', [36, 24], [31, 24]);
	dots('R', [36, 22], [38, 23], [41, 23], [44, 25], [24, 29], [24, 28], [25, 28]);
	thick(points('42,42 44,40 46,42'), 0.8, 'R');

	// ---------- 8. the maelstrom ----------
	const MX = 58;
	const MY = 33;
	disk(MX, MY, 10, 'B');
	for (let i = 1; i < 900; i++) {
		const th = i * 0.02;
		const r = 0.56 * th;
		if (r > 10) break;
		for (const dr of [0, 0.5, 1]) {
			put(MX + (r + dr) * Math.cos(th) + 0.5, MY + (r + dr) * Math.sin(th) + 0.5, 'W');
		}
	}
	disk(MX, MY, 1.2, 'K');
	rect(61, 29, 65, 29, 'N');
	rect(62, 30, 64, 30, 'K');
	line(63, 28, 65, 24, 'K');
	rect(61, 25, 63, 27, 'R');
	put(66, 23, 'Y');
	mountain(70, 28, 3);

	// ---------- 9. the king on his throne ----------
	for (const [x, h] of points('76,4 86,5 95,3')) mountain(x, 30, h);
	rect(81, 33, 87, 42, 'N');
	dots('Y', [81, 32], [87, 32], [81, 31], [87, 31]);
	rect(82, 38, 86, 41, 'R');
	rect(83, 37, 85, 37, 'W');
	rect(83, 35, 85, 36, 'F');
	dots('K', [83, 35], [85, 35]);
	rect(83, 34, 85, 34, 'Y');
	dots('Y', [83, 33], [85, 33], [84, 33]);
	dots('W', [82, 41], [86, 41], [84, 39]);
	dots('K', [83, 42], [85, 42]);
	rect(89, 34, 89, 41, 'K');
	dots('Y', [89, 33], [88, 33], [90, 33], [89, 32]);
	disk(79.5, 39.5, 1, 'B');
	put(79, 38, 'Y');
	shield(75, 37, 'R', 'Y');
	shield(93, 38, 'B', 'Y', true);

	// ---------- 10. skiers and a hunter ----------
	const skier = (x: number, y: number, coat: string, hat: string) => {
		put(x, y - 4, hat);
		put(x, y - 3, 'F');
		rect(x - 1, y - 2, x + 1, y - 1, coat);
		put(x, y, 'K');
		rect(x - 3, y + 1, x + 4, y + 1, 'K');
		put(x + 5, y, 'K');
	};
	skier(111, 28, 'R', 'K');
	line(113, 26, 114, 28, 'K');
	skier(110, 36, 'B', 'R');
	line(112, 34, 113, 36, 'K');
	// a deer
	rect(112, 40, 116, 41, 'N');
	dots('N', [112, 42], [116, 42], [113, 42], [115, 42], [117, 39], [117, 40], [118, 39]);
	dots('K', [117, 38], [116, 37], [118, 37], [118, 36], [115, 36]);
	tree(117, 26);
	tree(116, 33);
	boat(101, 38, 'Y');

	// ---------- 11. the giant lobster ----------
	ell(8.5, 55, 5.5, 3, 'R');
	disk(13.5, 55, 2.6, 'R');
	for (const x of [5, 7, 9, 11]) {
		rect(x, 52, x, 58, 'O');
		rect(x, 59, x, 60, 'R');
		rect(x, 50, x, 51, 'R');
		put(x + 1, 61, 'R');
		put(x + 1, 49, 'R');
	}
	dots('R', ...points('2,54 2,55 2,56 1,53 1,57 1,52 1,58 2,53 2,57 1,55'));
	dots('K', [15, 54], [15, 56]);
	dots('W', [16, 54], [16, 56]);
	thick(points('14,53 16,50 17,48'), 0.8, 'R');
	thick(points('14,57 16,60 18,61'), 0.8, 'R');
	rect(17, 45, 22, 45, 'R');
	rect(17, 50, 22, 50, 'R');
	rect(17, 45, 18, 50, 'R');
	put(22, 46, 'R');
	put(22, 49, 'R');
	rect(18, 44, 21, 44, 'R');
	rect(18, 51, 21, 51, 'R');
	person(20, 49, 'W');
	ell(20, 61.5, 3, 1.8, 'R');
	rect(20, 61, 23, 61, 'K');
	dots('O', [19, 60], [18, 62]);
	rect(16, 55, 21, 55, 'K');
	put(22, 54, 'K');

	// ---------- 12. the pristis and a ship ----------
	ell(31, 59, 6.5, 4.2, 'K');
	disk(36, 55.5, 3.6, 'K');
	ell(31, 61.6, 5, 1.4, 'E');
	rect(37, 56, 40, 57, 'R');
	dots('W', [38, 55], [40, 55], [39, 58], [37, 58]);
	rect(38, 54, 40, 54, 'K');
	rect(37, 59, 39, 59, 'K');
	dots('Y', [36, 53]);
	dots('W', [35, 53]);
	dots('K', [28, 54], [30, 53], [32, 53], [28, 53]);
	thick(points('25,58 25,54 26,51'), 0.8, 'K');
	dots('K', [25, 49], [27, 49], [24, 50], [28, 50]);
	spout(33, 45, 51);
	// the second jet arcs onto the ship
	for (let i = 0; i < 11; i++) {
		const t = i / 10;
		const rise = 6 * Math.sin(t * Math.PI) * 0.9;
		put(36 + t * 8, 51 - rise, 'W');
		put(36 + t * 8, 52 - rise, 'W');
	}
	ship(43, 61, 'Y', 'R', 'B');

	// ---------- 13. the green tusked monster ----------
	ell(57, 56, 7, 5, 'G');
	ell(58, 59.6, 5, 1.3, 'L');
	for (const x of [55, 58, 61]) dots('R', [x, 50], [x + 1, 50], [x, 49]);
	dots('R', [58, 48], [59, 49]);
	disk(51.5, 57, 2.5, 'F');
	dots('K', [50, 56], [50, 58], [55, 52]);
	dots('Y', [54, 52], [54, 53], [55, 53]);
	dots('W', [53, 59], [54, 58], [55, 57], [55, 56], [55, 55], [52, 54], [52, 53], [53, 52]);
	rect(50, 60, 53, 60, 'K');
	for (const x of [58, 61]) {
		dots('Y', [x, 55], [x, 56], [x + 1, 55]);
		put(x + 1, 56, 'K');
	}
	dots('G', ...points('54,62 55,62 60,62 61,62 64,54 64,53 63,52 65,52 64,55'));
	dots('K', [53, 62], [59, 62]);

	// ---------- 14. the red-roofed town ----------
	ell(77.5, 48.5, 4.5, 2.4, 'B');
	dots('W', [77, 48], [78, 48], [78, 47]);
	rect(77, 57, 92, 59, 'E');
	rect(84, 58, 85, 59, 'K');
	for (let x = 77; x < 93; x += 2) put(x, 56, 'E');
	for (const x of [79, 83, 87]) house(x, 55);
	tower(77, 59, 6);
	tower(91, 59, 6, 'B');
	rect(84, 49, 85, 55, 'W');
	rect(83, 48, 86, 48, 'R');
	rect(84, 46, 85, 47, 'R');
	put(84, 45, 'K');
	put(84, 51, 'K');
	put(85, 53, 'K');
	shield(90, 48, 'R', 'W');

	// ---------- 15. a ship in the gulf, and a castle ----------
	boat(101, 54, 'R', 'Y');
	rect(110, 54, 117, 57, 'E');
	tower(109, 57, 5);
	tower(117, 57, 5, 'R');
	rect(113, 55, 114, 57, 'K');
	house(112, 53);
	for (let x = 110; x < 118; x += 2) put(x, 53, 'E');
	// a seal
	dots('W', [112, 63], [113, 63], [113, 62]);
	dots('K', [114, 63]);

	// ---------- 16. the compass rose and Scotland ----------
	const CX = 15;
	const CY = 73;
	disk(CX, CY, 6.3, 'K');
	disk(CX, CY, 5.4, 'W');
	for (let d = 1; d < 5; d++) {
		dots('Y', [CX + d, CY + d], [CX - d, CY + d], [CX + d, CY - d], [CX - d, CY - d]);
	}
	for (let d = 0; d < 7; d++) {
		const w = d < 3 ? 1 : 0;
		rect(CX - w, CY - d, CX, CY - d, 'R');
		rect(CX, CY + d, CX + w, CY + d, 'R');
		rect(CX - d, CY, CX - d, CY + w, 'K');
		rect(CX + d, CY - w, CX + d, CY, 'K');
		if (w) {
			put(CX + 1, CY - d, 'K');
			put(CX - 1, CY + d, 'K');
			put(CX - d, CY - 1, 'R');
			put(CX + d, CY + 1, 'R');
		}
	}
	put(CX, CY, 'Y');
	tower(3, 85, 3);
	house(7, 86);

	// ---------- 17. barrels for the whale ----------
	ell(39, 77, 7, 3.6, 'K');
	ell(38.5, 79.4, 5, 1.2, 'W');
	rect(32, 77, 35, 78, 'R');
	dots('W', [33, 76], [35, 76], [34, 79], [32, 79]);
	dots('W', [36, 75]);
	dots('K', [32, 76], [33, 79]);
	thick(points('45,76 46,74'), 0.8, 'K');
	dots('K', [45, 72], [47, 72], [47, 73]);
	spout(40, 69, 73);
	const barrel = (x: number, y: number) => {
		rect(x, y, x + 2, y + 1, 'N');
		dots('Y', [x, y], [x, y + 1], [x + 2, y], [x + 2, y + 1]);
	};
	barrel(25, 77);
	barrel(29, 79);
	barrel(27, 81);
	boat(29, 73, 'O', 'Y');
	// the map's scale bar
	for (let i = 0, x = 27; x < 45; i++, x += 3) rect(x, 84, x + 2, 85, i % 2 === 0 ? 'K' : 'W');
	dots('R', [26, 84], [26, 85], [45, 84], [45, 85], [26, 83], [45, 83]);

	// ---------- 18. the sea owl ----------
	disk(56, 75, 6, 'N');
	dots('O', ...points('52,78 54,79 56,78 58,79 60,78 55,80 57,80'));
	disk(53.5, 73.5, 2.1, 'W');
	disk(58.5, 73.5, 2.1, 'W');
	dots('Y', [53, 73], [54, 73], [53, 74], [58, 73], [59, 73], [59, 74]);
	dots('K', [54, 74], [58, 74]);
	dots('O', [56, 75], [56, 76], [55, 75]);
	dots('N', [51, 69], [52, 69], [51, 68], [60, 69], [61, 69], [61, 68]);
	thick(points('62,75 64,75'), 0.9, 'N');
	dots('O', ...points('65,73 66,72 65,77 66,78 65,75 66,74 66,76 65,74 65,76'));
	dots('O', [49, 75], [49, 76], [50, 77], [54, 82], [58, 82]);
	dots('K', [53, 82], [57, 82]);

	// ---------- 19. the Danish sound ----------
	shield(87, 68, 'B', 'Y', true);
	house(80, 69);
	house(91, 69);
	tower(73, 82, 2, 'R');
	house(75, 82);
	ship(88, 81, 'W', 'R', 'Y');
	for (const x of [58, 64, 79, 95]) house(x, 86);

	// ---------- 20. the Baltic coast ----------
	ship(103, 77, 'O', 'W', 'B');
	rect(113, 74, 118, 76, 'E');
	tower(113, 76, 4);
	tower(117, 76, 4, 'R');
	house(115, 73);
	shield(115, 83, 'R', 'W');
	house(100, 86);
	house(105, 86);
	// a seal
	dots('W', [98, 68], [99, 68], [99, 67]);
	dots('K', [100, 68]);

	// ---------- forests: a tree wherever bare land surrounds a grid spot ----------
	const bare = (x: number, y: number) => ['C', 'L'].includes(get(x, y));
	k = 0;
	for (let y = 4; y < H - 1; y += 5) {
		for (let x = 3; x < W - 2; x += 5) {
			k += 1;
			const xx = x + ((k * 7) % 3);
			const yy = y + ((k * 5) % 3);
			let free = yy < H - 1;
			for (let dx = -2; free && dx <= 2; dx++) {
				for (let dy = -1; free && dy < 5; dy++) free = bare(xx + dx, yy - dy);
			}
			if (free) {
				tree(xx, yy);
				if (k % 3 === 0 && bare(xx + 3, yy) && bare(xx + 3, yy - 3) && bare(xx + 4, yy - 2)) {
					tree(xx + 2, yy + 1);
				}
			}
		}
	}

	// ---------- a border of black and gold dashes ----------
	const dash = (i: number) => (Math.floor(i / 3) % 2 === 0 ? 'K' : 'Y');
	for (let i = 0; i < W; i++) dots(dash(i), [i, 0], [i, H - 1]);
	for (let i = 0; i < H; i++) dots(dash(i), [0, i], [W - 1, i]);
}

export const carta: Mural = {
	file: 'carta-marina',
	name: 'Carta Marina',
	prefix: 'carta-marina',
	notes: 'E',
	difficulty: 0.35,
	cols: 5,
	// S, B, T the sea's three blues; C sand and L meadow; N brown, also the coastline; K ink.
	palette: {
		S: '#86c2e6',
		B: '#2c62b0',
		T: '#2a9488',
		C: '#f0d590',
		L: '#bcd85a',
		W: '#f7f4ec',
		G: '#4c9a40',
		N: '#8a5326',
		R: '#cf2f2a',
		Y: '#f2c230',
		O: '#ea7d28',
		K: '#2b1b16',
		F: '#f2a58c',
		E: '#767a90'
	},
	ground: 'S',
	panels: [
		['iceland', 'Iceland', { mode: 'phrygian', spice: 'adventurous', lead: 'brass' }],
		['ice-bear', 'Ice Bear', { mode: 'lydian', spice: 'gentle', lead: 'vibes' }],
		['sea-unicorn', 'Sea Unicorn', { mode: 'lydian', spice: 'lively', lead: 'flute' }],
		['reindeer-sled', 'Reindeer Sled', { mode: 'mixolydian', spice: 'lively', lead: 'pizz' }],
		['cartouche', 'Cartouche', { mode: 'harmonic', spice: 'gentle', lead: 'harp' }],
		['whale-island', 'Whale Island', { mode: 'dorian', spice: 'gentle', lead: 'string' }],
		[
			'sea-serpent',
			'Sea Serpent',
			{ mode: 'phrygian', spice: 'adventurous', lead: 'string', meter: 7 }
		],
		['maelstrom', 'Maelstrom', { mode: 'minor', spice: 'adventurous', lead: 'keys', meter: 5 }],
		['mountain-king', 'Mountain King', { mode: 'major', spice: 'lively', lead: 'brass' }],
		['skiers', 'Skiers', { mode: 'mixolydian', spice: 'gentle', lead: 'kalimba' }],
		['giant-lobster', 'Giant Lobster', { mode: 'minor', spice: 'lively', lead: 'pizz' }],
		['pristis', 'Pristis', { mode: 'minor', spice: 'adventurous', lead: 'brass' }],
		[
			'tusked-monster',
			'Tusked Monster',
			{ mode: 'dorian', spice: 'lively', lead: 'mallet', meter: 3 }
		],
		['red-roof-town', 'Red Roof Town', { mode: 'minor-pentatonic', spice: 'gentle', lead: 'keys' }],
		['gulf-castle', 'Gulf Castle', { mode: 'mixolydian', spice: 'gentle', lead: 'harp' }],
		['compass-rose', 'Compass Rose', { mode: 'lydian', spice: 'gentle', lead: 'mallet', meter: 3 }],
		['barrel-whale', 'Barrel Whale', { mode: 'dorian', spice: 'lively', lead: 'kalimba' }],
		['sea-owl', 'Sea Owl', { mode: 'dorian', spice: 'gentle', lead: 'flute' }],
		[
			'danish-sound',
			'Danish Sound',
			{ mode: 'pentatonic', spice: 'lively', lead: 'string', meter: 3 }
		],
		['baltic-coast', 'Baltic Coast', { mode: 'harmonic', spice: 'gentle', lead: 'vibes' }]
	],
	draw
};
