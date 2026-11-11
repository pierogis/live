// The Tower of Babel, after Bruegel (1563): a huge round tower, still being built, rising
// through the clouds over a town and a harbour. Twenty panels of 24 by 22.
import { div, int, mod, points, round, type Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const W = 120;
const H = 88;
const HOR = 31; // the row where the sky meets the land

// the tower: storey height, each storey's half width from the bottom up, the row it stands on
const TH = 9;
const HW = [41, 36, 31, 26, 21.5, 17, 13];
const BASE = 78;
// it leans a little: its middle at a given row
const cxat = (y: number) => 62 - (BASE - y) * 0.065;

// where the water starts on a row
const coast = (y: number) => 90 + 9 * Math.sin((y - 30) / 11) + (y - 30) * 0.05;

type Triple = [number, number, number];

function draw(c: Canvas) {
	const { put, rect, disk, line, dots, get } = c;

	// ---------- sky: banded clouds ----------
	for (let y = 0; y < HOR; y++) {
		for (let x = 0; x < W; x++) {
			const yy = y + Math.abs(Math.sin(((x + 3) * Math.PI) / 10)) * 2.6 + Math.sin(x / 17) * 1.5;
			const k = mod(yy + 1, 8.5);
			c.g[y][x] = k < 4.5 ? 'S' : k < 7.5 ? 'W' : 'N';
		}
	}
	// big cumulus heaps so each sky panel has its own shape
	const cumulus = (x: number, y: number, s: number) => {
		for (const [dx, dy, r] of points<Triple>('-5,0,3 -1,-2,4 4,-1,3.4 8,0.5,2.4'))
			disk(x + dx * s, y + dy * s, r * s, 'W');
		rect(int(x - 7 * s), int(y + 2 * s), int(x + 9 * s), int(y + 2 * s), 'N');
	};
	cumulus(10, 13, 0.8);
	cumulus(86, 18, 0.8);
	cumulus(84, 25, 0.7);
	cumulus(27, 27, 0.6);
	// the grey storm heap, top right, with white tops
	for (const [dx, dy, r] of points<Triple>('-6,1,3 -1,-1,4.6 5,0,3.6 10,2,2.4'))
		disk(104 + dx, 10 + dy, r, 'N');
	for (const [dx, dy, r] of points<Triple>('-6,0,1.8 -2,-3,2.4 4,-2,2'))
		disk(104 + dx, 10 + dy, r, 'W');
	rect(95, 14, 116, 14, 'S');

	const bird = (x: number, y: number) =>
		dots('K', [x - 2, y - 1], [x - 1, y], [x, y + 1], [x + 1, y], [x + 2, y - 1]);
	const house = (x: number, y: number, w: number, wall = 'W', roof = 'R') => {
		rect(x, y - 1, x + w - 1, y, wall);
		rect(x, y - 2, x + w - 1, y - 2, roof);
		rect(x + 1, y - 3, x + w - 2, y - 3, roof);
		put(x + div(w, 2), y, 'K');
	};
	const person = (x: number, y: number, body: string, head: string) => {
		put(x, y - 2, head);
		put(x, y - 1, body);
		put(x, y, body);
	};
	const tree = (x: number, y: number, r = 1.6) => {
		put(x, y, 'K');
		disk(x, y - 1 - r, r, 'D');
	};

	// ---------- land (left) and sea (right) ----------
	for (let y = HOR; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const yy = y + Math.sin((x * Math.PI) / 9) * 1.6;
			const band = mod(Math.floor((yy - HOR) / 5), 2);
			c.g[y][x] = band === 0 ? 'G' : 'L';
			if ((x + div(y, 3) * 5) % 9 === 0 && y % 3 === 0) c.g[y][x] = 'D';
		}
	}
	// distant hills on the horizon
	for (let x = 0; x < 60; x++) {
		const h = Math.max(
			3.5 - Math.abs(x - 7) * 0.5,
			4.5 - Math.abs(x - 25) * 0.45,
			3 - Math.abs(x - 40) * 0.5,
			0
		);
		for (let y = int(HOR - h); y <= HOR; y++) put(x, y, 'N');
	}
	rect(0, HOR + 1, 59, HOR + 1, 'D');
	// the sea, with a strip of sand along the shore
	for (let y = HOR - 1; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (x >= coast(y)) {
				const yy = y + Math.sin((x * Math.PI) / 5) * 1.2;
				c.g[y][x] = int(yy) % 6 === 0 && div(x, 4) % 3 !== 0 ? 'W' : 'B';
			} else if (x >= coast(y) - 1.5 && y > HOR) {
				c.g[y][x] = 'C';
			}
		}
	}
	// far shore on the right
	for (let x = 96; x < 120; x++) {
		const h = Math.max(2.5 - Math.abs(x - 104) * 0.4, 3.5 - Math.abs(x - 115) * 0.5, 0);
		for (let y = int(HOR - 1 - h); y < HOR; y++) put(x, y, 'N');
	}

	for (let y = HOR + 2; y < 70; y++) {
		const xr = 13 + 7 * Math.sin((y - 30) / 6) - (y - 30) * 0.12;
		rect(int(xr), y, int(xr) + 1 + div(y - 30, 14), y, 'B');
	}
	// the city: red roofs to the horizon
	let k = 0;
	for (let y = HOR + 4; y < 66; y += 5) {
		for (let x = 0; x < 36; x += 5) {
			k += 1;
			const yy = y + (k % 2);
			// build only on open grass, clear of the river and of what is already there
			let open = x + 4 < 12 + (80 - yy) * 0.5;
			for (let a = x - 1; open && a < x + 5; a++) {
				for (let b = yy - 3; open && b < yy + 1; b++) open = 'GLD'.includes(get(a, b));
			}
			if (open) {
				if (k % 7 === 3) tree(x + 1, yy);
				else house(x, yy, 3 + (k % 3 === 0 ? 1 : 0), k % 4 ? 'W' : 'C', k % 5 ? 'R' : 'M');
			}
		}
	}
	// the church, the town wall with two gate towers, the windmill
	rect(21, 37, 23, 41, 'W');
	rect(21, 35, 23, 36, 'N');
	rect(22, 31, 22, 34, 'N');
	put(22, 40, 'K');
	rect(24, 39, 27, 41, 'W');
	rect(24, 38, 27, 38, 'R');
	for (let x = 0; x < 30; x++) {
		put(x, 62, 'N');
		put(x, 63, 'N');
		if (x % 3 === 0) put(x, 61, 'N');
	}
	for (const x of [8, 20]) {
		rect(x, 59, x + 2, 63, 'N');
		rect(x, 58, x + 2, 58, 'R');
		put(x + 1, 62, 'K');
	}
	rect(3, 46, 4, 49, 'N');
	line(0, 42, 7, 49, 'K');
	line(7, 42, 0, 49, 'K');

	// ---------- the tower ----------
	// one storey, its bottom middle on row `yb`; `raw` is bare brick, `last` runs down to the ground
	const tier = (i: number, hw: number, yb: number, h = TH, raw = false, last = false) => {
		const cx = cxat(yb);
		for (let x = int(cx - hw) - 1; x < int(cx + hw) + 2; x++) {
			const u = (x - cx) / hw;
			if (Math.abs(u) > 1) continue;
			// the storey is round, so its edges sit higher than its middle
			const bow = 3 * Math.sqrt(1 - u * u) - 3;
			const ybot = yb + bow - u * 1.6;
			const ytop = ybot - h;
			// the distance round the wall, and where that falls in the 6-wide arch pattern
			const s = Math.asin(u) * hw + i * 2.5;
			const kk = mod(s, 6);
			const lit = u < 0.22;
			const red =
				raw ||
				(i >= 4 && u > -0.1) ||
				(i === 3 && u > 0.45) ||
				((i === 2 || i === 3) && -0.32 < u && u < -0.02) ||
				(i <= 1 && 0.6 < u && u < 0.86);
			const [wall, butt] = red ? 'RM' : lit ? 'CO' : 'OM';
			const y0 = round(ytop);
			const y1 = round(ybot) + (last ? 3 : 0);
			for (let y = y0; y <= y1; y++) {
				const r = y - y0;
				let col = wall;
				if (r === 0) col = lit && !red ? 'W' : 'N';
				else if (kk < 1.2) col = butt;
				else if (i % 2 === 0) {
					// even storeys: one tall arch with a narrow top
					if (r >= 3 && r <= 7 && kk >= 2 && kk < 5.2 && !(r === 3 && (kk < 3 || kk >= 4.2))) {
						col = 'K';
					} else if (r === 8 && kk >= 2 && kk < 5.2 && !last) col = butt;
				} else {
					// odd storeys: a small window over a shorter arch
					if ((r === 2 || r === 3) && kk >= 2.4 && kk < 4.6) col = 'K';
					else if (r >= 5 && r <= 8 && kk >= 2 && kk < 5.2 && !(r === 5 && (kk < 3 || kk >= 4.2))) {
						col = lit || red ? 'K' : 'M';
					}
				}
				// the footing under the bottom storey: a ledge, small doors, a plinth
				if (last && r > 9) {
					if (r === 10) col = lit ? 'W' : 'N';
					else if (kk < 1.2) col = butt;
					else if ((r === 13 || r === 14) && kk >= 2.6 && kk < 4.6) col = 'K';
					else if (r === 16) col = butt;
					else col = wall;
				}
				// a darker edge down each side, to make the tower look round
				if (u < -0.94 && 'CW'.includes(col)) col = 'O';
				if (u > 0.94 && 'OC'.includes(col)) col = 'M';
				put(x, y, col);
			}
		}
	};
	tier(7, 9.5, BASE - 7 * TH, 8, true);
	// cloud and sky showing through its ragged, unfinished top
	for (let x = 48; x < 68; x++) {
		const t = 1 + ((x * 7) % 4);
		const cx = cxat(10);
		if (Math.abs(x - cx) < 9.5) {
			for (let y = 6; y < 6 + t; y++) put(x, y + int(Math.abs(x - cx) * 0.25), y < 8 ? 'W' : 'S');
		}
	}
	// the seven storeys, the top one first so each lower one overlaps it
	for (let i = 6; i >= 0; i--) tier(i, HW[i], BASE - i * TH, TH, false, i === 0);
	for (let x = 18; x < 100; x++) {
		for (let y = 83; y < H; y++) {
			if (x < coast(y) - 1.5) put(x, y, y === 83 ? 'D' : (div(x, 6) + y) % 2 ? 'G' : 'L');
		}
	}

	// the big gate at the foot
	const gx = int(cxat(80)) - 6;
	rect(gx - 4, 73, gx + 4, 82, 'M');
	rect(gx - 3, 74, gx + 3, 82, 'K');
	rect(gx - 2, 72, gx + 2, 72, 'M');
	rect(gx - 1, 73, gx + 1, 73, 'K');
	rect(gx - 1, 79, gx + 1, 82, 'N');
	put(gx, 78, 'C');
	// the road along the tower's foot, with ox carts of stone
	for (let x = 40; x < 97; x++) {
		if ('GL'.includes(get(x, 85))) put(x, 85, 'C');
		if ('GL'.includes(get(x, 86)) && div(x, 7) % 2) put(x, 86, 'C');
	}
	rect(gx - 1, 83, gx + 1, 85, 'C');
	for (const x of [50, 68, 82]) {
		rect(x, 84, x + 3, 85, 'N');
		put(x, 86, 'K');
		put(x + 3, 86, 'K');
		rect(x - 3, 85, x - 2, 85, 'M');
		put(x - 3, 84, 'M');
	}
	// rock that the tower grows out of, lower left
	for (let x = 18; x < 44; x++) {
		const h = 13 - Math.abs(x - 30) * 0.75 + ((x * 5) % 3);
		const top = int(88 - h);
		for (let y = top; y < 88; y++) {
			put(x, y, (x + y) % 5 === 0 || y === top ? 'N' : (x * 3 + y) % 7 < 2 ? 'O' : 'M');
		}
	}

	// cranes, scaffolding and ladders
	const crane = (x: number, y: number, d: number, arm: number, wheel = true) => {
		rect(x, y - 7, x, y, 'K');
		line(x, y - 7, x + d * arm, y - 10, 'K');
		line(x, y - 4, x + d * 3, y - 8, 'K');
		rect(x + d * arm, y - 9, x + d * arm, y - 6, 'N');
		rect(x + d * arm - 1, y - 5, x + d * arm + 1, y - 4, 'W');
		if (wheel) {
			c.ring(x - d * 3, y - 2, 2.4, 'K', 1);
			put(x - d * 3, y - 2, 'N');
		}
	};
	crane(47, 14, -1, 9, false);
	crane(66, 12, 1, 8, false);
	crane(84, 41, 1, 8);
	crane(31, 51, -1, 7);
	crane(98, 68, 1, 7);
	for (let x = 52; x < 64; x += 3) rect(x, 3, x, 7, 'K');
	rect(51, 5, 64, 5, 'K');
	for (const [x, y0, y1] of points<Triple>('40,52,59 76,26,32 56,34,41 92,60,67')) {
		for (let y = y0; y <= y1; y++) {
			put(x, y, 'K');
			put(x + 2, y, 'K');
			put(x + 1, y, y % 2 ? 'W' : 'K');
		}
	}
	// workers on the ramps
	HW.forEach((hw, i) => {
		const yb = BASE - i * TH;
		const cx = cxat(yb);
		[-0.8, -0.45, -0.1, 0.3, 0.62, 0.86].forEach((u, j) => {
			if ((i + j) % 2) return;
			const x = int(cx + u * hw);
			const bow = 3 * Math.sqrt(1 - u * u) - 3;
			const y = round(yb + bow - u * 1.6) - TH - 1;
			if ('CORMWN'.includes(get(x, y - 2)) || i < 6) {
				const body = (i + j) % 3 === 0 ? 'B' : (i + j) % 3 === 1 ? 'R' : 'W';
				person(x, y, body, 'CW'.includes(get(x, y - 2)) ? 'K' : 'C');
			}
		});
	});

	// the cloud drifting across the upper tier
	for (const [cx, cy, r] of points<Triple>(
		'37,28.5,2.2 42,27,3.2 48,26,3.6 54,27,3 60,26.5,3.4 66,27.5,2.6 71,28.5,2'
	))
		disk(cx, cy, r, 'W');
	rect(35, 29, 73, 29, 'W');
	for (let x = 37; x < 73; x++) {
		if (div(x, 4) % 3) put(x, 30, 'N');
	}

	for (const [x, y] of points('5,4 19,3 30,9 37,15 27,18 4,21')) bird(x, y);
	for (let i = 0; i < 5; i++) bird(78 + i * 4, 6 + Math.abs(i - 2) * 3);
	for (const [x, y] of points('114,19 100,20 117,3')) bird(x, y);

	// ---------- harbour on the right ----------
	const ship = (x: number, y: number, s: number, hull = 'M', sail = 'W') => {
		rect(x - 3 * s, y, x + 3 * s, y, hull);
		rect(x - 2 * s, y + 1, x + 2 * s, y + 1, hull);
		put(x - 3 * s - 1, y - 1, hull);
		put(x + 3 * s + 1, y - 1, hull);
		rect(x, y - 5 * s - 1, x, y - 1, 'K');
		rect(x - 2 * s, y - 4 * s - 1, x + 2 * s, y - 2, sail);
		// on a big ship the mast shows in front of the sail
		if (s > 1) rect(x, y - 5 * s - 1, x, y - 1, 'K');
		put(x + 1, y - 5 * s - 2, 'R');
		put(x, y - 5 * s - 2, 'K');
	};
	const boat = (x: number, y: number, hull = 'K') => {
		rect(x - 2, y, x + 2, y, hull);
		put(x, y - 1, 'C');
		put(x - 1, y - 1, 'R');
	};
	const raft = (x: number, y: number) => {
		rect(x - 3, y, x + 3, y, 'O');
		rect(x - 3, y + 1, x + 3, y + 1, 'M');
		put(x - 1, y - 1, 'K');
		put(x - 1, y - 2, 'C');
	};
	ship(108, 40, 1);
	ship(116, 36, 1, 'K', 'C');
	ship(100, 37, 1, 'K');
	ship(110, 56, 2);
	ship(104, 49, 1, 'K', 'C');
	boat(116, 62);
	boat(101, 61, 'M');
	ship(111, 76, 2, 'K', 'C');
	raft(105, 80);
	raft(114, 85);
	boat(104, 71);
	boat(117, 68, 'M');
	// a lighthouse island and jetty
	rect(113, 46, 119, 47, 'N');
	rect(116, 41, 117, 45, 'W');
	rect(116, 43, 117, 43, 'R');
	rect(116, 40, 117, 40, 'R');
	rect(112, 48, 119, 48, 'C');
	rect(96, 66, 104, 66, 'M');
	dots('K', [98, 67], [102, 67], [98, 65], [102, 65]);
	// trees, sheds and the quay on the shore
	for (const [x, y] of points('88,40 92,44 86,47 95,52 93,58')) tree(x, y, 1.8);
	house(89, 53, 3);
	house(94, 63, 3, 'C', 'M');
	rect(96, 84, 109, 87, 'N');
	rect(96, 83, 109, 83, 'W');
	dots('K', [99, 82], [104, 82], [108, 82]);
	house(86, 87, 4);
	house(91, 87, 3, 'C', 'M');
	rect(76, 85, 80, 87, 'N');
	rect(76, 84, 80, 84, 'W');

	// ---------- foreground hill, bottom left: the king's visit ----------
	for (let x = 0; x < 30; x++) {
		const top = 66 + (x * x) / 50 + Math.sin(x / 2);
		for (let y = int(top); y < 88; y++) {
			put(x, y, Math.floor((y + Math.sin(x / 3) * 1.5) / 3) % 2 ? 'G' : 'L');
		}
		put(x, int(top), 'D');
		put(x, int(top) + 1, 'D');
	}
	for (const [x, y, w] of points<Triple>('17,81,5 21,86,4')) {
		rect(x, y, x + w - 1, y + 1, 'N');
		rect(x, y - 1, x + w - 1, y - 1, 'W');
	}
	// a standing figure in a hat, with a spear on side `spear` (0 for none)
	const fig = (x: number, y: number, body: string, hat: string, spear = 0) => {
		rect(x - 1, y - 5, x + 1, y - 1, body);
		put(x - 1, y, 'K');
		put(x + 1, y, 'K');
		rect(x - 1, y - 7, x + 1, y - 6, 'C');
		rect(x - 1, y - 8, x + 1, y - 8, hat);
		if (spear) {
			rect(x + spear * 3, y - 11, x + spear * 3, y, 'K');
			put(x + spear * 3, y - 12, 'W');
		}
	};
	fig(1, 81, 'M', 'K');
	fig(14, 80, 'B', 'N', 1);
	// the king in his red cloak, with crown and sceptre
	rect(5, 73, 9, 80, 'R');
	rect(4, 78, 10, 80, 'R');
	rect(6, 73, 8, 73, 'W');
	rect(7, 74, 7, 78, 'W');
	rect(6, 71, 8, 72, 'C');
	rect(6, 70, 8, 70, 'O');
	dots('O', [6, 69], [8, 69]);
	dots('K', [6, 81], [8, 81]);
	rect(11, 75, 11, 81, 'K');
	put(11, 74, 'O');
	for (const [x, y] of points('8,86 14,86')) {
		rect(x, y - 2, x + 1, y, 'W');
		rect(x + 2, y, x + 3, y, 'W');
		rect(x, y - 4, x + 1, y - 3, 'C');
		rect(x, y - 5, x + 1, y - 5, 'K');
		put(x - 1, y - 2, 'C');
	}
	dots('K', [19, 79], [20, 78], [21, 77], [22, 77]);
}

