// The Mice Bury the Cat, a Russian lubok print (early 1700s): a woodcut in black on
// off-white paper, colored by hand in red, yellow, green, lilac and ochre that slop past
// the lines. A funeral in three rows: musicians lead the way; the dead cat lies on its
// back with its paws tied, on a sledge pulled by mice; behind come mice with food and
// drink for the wake. Old script runs beside the figures. 4 by 3 panels of 28 by 28;
// the cat spans the middle two of the middle row.
import { SIDES, inell, mod, round, type Canvas, type Point } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 28;
const PH = 28;
const COLS = 4;
/** The row, in a panel, the figures stand on. */
const FEET = 24;

type Fill = string | ((x: number, y: number) => string);
const paint = (f: Fill, x: number, y: number) => (typeof f === 'string' ? f : f(x, y));

// a mouse's head, facing left: round ear, pointed snout, one eye
const HEAD = [
	'......KK...',
	'.....KeeK..',
	'...KKKeeK..',
	'..KfffKKfK.',
	'.KfKffffffK',
	'KfffffffffK',
	'.KKKfffffK.',
	'....KKKKK..'
];
const LEGS = ['.KbK.KbK.', '.KbK.KbK.', 'KKKK.KKK.'];
// a little mouse, facing left
const MINI = [
	'.....KK...',
	'....KeeK..',
	'..KKfffK..',
	'.KffKfffK.',
	'KfffffffK.',
	'.KKKKffK..',
	'...KcccK..',
	'..KcccccK.',
	'..KcccccK.',
	'.KcccccccK',
	'.KKKKKKKKK',
	'..KbK.KbK.',
	'.KKK.KKK..'
];

// the dead cat's face, eyes shut
const CAT = [
	'.KK...........KK.',
	'.KeK.........KeK.',
	'.KeeK.......KeeK.',
	'KOOOOKKKKKKKOOOOK',
	'KOKOOOOKOKOOOOKOK',
	'KOOKOOOKOKOOOKOOK',
	'KOOOOOOOOOOOOOOOK',
	'KOKKKOOOOOOOKKKOK',
	'KOOOOOOOOOOOOOOOK',
	'KKOOOYYYKYYYOOOKK',
	'.KOOYYYYYYYYYOOK.',
	'.KKOYKYYYYYKYOKK.',
	'..KKOYKKKKKYOKK..',
	'....KKKKKKKKK....'
];
const FLASK = ['.KKK.', '.KcK.', 'KKcKK', 'KcccK', 'KcdcK', 'KcccK', '.KKK.'];

// the script: marks three dots tall that spell nothing
const GLY =
	'111,101,101 101,111,101 101,101,111 11,10,11 111,010,010 101,010,101 101,110,101 1,1,1 11,11,10 111,110,111 011,101,011'
		.split(' ')
		.map((g) => g.split(','));

