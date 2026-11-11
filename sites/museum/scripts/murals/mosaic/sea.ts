/*
 * The Sea Creatures: a homage to the marine-life floor mosaic from the House of the
 * Faun, Pompeii. 4 x 4 panels of 20 x 18 dots (80 x 72).
 */
import { int, mod, points, round } from '../canvas.ts';
import type { Canvas, Point } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 20;
const PH = 18;
const COLS = 4;
const ROWS = 4;
const W = PW * COLS;
const H = PH * ROWS;

// the floor's color at a spot: two tones in broad wavy rows
function ground(gx: number, gy: number): string {
	const yy = gy + 1.1 * Math.sin((gx * 2 * Math.PI) / 20 + 0.6);
	return mod(Math.floor((yy + 1) / 4.5), 2) === 0 ? 'N' : 'B';
}

// round a path's corners: each pass cuts every corner into two softer ones
function chaikin(pts: Point[]): Point[] {
	for (let pass = 0; pass < 3; pass++) {
		const q: Point[] = [pts[0]];
		for (let i = 0; i + 1 < pts.length; i++) {
			const [x0, y0] = pts[i];
			const [x1, y1] = pts[i + 1];
			q.push(
				[x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25],
				[x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]
			);
		}
		pts = [...q, pts[pts.length - 1]];
	}
	return pts;
}

function walk(pts: Point[]): Point[] {
	const out: Point[] = [];
	for (let k = 0; k + 1 < pts.length; k++) {
		const [x0, y0] = pts[k];
		const [x1, y1] = pts[k + 1];
		const n = Math.max(1, int(Math.hypot(x1 - x0, y1 - y0) / 0.5));
		for (let i = 0; i < n; i++) out.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
	}
	return [...out, pts[pts.length - 1]];
}