export const babel: Mural = {
	file: '00f-tower-of-babel',
	name: 'The Tower of Babel',
	prefix: 'tower-of-babel',
	notes: 'B',
	cols: 5,
	// S sky, W white, B sea blue, G grass, L light grass, D dark green, C cream stone,
	// O ochre stone, R red brick, M dark red-brown, K near black, N grey
	palette: {
		S: '#86c2e6',
		W: '#f7f4ec',
		B: '#2f6fb5',
		G: '#6fae5a',
		L: '#bcd85a',
		D: '#2e6b3e',
		C: '#f0d590',
		O: '#d9952f',
		R: '#c8402c',
		M: '#7c2f24',
		K: '#2b1a16',
		N: '#767a90'
	},
	ground: 'S',
	panels: [
		['morning-birds', 'Morning Birds', { mode: 'lydian', spice: 'gentle', lead: 'flute' }],
		['crane-in-the-sky', 'Crane in the Sky', { mode: 'mixolydian', spice: 'lively', lead: 'pizz' }],
		[
			'red-summit',
			'Red Summit',
			{ mode: 'phrygian', spice: 'adventurous', lead: 'brass', meter: 7 }
		],
		['flock', 'Flock', { mode: 'major', spice: 'gentle', lead: 'harp', meter: 3 }],
		['storm-cloud', 'Storm Cloud', { mode: 'minor', spice: 'gentle', lead: 'string' }],
		['far-hills', 'Far Hills', { mode: 'major', spice: 'gentle', lead: 'kalimba' }],
		['church-spire', 'Church Spire', { mode: 'lydian', spice: 'gentle', lead: 'keys' }],
		['drifting-cloud', 'Drifting Cloud', { mode: 'dorian', spice: 'lively', lead: 'vibes' }],
		['raw-brick', 'Raw Brick', { mode: 'minor', spice: 'adventurous', lead: 'brass' }],
		[
			'sails-at-sea',
			'Sails at Sea',
			{ mode: 'mixolydian', spice: 'lively', lead: 'flute', meter: 3 }
		],
		['red-roofs', 'Red Roofs', { mode: 'major', spice: 'lively', lead: 'mallet' }],
		['west-arches', 'West Arches', { mode: 'dorian', spice: 'gentle', lead: 'harp' }],
		['brick-heart', 'Brick Heart', { mode: 'dorian', spice: 'lively', lead: 'keys' }],
		['shadow-side', 'Shadow Side', { mode: 'minor', spice: 'lively', lead: 'string', meter: 5 }],
		['lighthouse', 'Lighthouse', { mode: 'lydian', spice: 'gentle', lead: 'vibes' }],
		['the-king', 'The King', { mode: 'mixolydian', spice: 'adventurous', lead: 'brass' }],
		['rock-foot', 'Rock Foot', { mode: 'dorian', spice: 'gentle', lead: 'kalimba' }],
		['great-gate', 'Great Gate', { mode: 'phrygian', spice: 'lively', lead: 'mallet' }],
		['east-wall', 'East Wall', { mode: 'minor', spice: 'gentle', lead: 'pizz' }],
		['harbour', 'Harbour', { mode: 'major', spice: 'adventurous', lead: 'string', meter: 3 }]
	],
	draw
};