function draw(c: Canvas) {
	const { put, disk, line, dots } = c;

	/** A pattern whose marks are colors or color rules. */
	const art = (
		pattern: string[],
		x: number,
		y: number,
		key: Record<string, Fill>,
		flip = false
	) => {
		pattern.forEach((row, r) => {
			const marks = flip ? [...row].reverse() : [...row];
			marks.forEach((ch, i) => {
				if (Object.hasOwn(key, ch)) put(x + i, y + r, paint(key[ch], x + i, y + r));
			});
		});
	};

	/** An outlined shape: its edge in black ink, its inside filled. */
	const blob = (cells: Point[], fill: Fill) => {
		const set = new Set(cells.map(([x, y]) => `${x},${y}`));
		for (const [x, y] of cells) {
			const edge = SIDES.some(([dx, dy]) => !set.has(`${x + dx},${y + dy}`));
			put(x, y, edge ? 'K' : paint(fill, x, y));
		}
	};
	const where = (
		x0: number,
		y0: number,
		x1: number,
		y1: number,
		test: (x: number, y: number) => boolean
	) => {
		const out: Point[] = [];
		for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (test(x, y)) out.push([x, y]);
		return out;
	};
	const oval = (cx: number, cy: number, rx: number, ry: number) =>
		where(
			Math.floor(cx - rx),
			Math.floor(cy - ry),
			Math.ceil(cx + rx),
			Math.ceil(cy + ry),
			(x, y) => inell(x, y, cx, cy, rx, ry)
		);
	const box = (x0: number, y0: number, x1: number, y1: number) => where(x0, y0, x1, y1, () => true);
	/** A thick stroke from one point to another, `r` dots either side of its middle. */
	const stroke = (x0: number, y0: number, x1: number, y1: number, r = 1): Point[] => {
		const out: Point[] = [];
		const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
		for (let i = 0; i <= n; i++) {
			const x = round(x0 + ((x1 - x0) * i) / n);
			const y = round(y0 + ((y1 - y0) * i) / n);
			for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) out.push([x + dx, y + dy]);
		}
		return out;
	};
	const path = (col: string, ...pts: Point[]) => {
		for (let i = 1; i < pts.length; i++) line(...pts[i - 1], ...pts[i], col);
	};

	// coat patterns
	const dotted = (a: string, b: string) => (x: number, y: number) =>
		mod(x + 2 * y, 4) === 0 && y % 2 === 0 ? b : a;
	const striped = (a: string, b: string) => (_x: number, y: number) => (y % 3 === 0 ? b : a);
	const checked = (a: string, b: string) => (x: number, y: number) =>
		(Math.floor(x / 2) + Math.floor(y / 2)) % 2 ? b : a;
	const zigzag = (a: string, b: string) => (x: number, y: number) =>
		mod(y + Math.abs(mod(x, 4) - 2), 3) === 0 ? b : a;

	/** A thin tail from (x, y) going back (away from facing f), curling up at the end. */
	const tail = (x: number, y: number, f: number, len: number) => {
		const t: Point[] = [
			[0, 0],
			[len * 0.4, 3],
			[len * 0.7, 3],
			[len, 1],
			[len, -2],
			[len - 2, -3]
		];
		path('K', ...t.map(([dx, dy]): Point => [round(x - f * dx), y + dy]));
	};

	/**
	 * An upright mouse in a long coat, feet's middle at (x, y), facing f (-1 left).
	 * Each hand is [forward, up] from the feet's middle; `lean` tips the body forward.
	 */
	const mouse = (
		x: number,
		y: number,
		coat: Fill,
		{ f = -1, hands = [] as Point[], boots = 'M', ear = 'P', len = 7, lean = 0 } = {}
	) => {
		if (len) tail(x - f * 5, y - 4, f, len);
		art(LEGS, x - 4, y - 2, { K: 'K', b: boots }, f > 0);
		const cells: Point[] = [];
		for (let r = 0; r < 10; r++) {
			const h = 2.6 + r * 0.3;
			const s = f * round((lean * (9 - r)) / 9);
			for (let dx = round(-h); dx <= round(h); dx++) cells.push([x + s + dx, y - 12 + r]);
		}
		blob(cells, coat);
		for (const [hx, hy] of hands) {
			blob(stroke(x + f * (1 + lean), y - 10, x + f * hx, y + hy), coat);
			put(x + f * hx, y + hy, 'M');
		}
		const hx = x + f * lean;
		art(HEAD, f < 0 ? hx - 6 : hx - 4, y - 19 + (lean ? 1 : 0), { K: 'K', f: 'M', e: ear }, f > 0);
	};

	/** A little mouse, feet's middle at (x, y); its arms are thin, hands at [forward, up]. */
	const mini = (
		x: number,
		y: number,
		coat: Fill,
		{ f = -1, hands = [] as Point[], boots = 'M', len = 5 } = {}
	) => {
		if (len) tail(x - f * 4, y - 3, f, len);
		art(MINI, f < 0 ? x - 5 : x - 4, y - 12, { K: 'K', f: 'M', e: 'P', c: coat, b: boots }, f > 0);
		for (const [hx, hy] of hands) {
			line(x + f, y - 6, x + f * hx, y + hy, 'K');
			put(x + f * hx, y + hy, 'M');
		}
	};

	/** A lubok flower: a stem with leaves and a round head. */
	const plant = (x: number, y: number, h: number, head: string, eye = 'Y') => {
		line(x, y, x, y - h, 'G');
		for (let k = 2; k < h - 1; k += 2) put(x + (k % 4 ? 1 : -1), y - k, 'G');
		disk(x, y - h - 1, 1.5, 'K');
		dots(head, [x - 1, y - h - 1], [x + 1, y - h - 1], [x, y - h - 2]);
		put(x, y - h - 1, eye);
	};
	/** A little rosette, the kind that fills a print's empty spots. */
	const rosette = (x: number, y: number, col: string, eye = 'K') => {
		dots(col, [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
		put(x, y, eye);
	};

	/** A line of script from x0 to no further than x1, its marks' tops on row y. */
	const caption = (x0: number, x1: number, y: number, k = 0) => {
		let x = x0;
		while (true) {
			const g = GLY[k % GLY.length];
			if (x + g[0].length - 1 > x1) break;
			art(g, x, y, { 1: 'K' });
			x += g[0].length + (k % 4 === 3 ? 2 : 1);
			k += 1;
		}
	};

	// the ground under each row of figures: tufts of grass over hatched earth
	for (let row = 0; row < 3; row++) {
		const y = row * PH + FEET + 1;
		for (let x = 0; x < COLS * PW; x++) {
			if (mod(x, 5) === 2) put(x, y, 'G');
			for (const dy of [1, 2]) put(x, y + dy, mod(x - dy, 4) === 0 ? 'K' : 'O');
			if (mod(x, 9) === 4) put(x, y + 1, 'G');
		}
	}

	// ---------- 1. the bagpiper, and a little mouse dancing ----------
	c.at(0, 0);
	{
		const x = 17;
		const y = FEET;
		// two drones over his shoulder, tipped in yellow
		line(x + 2, y - 10, x + 6, y - 20, 'K');
		line(x + 3, y - 9, x + 9, y - 17, 'K');
		dots('Y', [x + 6, y - 21], [x + 7, y - 21], [x + 9, y - 18], [x + 10, y - 18]);
		mouse(x, y, dotted('R', 'Y'), { hands: [[6, -6]] });
		// the bag under his arm
		blob(oval(x - 1, y - 8, 3.5, 2.6), dotted('L', 'K'));
		// the chanter from his mouth down past the bag
		line(x - 6, y - 13, x - 7, y - 3, 'K');
		dots('Y', [x - 8, y - 2], [x - 7, y - 2], [x - 6, y - 2]);
		mini(5, y, checked('G', 'Y'), {
			f: 1,
			hands: [
				[3, -11],
				[-2, -11]
			],
			boots: 'R',
			len: 4
		});
		caption(1, 26, 0);
		caption(1, 9, 4, 5);
		caption(1, 7, 8, 1);
		rosette(26, 7, 'R');
	}

	// ---------- 2. the drummer ----------
	c.at(28, 0);
	{
		const x = 16;
		const y = FEET;
		mouse(x, y, striped('G', 'Y'), {
			hands: [
				[5, -12],
				[3, -11]
			],
			boots: 'R'
		});
		// the drum on his belly, its cords in a zigzag, its skin on top
		blob(box(x - 11, y - 9, x - 2, y - 3), zigzag('R', 'Y'));
		blob(oval(x - 6.5, y - 9, 5, 1.6), 'W');
		// sticks raised
		line(x - 5, y - 12, x - 7, y - 16, 'K');
		line(x - 3, y - 11, x - 1, y - 16, 'K');
		dots('Y', [x - 7, y - 17], [x - 1, y - 17]);
		caption(1, 26, 0, 3);
		caption(1, 7, 4, 8);
		caption(21, 27, 9, 0);
		plant(2, y, 7, 'L');
		rosette(25, 6, 'Y');
	}

	// ---------- 3. the fiddler ----------
	c.at(56, 0);
	{
		const x = 18;
		const y = FEET;
		mouse(x, y, checked('B', 'Y'), {
			hands: [
				[7, -11],
				[3, -5]
			]
		});
		// a pear-shaped fiddle held upright, and its bow
		blob(box(x - 9, y - 15, x - 7, y - 8), 'O');
		dots('R', [x - 10, y - 14], [x - 6, y - 14], [x - 10, y - 12], [x - 6, y - 12]);
		blob(oval(x - 8, y - 5, 4, 4), (xx, yy) => (yy === y - 4 ? 'K' : 'Y'));
		dots('K', [x - 10, y - 6], [x - 6, y - 6]);
		put(x - 8, y - 7, 'R');
		path('K', [x - 16, y - 9], [x - 8, y - 6], [x - 1, y - 2]);
		dots('R', [x - 17, y - 10], [x - 16, y - 10]);
		caption(1, 26, 0, 6);
		caption(1, 9, 4, 2);
		plant(3, y, 4, 'R');
		rosette(25, 6, 'L');
	}

	// ---------- 4. the horn, and a little mouse weeping ----------
	c.at(84, 0);
	{
		const x = 17;
		const y = FEET;
		mouse(x, y, dotted('Y', 'R'), {
			hands: [
				[6, -13],
				[3, -9]
			],
			boots: 'K',
			len: 6
		});
		// a long horn from his mouth, up and ahead, banded, with a wide bell
		blob(stroke(x - 6, y - 13, x - 11, y - 18), (xx, yy) => ((xx + yy) % 2 ? 'Y' : 'O'));
		blob(oval(x - 12, y - 19, 2.5, 2.5), 'Y');
		put(x - 12, y - 19, 'K');
		// she dabs her eye with a red kerchief
		mini(5, y, striped('L', 'G'), { hands: [[3, -8]], len: 0 });
		blob(box(1, y - 9, 3, y - 7), 'R');
		dots('B', [1, y - 6], [2, y - 4], [0, y - 3], [1, y - 1]);
		caption(1, 26, 0, 9);
		rosette(23, 5, 'Y');
	}

	// ---------- 5. the sledge team ----------
	c.at(0, 28);
	{
		const y = FEET;
		// leaning into a rope that runs back over their shoulders to the sledge
		mouse(21, y - 1, dotted('G', 'Y'), { hands: [[6, -11]], len: 3, lean: 3 });
		path('O', [27, y - 6], [22, y - 10], [15, y - 12]);
		mouse(9, y, striped('L', 'R'), { hands: [[6, -11]], len: 4, lean: 3 });
		path('O', [15, y - 12], [10, y - 11], [3, y - 11]);
		put(15, y - 12, 'M');
		caption(1, 26, 0, 1);
		rosette(14, 5, 'R');
	}

	// ---------- 6 and 7. the cat on its sledge ----------
	c.at(28, 28);
	{
		const y = FEET;
		// the sledge: a runner curling up at the front, a deck of planks on posts
		line(1, y, 53, y, 'K');
		path('K', [1, y], [-1, y - 2], [-1, y - 4], [1, y - 6]);
		blob(box(1, y - 4, 54, y - 2), (x) => (x % 4 ? 'R' : 'Y'));
		for (let x = 4; x < 54; x += 6) put(x, y - 1, 'K');
		// the tail, curling up behind
		blob(stroke(49, y - 8, 53, y - 17, 1), (x, yy) => ((x + yy) % 3 ? 'O' : 'K'));
		// the body on its back: a spotted yellow belly up, a striped back below
		blob(oval(30, y - 8, 21, 5.5), (x, yy) =>
			yy < y - 8
				? mod(x * 3 + yy, 5) === 0
					? 'O'
					: 'Y'
				: mod(x + round((yy - y) / 2), 4) === 0
					? 'K'
					: 'O'
		);
		// four legs in the air, each pair bound at the ankles with red rope
		for (const x of [19, 41]) {
			for (const s of [-1, 1]) {
				blob(stroke(x + s * 5, y - 12, x + s * 2, y - 19), (xx, yy) => (yy % 3 ? 'O' : 'K'));
				blob(oval(x + s * 3, y - 21, 2.2, 1.6), 'W');
			}
			for (let k = -3; k <= 3; k++) {
				put(x + k, y - 18, mod(k, 3) === 0 ? 'K' : 'R');
				put(x + k, y - 17, mod(k + 1, 3) === 0 ? 'K' : 'R');
			}
			path('R', [x + 3, y - 16], [x + 5, y - 15], [x + 6, y - 13]);
		}
		// a tasseled pillow under the head, the head on it
		blob(box(0, y - 10, 14, y - 4), checked('L', 'Y'));
		dots('Y', [-1, y - 11], [15, y - 11], [-1, y - 3], [15, y - 3]);
		art(CAT, -1, y - 22, { K: 'K', O: 'O', e: 'P', Y: 'Y' });
		// long whiskers
		path('K', [1, y - 13], [-3, y - 14], [-7, y - 14]);
		path('K', [1, y - 12], [-3, y - 11], [-7, y - 12]);
		path('K', [15, y - 13], [19, y - 14], [23, y - 14]);
		path('K', [15, y - 12], [19, y - 11], [23, y - 12]);
		caption(26, 34, 2, 7);
		caption(47, 54, 1, 1);
		caption(47, 54, 5, 5);
	}

	// ---------- 8. the rider ----------
	c.at(84, 28);
	{
		const y = FEET;
		// a mouse on all fours, saddled, carrying a little one
		tail(21, y - 6, -1, 5);
		blob(oval(13, y - 6, 8, 3.5), 'M');
		for (const x of [7, 10, 16, 19]) blob(box(x - 1, y - 4, x + 1, y), 'M');
		art(HEAD, 1, y - 11, { K: 'K', f: 'M', e: 'P' });
		blob(box(9, y - 10, 18, y - 6), checked('R', 'Y'));
		mini(14, y - 8, striped('B', 'Y'), {
			hands: [
				[5, -13],
				[4, -6]
			],
			len: 0,
			boots: 'R'
		});
		// reins to the mount's mouth
		line(9, y - 14, 4, y - 8, 'R');
		// waving a green branch
		line(9, y - 21, 7, y - 24, 'G');
		dots('G', [6, y - 23], [8, y - 25], [6, y - 25]);
		caption(1, 26, 0, 7);
		caption(20, 26, 4, 4);
		rosette(3, 6, 'R');
	}

	// ---------- 9. pancakes ----------
	c.at(0, 56);
	{
		const x = 17;
		const y = FEET;
		mouse(x, y, striped('B', 'Y'), {
			hands: [
				[6, -8],
				[4, -8]
			]
		});
		// a stack of pancakes on a dish, a pat of butter on top
		line(x - 14, y - 8, x - 3, y - 8, 'K');
		for (let k = 0; k < 4; k++) blob(oval(x - 8.5, y - 10 - k * 2, 5, 1.4), k % 2 ? 'O' : 'Y');
		dots('R', [x - 9, y - 17], [x - 8, y - 17]);
		// a pot of kasha set down on the ground
		blob(
			where(1, y - 6, 11, y, (xx, yy) => inell(xx, yy, 6, y - 6, 5, 6.5)),
			(xx, yy) => (mod(xx + yy, 3) ? 'G' : 'Y')
		);
		line(1, y - 6, 11, y - 6, 'K');
		dots('O', [4, y - 7], [5, y - 7], [6, y - 7], [7, y - 7], [8, y - 7]);
		caption(1, 26, 0, 2);
		caption(1, 9, 4, 6);
		rosette(25, 6, 'G');
	}

	// ---------- 10. the fish ----------
	c.at(28, 56);
	{
		const x = 19;
		const y = FEET;
		mouse(x, y, dotted('R', 'K'), {
			hands: [
				[5, -9],
				[3, -7]
			]
		});
		// a big fish in his arms, longer than he is: scaly back, yellow belly, forked tail
		blob(
			where(14, y - 14, 19, y - 4, (xx, yy) => Math.abs(yy - (y - 9)) <= (xx - 14) * 0.9 + 1),
			'G'
		);
		blob(oval(8, y - 9, 8, 3.6), (xx, yy) =>
			yy > y - 8 ? 'Y' : mod(xx + 2 * (yy % 2), 4) === 0 ? 'K' : 'G'
		);
		line(4, y - 11, 4, y - 7, 'K');
		put(2, y - 10, 'K');
		blob(
			where(6, y - 15, 12, y - 12, (xx, yy) => yy - (y - 15) >= (xx - 6) * 0.5),
			'O'
		);
		caption(1, 26, 0, 5);
		caption(1, 8, 4, 9);
		rosette(25, 6, 'R');
	}

	// ---------- 11. the beer barrel ----------
	c.at(56, 56);
	{
		const y = FEET;
		mouse(8, y, checked('L', 'G'), { hands: [[4, -9]], len: 0 });
		// a barrel on a little cart, hooped, with a tap
		line(12, y - 3, 26, y - 3, 'K');
		blob(oval(19.5, y - 9, 6.5, 5), (x, yy) =>
			Math.abs(x - 19.5) === 3.5 ? 'K' : yy % 2 ? 'O' : 'Y'
		);
		blob(box(25, y - 10, 27, y - 8), 'R');
		c.ring(14, y - 2, 1.8, 'K');
		c.ring(24, y - 2, 1.8, 'K');
		caption(1, 26, 0, 8);
		rosette(18, 5, 'L');
	}

	// ---------- 12. pie, and flasks ----------
	c.at(84, 56);
	{
		const x = 17;
		const y = FEET;
		mouse(x, y, striped('R', 'G'), {
			hands: [
				[6, -9],
				[4, -9]
			],
			len: 6
		});
		// a domed pie with a lattice crust, on a dish
		line(x - 14, y - 8, x - 4, y - 8, 'K');
		blob(
			where(x - 14, y - 15, x - 4, y - 9, (xx, yy) => inell(xx, yy, x - 9, y - 9, 5, 5.5)),
			(xx, yy) => (mod(xx + yy, 3) === 0 || mod(xx - yy, 3) === 0 ? 'O' : 'Y')
		);
		// flasks at his belt
		art(FLASK, x - 1, y - 8, { K: 'K', c: 'G', d: 'Y' });
		art(FLASK, x + 3, y - 7, { K: 'K', c: 'B', d: 'Y' });
		caption(1, 26, 0, 10);
		caption(18, 26, 4, 1);
		caption(1, 9, 4, 3);
		rosette(3, y - 3, 'Y', 'R');
	}
	c.at();

	// the color slops a little past the ink, here and there
	const SLOP = 'RYGLBO';
	for (let y = 0; y < c.h; y++) {
		for (let x = 0; x < c.w; x++) {
			if (c.g[y][x] !== 'W' || mod(x * 7 + y * 13 + x * y, 23) !== 0) continue;
			for (const [dx, dy] of SIDES) {
				const k = c.get(x + 2 * dx, y + 2 * dy);
				if (k && c.get(x + dx, y + dy) === 'K' && SLOP.includes(k)) {
					c.g[y][x] = k;
					break;
				}
			}
		}
	}
}

export const mice: Mural = {
	file: '03-mice-bury-the-cat',
	name: 'The Mice Bury the Cat',
	prefix: 'mice-bury-the-cat',
	notes: 'A',
	cols: COLS,
	panel: [PW, PH],
	// W paper, K ink, R cinnabar, Y yellow, G green, L lilac, B blue, O ochre, M mouse gray, P pink
	palette: {
		W: '#f2e8cc',
		K: '#211a16',
		R: '#d5492c',
		Y: '#f0c43c',
		G: '#4a8a3a',
		L: '#b493d4',
		B: '#2f53a3',
		O: '#a8702c',
		M: '#8e8c88',
		P: '#f0a39b'
	},
	ground: 'W',
	panels: [
		['bagpiper', 'The Bagpiper', { mode: 'dorian', spice: 'lively', lead: 'flute' }],
		['drummer', 'The Drummer', { mode: 'mixolydian', spice: 'lively', lead: 'mallet' }],
		['fiddler', 'The Fiddler', { mode: 'harmonic', spice: 'gentle', lead: 'string' }],
		['horn', 'The Horn', { mode: 'mixolydian', spice: 'gentle', lead: 'brass' }],
		['sledge-team', 'Sledge Team', { mode: 'minor', spice: 'gentle', lead: 'pizz' }],
		['cats-head', "The Cat's Head", { mode: 'phrygian', spice: 'gentle', lead: 'keys' }],
		['tied-paws', 'Tied Paws', { mode: 'minor', spice: 'adventurous', lead: 'vibes' }],
		['rider', 'The Rider', { mode: 'major', spice: 'lively', lead: 'kalimba' }],
		['pancakes', 'Pancakes', { mode: 'major', spice: 'gentle', lead: 'harp' }],
		['fish', 'The Fish', { mode: 'dorian', spice: 'adventurous', lead: 'mallet' }],
		['beer-barrel', 'Beer Barrel', { mode: 'mixolydian', spice: 'lively', lead: 'brass' }],
		['pie-and-flasks', 'Pie and Flasks', { mode: 'lydian', spice: 'gentle', lead: 'pizz' }]
	],
	draw
};