function draw(c: Canvas) {
	let ox = 0;
	let oy = 0;
	const { put, rect, ell, disk, line, dots } = c;

	for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) c.g[y][x] = ground(x, y);

	const erase = (x: number, y: number) => put(x, y, ground(x + ox, y + oy));

	// draw in this panel's coordinates from now on, with paint kept inside it
	const panel = (col: number, row: number) => {
		ox = col * PW;
		oy = row * PH;
		c.at(ox, oy);
		c.clip(0, 0, PW - 1, PH - 1);
	};

	// a fat line along a path, its width going from r0 to r1; gives back the points it ran over
	const thick = (pts: Point[], r0: number, r1: number, col: string, smooth = true): Point[] => {
		const w = walk(smooth ? chaikin(pts) : pts);
		w.forEach(([x, y], i) => disk(x, y, r0 + ((r1 - r0) * i) / Math.max(1, w.length - 1), col));
		return w;
	};

	// d is 1 when it swims right (tail on the left), -1 when left; th is half the tail's height
	const fish = (
		cx: number,
		cy: number,
		rx: number,
		ry: number,
		body: string,
		{ d, belly, tail = body, th = 3 }: { d: number; belly?: string; tail?: string; th?: number }
	) => {
		ell(cx, cy, rx, ry, body);
		if (belly) ell(cx, cy, rx, ry, belly, (_x, y) => y > cy + ry * 0.3);
		const bx = cx - d * (rx - 1);
		for (let i = 0; i <= 3; i++) {
			const hh = Math.max(0.6, (th * i) / 3);
			for (let y = round(cy - hh); y <= round(cy + hh); y++) put(round(bx - d * i), y, tail);
		}
		erase(round(bx - d * 3), round(cy));
	};

	// ---------- 1. the kingfisher on its rock ----------
	panel(0, 0);
	ell(9, 19, 8, 6, 'G');
	rect(3, 16, 6, 16, 'S');
	rect(11, 15, 14, 15, 'S');
	dots('R', [8, 13], [10, 13]);
	ell(8.5, 9, 3, 3.8, 'S');
	ell(9, 9.5, 2.5, 3, 'O', (x) => x >= 9);
	dots('S', [5, 11], [4, 12], [5, 12], [3, 13], [4, 13], [5, 13]);
	disk(10, 4.5, 2.3, 'S');
	dots('C', [10, 6], [11, 6], [9, 6]);
	put(11, 4, 'N');
	rect(13, 4, 16, 4, 'R');
	rect(13, 5, 14, 5, 'R');

	// ---------- 2. the moray eel ----------
	panel(1, 0);
	const eel: Point[] = [];
	for (let x = 1; x < 15; x++) eel.push([x, 10 + 4.2 * Math.sin(((x - 1) * 2 * Math.PI) / 13)]);
	const eelPath = thick(eel, 0.8, 2, 'O', false);
	for (let i = 10; i < eelPath.length - 6; i += 7) {
		const [x, y] = eelPath[i];
		put(x, y, 'K');
		put(x + 1, y, 'K');
	}
	const [hx, hy] = eel[eel.length - 1];
	ell(hx + 2, hy - 0.5, 3, 2.3, 'O');
	put(hx + 2, hy - 2, 'C');
	put(hx + 3, hy - 2, 'N');
	rect(int(hx + 3), int(hy), int(hx + 5), int(hy), 'N');
	rect(int(hx + 3), int(hy + 1), int(hx + 4), int(hy + 1), 'C');

	// ---------- 3. the red mullet ----------
	panel(2, 0);
	fish(9, 10, 7, 3.6, 'R', { d: -1, belly: 'C' });
	rect(5, 10, 14, 10, 'O');
	rect(6, 8, 13, 8, 'O');
	for (const x of [7, 9, 11]) rect(x, 5, x, 6, 'O');
	rect(6, 6, 12, 6, 'O');
	put(4, 9, 'C');
	put(4, 8, 'N');
	dots('C', [3, 13], [2, 14], [4, 14]);
	rect(8, 14, 10, 14, 'O');

	// ---------- 4. the squid ----------
	panel(3, 0);
	ell(8, 9, 5, 2.6, 'C');
	dots('C', [2, 9], [3, 9]);
	for (let i = 0; i < 3; i++) {
		rect(3 + i, 5 + i, 3 + i, 6, 'O');
		rect(3 + i, 12, 3 + i, 14 - i, 'O');
	}
	dots('R', [6, 8], [8, 10], [10, 8], [5, 10], [11, 10]);
	disk(13.5, 9, 1.5, 'O');
	put(13, 8, 'N');
	for (const [y0, y1] of points('8,6 9,9 10,12')) line(15, y0, 17, y1, 'O');
	thick(points('14,8 15,5 17,3'), 0.5, 0.5, 'C');
	thick(points('14,10 15,13 17,15'), 0.5, 0.5, 'C');

	// ---------- 5. the sea bass ----------
	panel(0, 1);
	fish(11.5, 9, 6.5, 4, 'S', { d: 1, belly: 'C', th: 3.4 });
	for (let x = 9; x < 15; x += 2) rect(x, 2 + (x > 11 ? 1 : 0), x, 4, 'G');
	rect(9, 4, 14, 4, 'G');
	rect(9, 13, 12, 13, 'G');
	rect(10, 14, 11, 14, 'G');
	put(15, 7, 'C');
	put(16, 7, 'N');
	rect(13, 6, 13, 11, 'G');
	for (const x of [8, 10]) rect(x, 6, x, 9, 'K');

	// ---------- 8. the scorpionfish ----------
	panel(3, 1);
	fish(8, 10, 6, 4.2, 'R', { d: -1, tail: 'O' });
	for (let x = 4; x < 13; x += 2) rect(x, 3, x, 6, 'O');
	rect(4, 6, 12, 6, 'O');
	for (const [x, y] of points('6,14 8,15 10,14')) line(8, 12, x, y, 'O');
	dots('K', [7, 8], [10, 9], [8, 11], [11, 11], [12, 8]);
	disk(4, 9, 1, 'C');
	put(4, 9, 'N');
	rect(2, 11, 4, 11, 'K');
	dots('O', [2, 8], [1, 12], [3, 13]);

	// ---------- 9. the ray, seen from above ----------
	panel(0, 2);
	for (let y = 0; y < 18; y++) {
		for (let x = 0; x < 20; x++) {
			const inside = (Math.abs(x - 10.5) / 7.5) ** 1.4 + (Math.abs(y - 7.5) / 5.5) ** 1.4 <= 1;
			if (inside) put(x, y, 'G');
		}
	}
	thick(points('10.5,12 12,15 16,16 18,14'), 0.6, 0.4, 'G');
	dots('C', [9, 4], [12, 4]);
	dots('K', ...points('7,7 14,7 6,9 15,9 8,10 13,10 10,7 11,7 10,9 11,9'));
	rect(10, 5, 11, 5, 'K');

	// ---------- 12. the gurnard ----------
	panel(3, 2);
	ell(10, 13.4, 5, 3, 'S');
	ell(9, 4.4, 4, 2.4, 'S');
	rect(7, 14, 13, 14, 'R');
	rect(7, 4, 11, 4, 'R');
	for (let x = 4; x < 16; x++) {
		const hh = 3 - (2.4 * (x - 4)) / 11;
		for (let y = round(9 - hh); y <= round(9 + hh); y++) put(x, y, 'O');
	}
	disk(4.5, 9, 3, 'O');
	rect(15, 7, 16, 11, 'R');
	put(17, 6, 'R');
	put(17, 12, 'R');
	erase(16, 9);
	disk(4.5, 8, 1.3, 'C');
	put(4, 8, 'N');
	rect(1, 11, 3, 11, 'R');

	// ---------- 13. the rocks and seaweed ----------
	panel(0, 3);
	// each strand of weed: where it starts, how tall it is, where in its sway
	const strands = [
		[4, 11, 0],
		[9, 13, 2],
		[14, 9, 1],
		[17, 12, 3]
	];
	for (const [x0, height, phase] of strands) {
		for (let i = 0; i < height; i++) {
			const y = 13 - i;
			const x = x0 + round(1.2 * Math.sin(i * 0.9 + phase));
			rect(x, y, x + 1, y, 'S');
		}
	}
	ell(7, 16, 5.5, 4.6, 'G');
	ell(15, 16, 5, 3.4, 'G');
	rect(4, 14, 8, 14, 'K');
	rect(13, 15, 17, 15, 'K');
	rect(8, 12, 10, 12, 'K');
	dots('R', [11, 13], [10, 14], [11, 14], [12, 14], [11, 15], [9, 15], [13, 15]);

	// ---------- 14. the dogfish ----------
	panel(1, 3);
	for (let x = 1; x < 16; x++) {
		const hh = 2.4 * Math.sin(Math.PI * Math.min(1, (x - 0.5) / 15) ** 0.6) + 0.3;
		for (let y = round(8 - hh); y <= round(8 + hh); y++) put(x, y, y > 8 ? 'C' : 'G');
	}
	for (let i = 0; i < 4; i++) rect(15 + i, 7 - i, 15 + i, 8 - i, 'G');
	rect(15, 9, 16, 9, 'G');
	put(17, 10, 'G');
	for (let i = 0; i < 3; i++) {
		rect(7 + i, 5 - i, 9, 5 - i, 'G');
		rect(5 + i, 11 + i, 6 + i, 11 + i, 'G');
	}
	rect(12, 5, 13, 5, 'G');
	put(13, 4, 'G');
	rect(12, 10, 13, 10, 'G');
	put(3, 7, 'N');
	dots('K', [6, 7], [8, 7], [10, 7], [12, 7], [5, 8]);

	// ---------- 15. the prawn ----------
	panel(2, 3);
	const radians = (degrees: number) => degrees * (Math.PI / 180);
	const arc: Point[] = [];
	for (let a = 180; a < 400; a += 12) {
		arc.push([10.5 + 5.5 * Math.cos(radians(a)), 10 + 5 * Math.sin(radians(a))]);
	}
	const prawnPath = thick(arc, 2, 1.1, 'O', false);
	for (let k = 18; k < prawnPath.length - 4; k += 11) {
		const [x, y] = prawnPath[k];
		const a = Math.atan2(y - 10, x - 10.5);
		for (const t of [-2, -1, 0, 1, 2]) put(x + t * Math.cos(a), y + t * Math.sin(a), 'R');
	}
	const [tx, ty] = arc[arc.length - 1];
	for (const [dx, dy] of points('-1,0 -2,0 -2,1 -3,-1 -3,1 -3,0')) put(tx + dx, ty + dy, 'R');
	put(5, 9, 'N');
	put(5, 8, 'C');
	thick(points('4,9 2,5 5,2 11,1'), 0.4, 0.4, 'C');
	thick(points('4,12 3,14 5,15'), 0.4, 0.4, 'C');

	// ---------- 16. the murex shell ----------
	panel(3, 3);
	for (let a = 0; a < 360; a += 45) {
		const cos = Math.cos(radians(a));
		const sin = Math.sin(radians(a));
		line(8 + 4 * cos, 7 + 4 * sin, 8 + 6.4 * cos, 7 + 6.4 * sin, 'O');
	}
	disk(8, 7, 4.6, 'C');
	for (let i = 10; i < 80; i++) {
		const t = i / 6;
		const r = 0.33 * t;
		put(8 + r * Math.cos(t), 7 + r * Math.sin(t), 'K');
	}
	for (let i = 0; i < 8; i++) {
		rect(10 + i, 10 + round(i * 0.6), 11 + i - (i > 5 ? 1 : 0), 10 + round(i * 0.6), 'C');
	}
	dots('O', [13, 10], [15, 12]);

	// ---------- 6, 7, 10, 11: the octopus and the lobster ----------
	// they fill the four middle panels, so they are drawn in the mural's own coordinates
	c.at(0, 0);
	c.clip(PW, PH, PW * 3 - 1, PH * 3 - 1);
	// an octopus arm, thinning toward the tip, with pale suckers along it
	const arm = (path: string) => {
		const w = thick(points(path), 1.5, 0.7, 'O');
		for (let i = 3; i < w.length - 1; i += 5) put(round(w[i][0]), round(w[i][1]), 'C');
	};
	// arms that pass behind the lobster
	arm('40,36 40,42 41,50 38,52 36,50');
	arm('42,36 46,41 50,47 53,52 57,51 58,48');

	// the lobster
	thick(points('35,44 29,45 25,44 21,46'), 0.4, 0.4, 'R');
	thick(points('35,43 31,39 26,37 21,38'), 0.4, 0.4, 'R');
	for (const x of [38, 40, 42, 44]) line(x, 48, x - 2, 52, 'R');
	const claw = (cx: number, cy: number, up: number) => {
		ell(cx, cy, 3.4, 2.2, 'R');
		rect(cx - 4, cy, cx - 1, cy, 'N');
		put(cx + 1, cy + up, 'K');
		put(cx + 2, cy + up, 'K');
	};
	thick(points('36,45 32,43 29,41'), 0.9, 0.9, 'R', false);
	claw(26, 41, -1);
	thick(points('36,47 32,49 29,50'), 0.9, 0.9, 'R', false);
	claw(26, 50, 1);
	ell(41, 46, 6, 3.3, 'R');
	for (let i = 0; i < 5; i++) {
		const x = 47 + i * 2;
		const y = 46 + round(i * 0.5);
		rect(x, y - 2, x + 1, y + 2, 'R');
		rect(x + 1, y - 2, x + 1, y + 2, 'K');
	}
	rect(57, 46, 58, 51, 'R');
	put(59, 45, 'R');
	put(59, 52, 'R');
	rect(57, 48, 57, 49, 'K');
	put(36, 45, 'C');
	rect(39, 44, 45, 44, 'K');
	rect(42, 45, 42, 48, 'K');

	// the octopus's head, then its arms in front
	ell(40, 25.5, 6.5, 6.5, 'O');
	rect(36, 31, 44, 34, 'O');
	for (const [x, y] of points('37,22 42,23 39,26 43,27 36,27')) rect(x, y, x + 1, y, 'K');
	disk(37, 32, 1.2, 'C');
	disk(43, 32, 1.2, 'C');
	put(37, 32, 'N');
	put(43, 32, 'N');
	arm('36,32 31,29 27,25 26,21 29,19 31,22');
	arm('36,34 30,35 24,33 22,28 24,26');
	arm('38,36 35,40 32,45 33,51 30,52 28,50');
	arm('44,32 49,29 53,25 54,21 51,19 49,22');
	arm('44,34 50,35 56,33 58,28 56,26');
	arm('43,36 48,39 53,41 54,46 52,50');

	// ---------- the wave border ----------
	// two rows of dashes, the inner one a step behind, running the same way round the frame
	for (const k of [0, 1]) {
		for (let i = 0; i < W; i++) {
			const col = (i + k) % 4 < 2 ? 'R' : 'C';
			c.g[k][i] = col;
			c.g[H - 1 - k][W - 1 - i] = col;
		}
	}
	for (const k of [0, 1]) {
		for (let i = 0; i < H; i++) {
			const col = (i + k) % 4 < 2 ? 'R' : 'C';
			c.g[H - 1 - i][k] = col;
			c.g[i][W - 1 - k] = col;
		}
	}
}

