/*
 * The Tower of Babel, after Bruegel (1563): a huge round tower, still being built,
 * rising through the clouds over a town and a harbour. 5 x 4 panels (120 x 88).
 */
import { div, int, mod, round } from './canvas.ts';
import type { Canvas } from './canvas.ts';
import type { Mural } from './mural.ts';

const W = 120;
const H = 88;
/** The row where the sky meets the land. */
const HOR = 31;

/** The height of one storey of the tower. */
const TH = 9;
/** Half the width of each storey, from the bottom one up. */
const HW = [41, 36, 31, 26, 21.5, 17, 13];
/** The row the tower's lowest storey stands on. */
const BASE = 78;
/** The tower leans a little: the middle of the tower at a given row. */
const cxat = (y: number) => 62 - (BASE - y) * 0.065;

/** The sea, with a coast that swings in toward the harbour: where the water starts on a row. */
const coast = (y: number) => 90 + 9 * Math.sin((y - 30) / 11.0) + (y - 30) * 0.05;

function draw(c: Canvas) {
	const { put, rect, disk, line, dots, get } = c;

	// ---------- sky: banded clouds ----------
	for (let y = 0; y < HOR; y++) {
		for (let x = 0; x < W; x++) {
			const yy = y + Math.abs(Math.sin(((x + 3) * Math.PI) / 10)) * 2.6 + Math.sin(x / 17.0) * 1.5;
			const k = mod(yy + 1, 8.5);
			c.g[y][x] = k < 4.5 ? 'S' : k < 7.5 ? 'W' : 'N';
		}
	}
	// big cumulus heaps so each sky panel has its own shape
	const cumulus = (x: number, y: number, s = 1.0) => {
		const puffs: [dx: number, dy: number, r: number][] = [
			[-5, 0, 3],
			[-1, -2, 4],
			[4, -1, 3.4],
			[8, 0.5, 2.4]
		];
		for (const [dx, dy, r] of puffs) disk(x + dx * s, y + dy * s, r * s, 'W');
		// its flat grey underside
		rect(int(x - 7 * s), int(y + 2 * s), int(x + 9 * s), int(y + 2 * s), 'N');
	};
	cumulus(10, 13, 0.8);
	cumulus(86, 18, 0.8);
	cumulus(84, 25, 0.7);
	cumulus(27, 27, 0.6);
	// a grey storm heap in the top right
	const stormPuffs: [dx: number, dy: number, r: number][] = [
		[-6, 1, 3],
		[-1, -1, 4.6],
		[5, 0, 3.6],
		[10, 2, 2.4]
	];
	for (const [dx, dy, r] of stormPuffs) disk(104 + dx, 10 + dy, r, 'N');
	// white tops where the light catches it
	const stormTops: [dx: number, dy: number, r: number][] = [
		[-6, 0, 1.8],
		[-2, -3, 2.4],
		[4, -2, 2]
	];
	for (const [dx, dy, r] of stormTops) disk(104 + dx, 10 + dy, r, 'W');
	rect(95, 14, 116, 14, 'S');

	/** A far-off bird: a shallow V. */
	const bird = (x: number, y: number, k = 'K') =>
		dots(k, [x - 2, y - 1], [x - 1, y], [x, y + 1], [x + 1, y], [x + 2, y - 1]);
	/** A little house: two rows of wall, a stepped roof and a dark door. */
	const house = (x: number, y: number, w = 3, wall = 'W', roof = 'R') => {
		rect(x, y - 1, x + w - 1, y, wall);
		rect(x, y - 2, x + w - 1, y - 2, roof);
		rect(x + 1, y - 3, x + w - 2, y - 3, roof);
		put(x + div(w, 2), y, 'K');
	};
	/** A tiny person: a head over a two-dot body. */
	const person = (x: number, y: number, body = 'K', head = 'C') => {
		put(x, y - 2, head);
		put(x, y - 1, body);
		put(x, y, body);
	};
	/** A tree: one dot of trunk under a round dark crown. */
	const tree = (x: number, y: number, r = 1.6) => {
		put(x, y, 'K');
		disk(x, y - 1 - r, r, 'D');
	};

	// ---------- land (left) and sea (right) ----------
	// wavy bands of two greens, with dark tufts dotted across them
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
	// the sea, with a coast that swings in toward the harbour
	for (let y = HOR - 1; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (x >= coast(y)) {
				// blue water with broken white wave crests
				const yy = y + Math.sin((x * Math.PI) / 5) * 1.2;
				c.g[y][x] = int(yy) % 6 === 0 && div(x, 4) % 3 !== 0 ? 'W' : 'B';
			} else if (x >= coast(y) - 1.5 && y > HOR) {
				// a strip of sand along the shore
				c.g[y][x] = 'C';
			}
		}
	}
	// far shore on the right
	for (let x = 96; x < 120; x++) {
		const h = Math.max(2.5 - Math.abs(x - 104) * 0.4, 3.5 - Math.abs(x - 115) * 0.5, 0);
		for (let y = int(HOR - 1 - h); y < HOR; y++) put(x, y, 'N');
	}

	// a winding river through the town
	for (let y = HOR + 2; y < 70; y++) {
		const xr = 13 + 7 * Math.sin((y - 30) / 6.0) - (y - 30) * 0.12;
		rect(int(xr), y, int(xr) + 1 + div(y - 30, 14), y, 'B');
	}
	// the city: red roofs to the horizon
	let k = 0;
	for (let y = HOR + 4; y < 66; y += 5) {
		for (let x = 0; x < 36; x += 5) {
			k += 1;
			const xx = x + ((k * 3) % 3);
			const yy = y + ((k * 7) % 2);
			// build only on open grass, clear of the river and of what is already there
			let open = xx + 4 < 12 + (80 - yy) * 0.5;
			for (let a = xx - 1; open && a < xx + 5; a++) {
				for (let b = yy - 3; open && b < yy + 1; b++) open = 'GLD'.includes(get(a, b));
			}
			if (open) {
				if (k % 7 === 3) tree(xx + 1, yy);
				else house(xx, yy, 3 + (k % 3 === 0 ? 1 : 0), k % 4 ? 'W' : 'C', k % 5 ? 'R' : 'M');
			}
		}
	}
	// church with a spire, town wall and a windmill
	rect(21, 37, 23, 41, 'W');
	rect(21, 35, 23, 36, 'N');
	rect(22, 31, 22, 34, 'N');
	put(22, 40, 'K');
	rect(24, 39, 27, 41, 'W');
	rect(24, 38, 27, 38, 'R');
	// the town wall, with a tooth on every third dot
	for (let x = 0; x < 30; x++) {
		put(x, 62, 'N');
		put(x, 63, 'N');
		if (x % 3 === 0) put(x, 61, 'N');
	}
	// two gate towers in the wall, with red caps and dark doors
	rect(8, 59, 10, 63, 'N');
	rect(8, 58, 10, 58, 'R');
	put(9, 62, 'K');
	rect(20, 59, 22, 63, 'N');
	rect(20, 58, 22, 58, 'R');
	put(21, 62, 'K');
	// the windmill: a grey post and four crossed sails
	rect(3, 46, 4, 49, 'N');
	line(0, 42, 7, 49, 'K');
	line(7, 42, 0, 49, 'K');

	// ---------- the tower ----------
	/**
	 * One storey of the tower: a curved band of wall `h` tall with its bottom middle on row
	 * `yb`, lit on the left and dark on the right, with buttresses and rows of arches.
	 * `raw` is bare red brick; `last` is the bottom storey, which runs on down to the ground.
	 */
	const tier = (i: number, hw: number, yb: number, h = TH, raw = false, last = false) => {
		const cx = cxat(yb);
		for (let x = int(cx - hw) - 1; x < int(cx + hw) + 2; x++) {
			// how far across the storey this column is, from -1 (left edge) to 1 (right edge)
			const u = (x - cx) / hw;
			if (Math.abs(u) > 1) continue;
			// the storey is round, so its edges sit higher than its middle
			const bow = 3.0 * Math.sqrt(1 - u * u) - 3.0;
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
			let wall: string;
			let butt: string;
			if (red) [wall, butt] = ['R', 'M'];
			else if (lit) [wall, butt] = ['C', 'O'];
			else [wall, butt] = ['O', 'M'];
			const y0 = round(ytop);
			const y1 = round(ybot) + (last ? 3 : 0);
			for (let y = y0; y <= y1; y++) {
				// the row of the storey, counting down from its top ledge
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
	// the raw red core, poking into the clouds
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
	// the ground the tower stands on
	for (let x = 18; x < 100; x++) {
		for (let y = 83; y < H; y++) {
			if (x < coast(y) - 1.5) put(x, y, y === 83 ? 'D' : (div(x, 6) + y) % 2 ? 'G' : 'L');
		}
	}

	// a big gate at the foot and dark inner halls on the second tier
	const gx = int(cxat(80)) - 6;
	rect(gx - 4, 73, gx + 4, 82, 'M');
	rect(gx - 3, 74, gx + 3, 82, 'K');
	rect(gx - 2, 72, gx + 2, 72, 'M');
	rect(gx - 1, 73, gx + 1, 73, 'K');
	rect(gx - 1, 79, gx + 1, 82, 'N');
	dots('C', [gx, 78]);
	// the road along the tower's foot, with carts of stone
	for (let x = 40; x < 97; x++) {
		if ('GL'.includes(get(x, 85))) put(x, 85, 'C');
		if ('GL'.includes(get(x, 86)) && div(x, 7) % 2) put(x, 86, 'C');
	}
	rect(gx - 1, 83, gx + 1, 85, 'C');
	// each cart: a grey load on two wheels, with a brown ox pulling it
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

	// scaffolding and cranes
	/** A crane: a post, a jib reaching out to side `d` with a brace, a load on a rope, and maybe a treadwheel. */
	const crane = (x: number, y: number, d = 1, arm = 7, wheel = true) => {
		rect(x, y - 7, x, y, 'K');
		line(x, y - 7, x + d * arm, y - 10, 'K');
		line(x, y - 4, x + d * 3, y - 8, 'K');
		rect(x + d * arm, y - 9, x + d * arm, y - 6, 'N');
		rect(x + d * arm - 1, y - 5, x + d * arm + 1, y - 4, 'W');
		if (wheel) {
			c.ring(x - d * 3, y - 2, 2.4, 'K', 1.0);
			put(x - d * 3, y - 2, 'N');
		}
	};
	crane(47, 14, -1, 9, false); // arm reaching out into the sky, top left
	crane(66, 12, 1, 8, false); // on the core
	crane(84, 41, 1, 8); // right shoulder
	crane(31, 51, -1, 7); // left shoulder
	crane(98, 68, 1, 7);
	// scaffold lattice on the core top
	for (let x = 52; x < 64; x += 3) rect(x, 3, x, 7, 'K');
	rect(51, 5, 64, 5, 'K');
	// ladders
	const ladders: [x: number, y0: number, y1: number][] = [
		[40, 52, 59],
		[76, 26, 32],
		[56, 34, 41],
		[92, 60, 67]
	];
	for (const [x, y0, y1] of ladders) {
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
			const bow = 3.0 * Math.sqrt(1 - u * u) - 3.0;
			const y = round(yb + bow - u * 1.6) - TH - 1;
			if ('CORMWN'.includes(get(x, y - 2)) || i < 6) {
				const body = (i + j) % 3 === 0 ? 'B' : (i + j) % 3 === 1 ? 'R' : 'W';
				// a dark head against pale stone, a pale one against anything else
				person(x, y, body, 'CW'.includes(get(x, y - 2)) ? 'K' : 'C');
			}
		});
	});

	// the cloud drifting across the upper tier
	const drift: [cx: number, cy: number, r: number][] = [
		[37, 28.5, 2.2],
		[42, 27, 3.2],
		[48, 26, 3.6],
		[54, 27, 3],
		[60, 26.5, 3.4],
		[66, 27.5, 2.6],
		[71, 28.5, 2]
	];
	for (const [cx, cy, r] of drift) disk(cx, cy, r, 'W');
	rect(35, 29, 73, 29, 'W');
	// its broken grey underside
	for (let x = 37; x < 73; x++) {
		if (div(x, 4) % 3) put(x, 30, 'N');
	}

	// birds and a far-off flock
	bird(5, 4);
	bird(19, 3);
	bird(30, 9);
	bird(37, 15);
	bird(27, 18);
	bird(4, 21);
	for (let i = 0; i < 5; i++) bird(78 + i * 4, 6 + Math.abs(i - 2) * 3);
	bird(114, 19);
	bird(100, 20);
	bird(117, 3);

	// ---------- harbour on the right ----------
	/** A sailing ship, `s` times life size: a hull, a mast, one square sail and a flag. */
	const ship = (x: number, y: number, s = 1, hull = 'M', sail = 'W', flag = 'R') => {
		rect(x - 3 * s, y, x + 3 * s, y, hull);
		rect(x - 2 * s, y + 1, x + 2 * s, y + 1, hull);
		put(x - 3 * s - 1, y - 1, hull);
		put(x + 3 * s + 1, y - 1, hull);
		rect(x, y - 5 * s - 1, x, y - 1, 'K');
		rect(x - 2 * s, y - 4 * s - 1, x + 2 * s, y - 2, sail);
		// on a big ship the mast shows in front of the sail
		if (s > 1) rect(x, y - 5 * s - 1, x, y - 1, 'K');
		put(x + 1, y - 5 * s - 2, flag);
		put(x, y - 5 * s - 2, 'K');
	};
	/** A rowing boat with two people in it. */
	const boat = (x: number, y: number, hull = 'K') => {
		rect(x - 2, y, x + 2, y, hull);
		put(x, y - 1, 'C');
		put(x - 1, y - 1, 'R');
	};
	/** A raft of logs with one man standing on it. */
	const raft = (x: number, y: number) => {
		rect(x - 3, y, x + 3, y, 'O');
		rect(x - 3, y + 1, x + 3, y + 1, 'M');
		put(x - 1, y - 1, 'K');
		put(x - 1, y - 2, 'C');
	};
	ship(108, 40, 1);
	ship(116, 36, 1, 'K', 'C');
	ship(100, 37, 1, 'K', 'W', 'R');
	ship(110, 56, 2, 'M', 'W');
	ship(104, 49, 1, 'K', 'C');
	boat(116, 62);
	boat(101, 61, 'M');
	ship(111, 76, 2, 'K', 'C', 'R');
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
	// trees and sheds on the shore behind the tower
	const shoreTrees: [number, number][] = [
		[88, 40],
		[92, 44],
		[86, 47],
		[95, 52],
		[93, 58]
	];
	for (const [x, y] of shoreTrees) tree(x, y, 1.8);
	house(89, 53, 3);
	house(94, 63, 3, 'C', 'M');
	// quay wall and sheds
	rect(96, 84, 109, 87, 'N');
	rect(96, 83, 109, 83, 'W');
	dots('K', [99, 82], [104, 82], [108, 82]);
	house(86, 87, 4, 'W', 'R');
	house(91, 87, 3, 'C', 'M');
	rect(76, 85, 80, 87, 'N');
	rect(76, 84, 80, 84, 'W');

	// ---------- foreground hill, bottom left: the king's visit ----------
	// a striped green slope with a dark rim along its top
	for (let x = 0; x < 30; x++) {
		const top = 66 + (x * x) / 50.0 + Math.sin(x / 2.0);
		for (let y = int(top); y < 88; y++) {
			put(x, y, int(Math.floor((y + Math.sin(x / 3.0) * 1.5) / 3)) % 2 ? 'G' : 'L');
		}
		put(x, int(top), 'D');
		put(x, int(top) + 1, 'D');
	}
	// cut stone blocks
	const blocks: [x: number, y: number, w: number][] = [
		[17, 81, 5],
		[21, 86, 4]
	];
	for (const [x, y, w] of blocks) {
		rect(x, y, x + w - 1, y + 1, 'N');
		rect(x, y - 1, x + w - 1, y - 1, 'W');
	}
	/** A standing figure with a hat, and a spear on side `spear` (0 for none). */
	const fig = (x: number, y: number, body: string, hat = 'K', spear = 0) => {
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
	// a courtier, and a guard with his spear
	fig(1, 81, 'M', 'K');
	fig(14, 80, 'B', 'N', 1);
	// the king in his red cloak, with a crown
	rect(5, 73, 9, 80, 'R');
	rect(4, 78, 10, 80, 'R');
	rect(6, 73, 8, 73, 'W');
	rect(7, 74, 7, 78, 'W');
	rect(6, 71, 8, 72, 'C');
	rect(6, 70, 8, 70, 'O');
	dots('O', [6, 69], [8, 69]);
	dots('K', [6, 81], [8, 81]);
	// sceptre
	rect(11, 75, 11, 81, 'K');
	put(11, 74, 'O');
	// kneeling masons in white
	const masons: [number, number][] = [
		[8, 86],
		[14, 86]
	];
	for (const [x, y] of masons) {
		rect(x, y - 2, x + 1, y, 'W');
		rect(x + 2, y, x + 3, y, 'W');
		rect(x, y - 4, x + 1, y - 3, 'C');
		rect(x, y - 5, x + 1, y - 5, 'K');
		put(x - 1, y - 2, 'C');
	}
	// a mallet left on a block
	dots('K', [19, 79], [20, 78], [21, 77], [22, 77]);
}

export const babel: Mural = {
	file: '00f-tower-of-babel',
	name: 'The Tower of Babel',
	prefix: 'tower-of-babel',
	notes: 'B',
	cols: 5,
	rows: 4,
	// S sky, W white, B sea blue, G grass, L light grass, D dark green, C cream stone,
	// O ochre stone, R red brick, M dark red-brown, K near black, N grey.
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