export const sea: Mural = {
	file: '00e-sea-creatures',
	name: 'The Sea Creatures',
	prefix: 'sea-creatures',
	notes: 'D',
	cols: COLS,
	panel: [PW, PH],
	palette: {
		N: '#121c2b', // deep blue-black ground
		B: '#2a5c78', // second ground tone
		C: '#f3e6c4', // cream
		R: '#b9432b', // terracotta red
		O: '#e59a45', // ochre / pale orange
		G: '#9a9ca3', // grey stone
		S: '#58a886', // sea green
		K: '#7b4a2a' // brown
	},
	ground: 'N',
	panels: [
		['kingfisher', 'The Kingfisher', { mode: 'lydian', spice: 'gentle', lead: 'flute' }],
		['moray-eel', 'The Moray Eel', { mode: 'dorian', spice: 'lively', lead: 'pizz' }],
		['red-mullet', 'The Red Mullet', { mode: 'pentatonic', spice: 'gentle', lead: 'kalimba' }],
		['squid', 'The Squid', { mode: 'mixolydian', spice: 'lively', lead: 'vibes', meter: 3 }],
		['sea-bass', 'The Sea Bass', { mode: 'harmonic', spice: 'gentle', lead: 'harp' }],
		[
			'octopus-head',
			"The Octopus's Head",
			{ mode: 'dorian', spice: 'adventurous', lead: 'string' }
		],
		['curling-arms', 'The Curling Arms', { mode: 'mixolydian', spice: 'lively', lead: 'mallet' }],
		['scorpionfish', 'The Scorpionfish', { mode: 'phrygian', spice: 'adventurous', lead: 'brass' }],
		['ray', 'The Ray', { mode: 'lydian', spice: 'gentle', lead: 'vibes', meter: 3 }],
		['lobster-claws', "The Lobster's Claws", { mode: 'minor', spice: 'adventurous', lead: 'keys' }],
		['lobster-tail', "The Lobster's Tail", { mode: 'dorian', spice: 'lively', lead: 'pizz' }],
		['gurnard', 'The Gurnard', { mode: 'minor-pentatonic', spice: 'lively', lead: 'kalimba' }],
		[
			'rocks-and-seaweed',
			'Rocks and Seaweed',
			{ mode: 'lydian', spice: 'gentle', lead: 'harp', meter: 3 }
		],
		['dogfish', 'The Dogfish', { mode: 'minor', spice: 'lively', lead: 'string' }],
		['prawn', 'The Prawn', { mode: 'mixolydian', spice: 'gentle', lead: 'mallet' }],
		['murex-shell', 'The Murex Shell', { mode: 'major', spice: 'gentle', lead: 'flute' }]
	],
	draw
};
