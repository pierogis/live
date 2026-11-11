// Ōtsu-e (Ōtsu, Japan, 1600s–1800s): quick folk paintings sold to travelers on the Tōkaidō
// road, in thick black outlines and flat vermilion, ochre, green, gray-blue and white on
// buff paper, often with a line of writing and a red seal. Here the stock characters meet:
// the demon dressed as a begging monk, the Wisteria Maiden, the Thunder God fishing for his
// drum, a hawk on its perch, Benkei with his seven weapons, Daikoku on a ladder shaving
// Fukurokuju's tall head, a spear-carrying footman, a monkey pinning a catfish with a gourd,
// a cat pouring sake for a rat, and a blind man whose dog has him by the robe. 4 by 3 panels
// of 30 by 28; the Thunder God's rope runs down into the sea, the catfish swims across two.
import { div, inell, mod, points, round, SIDES, type Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 30;
const PH = 28;
const COLS = 4;

/** A shape: its bounding box and which dots it covers. */
interface Region {
	box: [x0: number, y0: number, x1: number, y1: number];
	has(x: number, y: number): boolean;
}
type Fill = string | ((x: number, y: number) => string);

const poly = (list: string): Region => {
	const p = points(list);
	const xs = p.map((q) => q[0]);
	const ys = p.map((q) => q[1]);
	return {
		box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
		has(x, y) {
			const px = x + 0.01;
			const py = y + 0.01;
			let inside = false;
			for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
				const [xi, yi] = p[i];
				const [xj, yj] = p[j];
				if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
			}
			return inside;
		}
	};
};
const oval = (cx: number, cy: number, rx: number, ry = rx): Region => ({
	box: [Math.floor(cx - rx), Math.floor(cy - ry), Math.ceil(cx + rx), Math.ceil(cy + ry)],
	has: (x, y) => inell(x, y, cx, cy, rx, ry)
});
/** A thick stroke: every dot within `w` of the line. */
const limb = (x0: number, y0: number, x1: number, y1: number, w = 1): Region => ({
	box: [
		Math.floor(Math.min(x0, x1) - w),
		Math.floor(Math.min(y0, y1) - w),
		Math.ceil(Math.max(x0, x1) + w),
		Math.ceil(Math.max(y0, y1) + w)
	],
	has(x, y) {
		const dx = x1 - x0;
		const dy = y1 - y0;
		const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy || 1)));
		return Math.hypot(x - x0 - t * dx, y - y0 - t * dy) <= w;
	}
});
const or = (...rs: Region[]): Region => ({
	box: [
		Math.min(...rs.map((r) => r.box[0])),
		Math.min(...rs.map((r) => r.box[1])),
		Math.max(...rs.map((r) => r.box[2])),
		Math.max(...rs.map((r) => r.box[3]))
	],
	has: (x, y) => rs.some((r) => r.has(x, y))
});

// robe and ground patterns, in panel coordinates
const checks =
	(a: string, b: string, s = 2) =>
	(x: number, y: number) =>
		(div(x, s) + div(y, s)) % 2 ? a : b;
const stripes =
	(a: string, b: string, n = 3, k = 1) =>
	(x: number, y: number) =>
		mod(x + k * y, n) === 0 ? a : b;
const rows =
	(a: string, b: string, n = 2) =>
	(x: number, y: number) =>
		mod(y, n) === 0 ? a : b;
/** Little spots on a field, set in a staggered grid. */
const spots =
	(field: string, spot: string, n = 4, spot2 = spot) =>
	(x: number, y: number) =>
		mod(y, 2) === 0 && mod(x + (mod(y, 4) === 0 ? 0 : div(n, 2)), n) === 0
			? mod(y, 8) < 4
				? spot
				: spot2
			: field;
/** Scalloped waves (seigaiha): rows of arches. */
const waves = (a: string, b: string, c2: string) => (x: number, y: number) => {
	const row = div(y, 3);
	const cx = mod(x + (row % 2) * 3, 6) - 2.5;
	const cy = mod(y, 3);
	const r = Math.hypot(cx, cy + 0.5);
	return r > 2.4 ? c2 : r > 1.4 ? a : b;
};

// a few marks of writing, each three dots wide
const GLYPHS = [
	'111,010,101',
	'110,011,010',
	'010,111,010,101',
	'101,010,110',
	'111,100,011',
	'01,11,10,11',
	'100,111,001'
].map((g) => g.split(','));

// the Wisteria Maiden: a kimono (a), its red lining (r), her obi (o) and bow (g), the hem (h)
const MAIDEN = [
	'..............................',
	'........KKK...................',
	'......KKKKKKK.................',
	'..KKKKKKKKKKKKKKK.............',
	'....KKKKKKKKKKKKKK............',
	'.......KSSSSKKKK..............',
	'......KSKSSSSKKK..............',
	'......KSSSSSSKKK..............',
	'.......KSRSSSKK...............',
	'........KSSSKK................',
	'.......KrSrKKKKK..............',
	'......KaaKrKaaaaKK............',
	'.....KaaaaKaaaaaSSK...........',
	'....KaaaaaKaaaaaSSK...........',
	'...KaaaaaaKoooooooKK..........',
	'...KaaaaaaKoooooooKggK........',
	'...KaaaaaaKoooooooKgggK.......',
	'..KaaaaaaaKaaaaaaaKgggK.......',
	'..KaaaaaaaKaaaaaaaaKggK.......',
	'..KrrrrrrrKaaaaaaaaaKK........',
	'...KKKKKKKKaaaaaaaaaaK........',
	'........KaaaaaaaaaaaaK........',
	'.......KaaaaaaaaaaaaaaK.......',
	'......KaaaaaaaaaaaaaaaK.......',
	'.....KaaaaaaaaaaaaaaaaaK......',
	'...KKhhhhhhhhhhhhhhhhhhK......',
	'..KhhhhhhhhhhhhhhhhhhhhK......',
	'..KKKKKKKKKKKKKKKKKKKKKK......'
];
// Fukurokuju's tall bald head, wrinkled, with white brows, a big ear and a long white beard
const ELDER = [
	'........KKKK......',
	'.......KFFFFK.....',
	'......KFFFFFFK....',
	'......KFFFFFFK....',
	'.....KFFFFFFFFK...',
	'.....KFFNNNFFFK...',
	'.....KFFFFFFFFK...',
	'....KFFFFFFFFFFK..',
	'....KFFNNNNNFFFK..',
	'....KFFFFFFFFFFK..',
	'...KFFFFFFFFFFFFK.',
	'...KFFNNNNNNNFFFK.',
	'...KFFFFFFFFFFFFK.',
	'..KFSSSSFFFSSSSFK.',
	'.KKFFKFFFFFFKFFFK.',
	'.KFKFFFFFFFFFFFFK.',
	'.KFKFFFFNNFFFFFFK.',
	'..KKFSSSFFFFSSSFK.',
	'...KSSSSRRRRSSSSK.',
	'...KSSSSSSSSSSSSK.',
	'....KSSSSSSSSSSK..',
	'.....KSSSSSSSSK...',
	'......KSSSSSSK....',
	'.......KSSSSK.....',
	'........KSSK......',
	'.........KK.......'
];
// a crouching monkey facing right, its arms out: fur (N), face (F), belly (Y), red sash
const MONKEY = [
	'.....KKKKK........',
	'....KNNNNNK.......',
	'...KNNNNNNNK......',
	'..KFKNNKFFFFK.....',
	'..KFKNNFKFFFK.....',
	'...KNNNFFFFFFK....',
	'...KNNNKFFRRK.....',
	'....KNNNKKKK......',
	'...KNNNNNNNKKKKKK.',
	'..KNNNNNNNNNNNNNFK',
	'..KNNNNYYYYNKKKKK.',
	'.KNNNNYYYYYYNNNNFK',
	'.KNNNNYYYYYYNKKKK.',
	'.KNNNNRRRRRRNK....',
	'KNNNNNNNNNNNNK....',
	'KNNNNNNNNNNNNK....',
	'KNNKNNNNKNNNK.....',
	'.KK.KNNK.KNNK.....',
	'....KNNK.KNNK.....',
	'...KFFFK.KFFFK....'
];
// the catfish facing left: dark back (d), ochre belly (y), a small eye
const CATFISH = [
	'....................KKKK....................',
	'...........KKKKKKKKKddddKKKKKK..............',
	'.......KKKKddddddddddddddddddddKKKKK.....KKK',
	'.....KKddddddddddddddddddddddddddddddKKKKddK',
	'...KKddSKdddddddddddddddddddddddddddddddddK.',
	'..KddddddddddddddddddddddddddddddddddddddK..',
	'.KKKKKKKKdddddddddddddddddddddddddddddddddK.',
	'..KyyyyyyKKdddddddddddddddddddddddddddKKKddK',
	'...KyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyKKK..KKKK',
	'....KKKyyyyyyyyyyyyyyyyyyyyyyyKKKKK.........',
	'.......KKKKKKKKKKKKKKKKKKKKKKK..............'
];
// the rat sitting up, facing left, a red cup in its paws
const RAT = [
	'.....KK...',
	'....KFFK..',
	'..KKKFFK..',
	'.KNNNKKNK.',
	'KNKNNNNNK.',
	'KKNNNNNNK.',
	'.KKNNNNNK.',
	'..KNNNNNNK',
	'.KNFFNNNNK',
	'KRRRKNNNNK',
	'.KKKNNNNNK',
	'..KNNNNNNK',
	'..KNFFNNNK',
	'..KNFFNNNK',
	'..KNNNNNK.',
	'..KFFKFFK.',
	'...KK.KK..'
];
// the dog facing left, spotted, tail up, braced
const DOG = [
	'.KK..........',
	'KKSK.......K.',
	'KSSSK.....KSK',
	'KKSSSKKKKKKSK',
	'.KSSSSSKSSSK.',
	'..KSSSKKSKSK.',
	'..KSKSSSSSSK.',
	'..KSKKKKKSKK.',
	'..KSK...KSK..',
	'..KK....KK...'
];
// the Thunder God leaning over his cloud: red, horned, goggle-eyed, a tiger-skin loincloth (t)
const THUNDER = [
	'..............................',
	'.........Y.....Y..............',
	'........KYK...KYK.............',
	'.......KKKKKKKKKKKK...........',
	'......KKKRRRRRRRRKKK..........',
	'.....KKKRSSSRRSSSRKK..........',
	'.....KKRRSSKRRSSKRRK..........',
	'......KRRRRRRNRRRRRK..........',
	'......KRRKSKSKSKSRK...........',
	'.......KRRKKKKKKRK............',
	'.....KKKKRRRRRRRKKKK..........',
	'....KRRRRKRRRRRRKRRRK.........',
	'...KRRRRRRRRRRRRRRRRRK........',
	'...KRRKKRRRRRRRRRKRRRRK.......',
	'..KRRK.KKtttttttKKKRRRRK......',
	'..KRRK.KtttttttttK.KKRRRK.....',
	'..KRRK.KtttttttttK...KRRRK....',
	'..KRRK..KtttttttK....KRRRRK...',
	'..KKKK...KKKKKKK......KKKKK...'
];
const ANCHOR = [
	'..KKK..',
	'..K.K..',
	'..KKK..',
	'KKKNKKK',
	'...N...',
	'...N...',
	'...N...',
	'K..N..K',
	'KK.N.KK',
	'.KKNKK.',
	'..KKK..'
];
const PLUME = [
	'..K.K.K..',
	'.KKKKKKK.',
	'KKKKKKKKK',
	'.KKKKKKKK',
	'KKKKKKKK.',
	'.KKKKKKK.',
	'..KKKKK..',
	'...RRR...',
	'...RRR...',
	'....R....'
];

function draw(c: Canvas) {
	const { put, line, dots, stamp } = c;

	/** Paint a shape, then ring it in a black outline (or `edge`) on its outside. */
	const fig = (r: Region, fill: Fill, edge = 'K') => {
		const f = typeof fill === 'string' ? () => fill : fill;
		const [x0, y0, x1, y1] = r.box;
		const has = (x: number, y: number) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && r.has(x, y);
		for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (has(x, y)) put(x, y, f(x, y));
		if (!edge) return;
		for (let y = y0 - 1; y <= y1 + 1; y++) {
			for (let x = x0 - 1; x <= x1 + 1; x++) {
				if (!has(x, y) && SIDES.some(([dx, dy]) => has(x + dx, y + dy))) put(x, y, edge);
			}
		}
	};
	/** Go to panel k (reading order). */
	const panel = (k: number) => c.at((k % COLS) * PW, div(k, COLS) * PH);
	/** A column of brush writing, top at (x, y). */
	const writing = (x: number, y: number, n: number, k = 0) => {
		for (let i = 0; i < n; i++) {
			const g = GLYPHS[(k + i) % GLYPHS.length];
			stamp(g, x + (g[0].length === 2 ? 1 : 0), y, { 1: 'K' });
			y += g.length + 1;
		}
	};
	/** The painter's red seal. */
	const seal = (x: number, y: number) =>
		stamp(['RRR', 'RSR', 'RRR', 'RSR', 'RRR'], x, y, { R: 'R', S: 'S' });
	/** A stamp whose lowercase marks are filled by patterns; '.' paints nothing. */
	const art = (
		pattern: string[],
		x0: number,
		y0: number,
		fills: Record<string, Fill> = {},
		flip = false
	) =>
		pattern.forEach((line, r) => {
			const row = flip ? [...line].reverse() : [...line];
			row.forEach((ch, i) => {
				if (ch === '.') return;
				const f = fills[ch] ?? ch;
				put(x0 + i, y0 + r, typeof f === 'string' ? f : f(x0 + i, y0 + r));
			});
		});

	// ---------- the paper: buff, with ochre flecks ----------
	for (let y = 0; y < c.h; y++) {
		for (let x = 0; x < c.w; x++) {
			const h = mod(x * 7919 + y * 104729 + x * y * 31, 997);
			if (h < 22) c.g[y][x] = 'Y';
		}
	}

	// ---------- 1. the demon as a begging monk ----------
	panel(0);
	// a paper umbrella slung on his back, his subscription book hanging from its tip
	fig(poly('1,5 4,2 15,14 12,17'), stripes('N', 'Y', 3, -1));
	line(2, 4, 2, 7, 'K');
	fig(poly('0,8 4,8 4,15 0,15'), (x, y) => (y % 2 === 1 && x >= 1 && x <= 3 ? 'K' : 'S'));
	// bare red legs with clawed feet, striding right
	fig(limb(12, 19, 10, 24, 1.2), 'R');
	fig(limb(19, 19, 22, 24, 1.2), 'R');
	fig(poly('7,25 12,25 12,27 7,27'), 'R');
	fig(poly('20,25 25,25 25,27 20,27'), 'R');
	dots('S', [7, 27], [9, 27], [20, 27], [22, 27], [24, 27]);
	// a black monk's robe with blue folds, a white collar and an ochre stole
	fig(poly('10,10 21,9 25,21 19,22 15,20 8,22'), stripes('B', 'D', 4, 1));
	fig(limb(11, 11, 18, 21, 0.9), (x, y) => ((x + y) % 2 ? 'Y' : 'R'));
	line(14, 10, 19, 14, 'S');
	// the gong on a red cord, struck with a wooden hammer
	line(15, 10, 21, 13, 'R');
	fig(oval(22, 16, 3, 3), (x, y) => (Math.hypot(x - 22, y - 16) < 1.3 ? 'N' : 'Y'));
	fig(limb(20, 11, 25, 7, 1.1), 'D');
	fig(oval(25.5, 6, 1.4), 'R');
	fig(limb(25, 6, 28, 1, 0.5), 'N');
	fig(poly('26,0 29,1 29,3 27,2'), 'N');
	// horns, wild black hair, a red face with goggling eyes and fangs
	fig(poly('12,4 11,0 14,2'), 'Y');
	fig(poly('19,2 22,0 21,4'), 'Y');
	fig(oval(12, 6, 2.5, 3.4), 'K');
	fig(oval(16.5, 6, 4.4, 4.2), 'R');
	stamp(['.KK..KK.', 'SSS.SSS.', 'SSK.SSK.', '....RR..', 'KSKKKSK.', '.KKKKK..'], 13, 3, {
		K: 'K',
		S: 'S',
		R: 'R'
	});
	writing(1, 17, 3, 0);

	// ---------- 2. the Wisteria Maiden ----------
	panel(1);
	// a wisteria branch over her shoulder, purple drops hanging behind her
	line(17, 12, 22, 4, 'N');
	line(22, 4, 29, 1, 'N');
	line(20, 7, 14, 1, 'N');
	for (const [x, y, n] of points<[number, number, number]>(
		'15,3,6 19,8,9 22,5,12 26,3,10 29,2,8'
	)) {
		for (let k = 0; k < n; k++) {
			if (k % 2 === 0 && k < n - 3) dots(k % 4 === 0 ? 'P' : 'S', [x - 1, y + k], [x + 1, y + k]);
			else put(x, y + k, 'P');
		}
	}
	for (const [x, y, a] of points<[number, number, number]>(
		'21,6,-0.6 25,3,-1.3 17,4,-2.2 28,2,-1.9'
	)) {
		c.leaf(x, y, a, 3.4, 'G');
	}
	art(MAIDEN, 0, 0, {
		a: spots('D', 'S', 3, 'P'),
		r: 'R',
		o: rows('Y', 'R'),
		g: checks('G', 'Y', 1),
		h: checks('R', 'S', 1)
	});
	// the red cord of her hat
	line(13, 5, 13, 9, 'R');
	writing(25, 17, 2, 3);
	seal(1, 6);

	// ---------- 3. the Thunder God fishing for his drum ----------
	panel(2);
	// his ring of drums
	for (const [x, y] of points('3,8 6,3 11,1 17,1 22,3 25,8')) {
		fig(oval(x, y, 1.6), (u, v) => (u === x && v === y ? 'R' : 'Y'));
	}
	// red, horned and wild-haired, in a tiger-skin loincloth, leaning over his cloud
	art(THUNDER, 0, 0, { t: stripes('K', 'Y', 3, 0) });
	// the cloud: white puffs curling in blue
	const puffs = points<[number, number, number]>('3,20,3 8,19,3.6 14,21,3.4 20,20,3.4 25,21,3');
	fig(or(...puffs.map(([x, y, r]) => oval(x, y, r + 0.6, r * 0.75))), 'S');
	for (const [x, y, r] of puffs) c.ring(x, y, r * 0.5, 'B', 0.7);
	// the rope, held in his fist, falling into the sea below
	for (let y = 19; y < PH; y++) put(22, y, y % 2 ? 'N' : 'Y');
	// rain and a lightning bolt
	for (const [x, y] of points('2,25 6,26 10,25 14,26 17,25 19,26 4,24 12,24'))
		dots('B', [x, y], [x, y + 1]);
	fig(or(limb(27, 23, 25, 25, 0.6), limb(25, 25, 28, 25, 0.6), limb(28, 25, 25, 28, 0.6)), 'Y');

	// ---------- 4. the hawk on its perch ----------
	panel(3);
	// a pine bough
	line(0, 4, 7, 7, 'N');
	line(3, 5, 5, 1, 'N');
	for (const [x, y] of points('6,6 4,0 1,3 8,9')) {
		stamp(['G.G.G', '.GGG.', '..N..'], x - 2, y - 2, { G: 'G', N: 'N' });
	}
	// the perch: a pole on two posts, a checked cloth hung over it, red tassels
	fig(poly('1,19 28,19 28,20 1,20'), 'N');
	fig(poly('3,21 4,21 4,27 3,27'), 'N');
	fig(poly('25,21 26,21 26,27 25,27'), 'N');
	fig(poly('7,21 22,21 22,25 7,25'), checks('P', 'S', 2));
	for (let x = 7; x <= 22; x += 2) put(x, 26, 'Y');
	for (const x of [6, 23]) {
		line(x, 21, x, 25, 'R');
		dots('Y', [x, 26], [x, 27]);
	}
	// the hawk, facing left: barred tail, chevroned breast, dark folded wing, hooked beak
	fig(poly('14,15 19,15 22,26 17,26'), rows('K', 'B', 2));
	fig(oval(14, 11, 5, 7.5), (x, y) =>
		y > 5 && mod(y - Math.abs(x - 13), 3) === 0 ? 'K' : mod(x + y, 5) === 0 ? 'B' : 'S'
	);
	fig(poly('16,5 22,8 22,18 17,19'), (x, y) => (mod(y + div(x, 2), 3) === 0 ? 'B' : 'D'));
	fig(oval(12, 4.5, 3, 2.6), (x, y) => (y < 3 ? 'K' : 'S'));
	fig(poly('7,4 9,3 9,6 8,7'), 'Y');
	dots('Y', [11, 4]);
	dots('K', [10, 4], [12, 4]);
	for (const x of [12, 16]) dots('Y', [x, 18], [x - 1, 18], [x + 1, 18]);
	// its red tether
	line(12, 19, 10, 23, 'R');
	writing(26, 2, 3, 5);

	// ---------- 5. Benkei with his seven weapons ----------
	panel(4);
	// the weapons fanned on his back
	for (const [x, y] of points('3,12 4,5 9,3 15,2 21,3 25,5 27,11')) line(15, 16, x, y, 'N');
	// an axe, a spear, a rake, a mallet, a halberd, a saw and a hook
	stamp(['.KKK.', 'KSSSK', 'KSSSSK', 'KSSSK.', '.KKK..'], 1, 1, { K: 'K', S: 'S' });
	stamp(['.K.', 'KSK', 'KSK', '.K.'], 8, 0, { K: 'K', S: 'S' });
	stamp(['K.K.K.K', 'KKKKKKK'], 12, 0, { K: 'K' });
	stamp(['.KKKKK.', 'KNYNYNK', 'KNYNYNK', '.KKKKK.'], 18, 0, { K: 'K', N: 'N', Y: 'Y' });
	stamp(['..KK', '.KSK', 'KSSK', 'KSK.', 'KK..'], 25, 1, { K: 'K', S: 'S' });
	stamp(['KKK', 'KSK', 'SSK', 'KSK', 'SSK', 'KSK', 'KKK'], 27, 8, { K: 'K', S: 'S' });
	stamp(['.KK', 'KYK', 'KY.', 'KYK', '.KK'], 1, 10, { K: 'K', Y: 'Y' });
	// his body: an ochre armour laced in red over a checked robe, prayer beads
	fig(poly('7,20 23,20 26,25 4,25'), checks('B', 'S', 2));
	fig(poly('8,14 22,14 22,20 8,20'), rows('Y', 'R'));
	fig(oval(6, 16, 2.8, 2.4), rows('Y', 'R'));
	fig(oval(24, 16, 2.8, 2.4), rows('Y', 'R'));
	for (const [x, y] of points('10,14 11,15 12,16 13,17 15,17 17,17 18,16 19,15 20,14'))
		put(x, y, x % 2 ? 'K' : 'N');
	// legs set wide in straw sandals
	fig(limb(10, 25, 8, 26, 1.2), 'F');
	fig(limb(20, 25, 22, 26, 1.2), 'F');
	dots('Y', [5, 27], [7, 27], [9, 27], [21, 27], [23, 27], [25, 27]);
	// his fierce face in a white monk's cowl
	fig(oval(15, 9, 5, 4.8), 'S');
	fig(oval(15, 10, 3.4, 3.2), 'F');
	stamp(['KKK.KKK', 'KS...SK', '...N...', '.KRRRK.', '.KSSSK.', '.NKKKN.'], 12, 7, {
		K: 'K',
		S: 'S',
		R: 'R',
		N: 'N'
	});

	// ---------- 6. Daikoku on a ladder shaving Fukurokuju ----------
	panel(5);
	// the ladder leaning on the tall head
	line(17, 3, 24, 27, 'N');
	line(22, 2, 29, 26, 'N');
	for (let y = 6; y < 27; y += 3) line(18 + (y - 3) * 0.29, y, 23 + (y - 3) * 0.29, y, 'K');
	// Fukurokuju: a robe of waves, a towering head, white brows, a long white beard
	fig(poly('0,27 3,19 18,19 22,27'), waves('G', 'S', 'Y'));
	art(ELDER, 2, 0);
	// stubble on the crown where the razor hasn't been yet
	dots('N', [10, 1], [12, 2], [9, 3], [11, 3], [13, 4]);
	// his hands folded on his knees
	fig(oval(5, 22, 1.6, 1.2), 'F');
	fig(oval(18, 22, 1.6, 1.2), 'F');
	// Daikoku on a rung: a black cap, a round smiling face, a gold robe with red dots
	fig(limb(19, 17, 20, 21, 1), 'Y');
	fig(limb(24, 17, 26, 20, 1), 'Y');
	fig(poly('18,10 25,10 26,17 17,17'), spots('Y', 'R', 3));
	fig(oval(26, 16, 1.5, 1.3), 'N');
	fig(limb(19, 11, 16, 5, 1), 'Y');
	fig(oval(22, 6.5, 2.7, 2.7), 'F');
	fig(oval(22, 3.4, 3.4, 1.5), 'D');
	dots('K', [21, 6], [23, 6]);
	dots('R', [21, 8], [22, 8], [23, 8]);
	// the razor at the crown
	fig(poly('14,1 16,2 15,4 13,3'), 'S');

	// ---------- 7. the lost drum in the sea ----------
	panel(6);
	// his dropped drumsticks tumbling down
	fig(limb(4, 3, 8, 6, 0.6), 'N');
	fig(limb(11, 8, 13, 4, 0.6), 'N');
	dots('B', [3, 7], [6, 9], [14, 9], [9, 2], [2, 1], [16, 3]);
	// plovers over the water
	for (const [x, y] of points('2,12 26,4 27,9 6,15')) stamp(['K.K', '.K.'], x, y, { K: 'K' });
	// the rope comes down from the cloud to an anchor
	for (let y = 0; y < 13; y++) put(22, y, y % 2 ? 'N' : 'Y');
	// the sea: scalloped waves under curling white crests
	const sea = (x: number) =>
		17 + round(1.5 * Math.sin(x / 2.2) + Math.max(0, 4 - x) * 1.3 + Math.max(0, x - 25) * 1.3);
	fig({ box: [0, 14, PW - 1, PH - 1], has: (x, y) => y >= sea(x) }, waves('B', 'S', 'D'));
	for (const x of [4, 10, 17, 24])
		dots('S', [x, sea(x) - 2], [x + 1, sea(x) - 2], [x + 2, sea(x) - 3]);
	// the drum, bobbing: a red barrel with ochre studs, a white head with a red whirl
	fig(poly('11,13 18,13 18,24 11,24'), (x, y) => ((x === 13 || x === 17) && y % 2 ? 'Y' : 'R'));
	fig(oval(10, 18.5, 4, 5), (x, y) => (Math.hypot(x - 10, y - 18.5) < 1.6 ? 'R' : 'S'));
	dots('R', [9, 15], [12, 18], [8, 21]);
	// the iron grapnel on the rope, hooked in the drum's cord
	stamp(ANCHOR, 19, 12, { K: 'K', N: 'N' });
	line(18, 15, 20, 20, 'Y');

	// ---------- 8. the footman with the plumed spear ----------
	panel(7);
	// the spear: a long shaft, a shaggy black sheath, a red tassel
	line(26, 27, 5, 9, 'N');
	stamp(PLUME, 1, 0, { K: 'K', R: 'R' });
	// legs in a wide stride, straw sandals
	fig(limb(13, 20, 7, 25, 1.4), 'F');
	fig(limb(19, 20, 25, 24, 1.4), 'F');
	fig(poly('12,19 20,19 18,22 14,22'), 'S');
	dots('Y', [4, 26], [5, 26], [6, 26], [25, 26], [26, 26], [27, 26]);
	// a short kimono of big white crests, a red sash and a sword
	fig(poly('10,11 22,11 23,20 9,20'), (x, y) => {
		const d = Math.hypot(mod(x + div(y + 2, 5) * 3, 6) - 2.5, mod(y + 2, 5) - 2);
		return d < 0.8 ? 'R' : d < 1.9 ? 'S' : 'D';
	});
	fig(poly('9,16 23,16 23,17 9,17'), 'R');
	line(22, 16, 28, 13, 'K');
	// one arm up on the shaft, one fist on his hip
	fig(limb(12, 12, 9, 12, 1.1), 'F');
	fig(limb(21, 12, 24, 15, 1.1), 'F');
	// a scowling face, a painted moustache, a stiff topknot
	fig(oval(16.5, 7, 3.2, 3.4), 'F');
	fig(poly('15,1 19,1 18,4 15,4'), 'K');
	stamp(['KK.KK', 'SK.SK', '..F..', 'KKKKK', '.RRR.'], 14, 5, { K: 'K', S: 'S', R: 'R', F: 'F' });
	writing(26, 1, 2, 2);
	seal(1, 19);

	// ---------- 9. the monkey with the gourd ----------
	panel(8);
	// bamboo on the bank
	for (const x of [2, 5]) {
		for (let y = 0; y < 22; y++) put(x, y, y % 5 === 0 ? 'K' : 'G');
	}
	for (const [x, y, a] of points<[number, number, number]>(
		'3,4,-0.4 6,9,-0.8 1,12,3.4 6,15,-0.3'
	)) {
		c.leaf(x, y, a, 4, 'G');
	}
	// the stream
	const stream = (x: number, y: number) =>
		mod(y + round(1.3 * Math.sin(x / 2)), 3) ? (mod(x + y * 5, 13) === 0 ? 'S' : 'W') : 'B';
	const shore = (x: number) =>
		18 + Math.max(0, 11 - x) * 0.7 - Math.min(2, Math.max(0, (x - 27) / 3));
	fig({ box: [0, 16, 2 * PW - 1, PH - 1], has: (x, y) => y >= shore(x) }, stream, '');
	fig({ box: [0, 18, 11, PH - 1], has: (x, y) => y < shore(x) }, checks('G', 'Y', 1), '');
	// the monkey, crouched on the bank, both hands on the gourd, its tail curled
	line(4, 22, 1, 20, 'N');
	line(1, 20, 2, 17, 'N');
	art(MONKEY, 4, 4);

	// ---------- 10. the catfish ----------
	panel(9);
	// a poem written above the stream, a willow trailing its fronds
	writing(2, 1, 4, 4);
	writing(6, 2, 3, 1);
	writing(10, 1, 4, 6);
	writing(14, 3, 2, 2);
	seal(14, 12);
	for (const x0 of [20, 24, 28]) {
		for (let y = 0; y < 13 + (x0 % 3); y++) {
			const x = x0 + round(1.2 * Math.sin(y / 3));
			put(x, y, 'N');
			if (y % 2) put(x + (y % 4 === 1 ? 1 : -1), y, 'G');
		}
	}

	// the catfish swims from under the gourd into the next panel
	c.at(0, 2 * PH);
	art(CATFISH, 14, 17, { d: (x, y) => (mod(x * 2 + y * 3, 7) === 0 ? 'B' : 'D'), y: 'Y' });
	// long curling whiskers
	line(15, 23, 11, 20, 'K');
	line(11, 20, 11, 17, 'K');
	line(16, 24, 12, 27, 'K');
	// the gourd, pressing down on its head
	fig(oval(23, 11.5, 2.2, 2.2), 'Y');
	fig(oval(23.5, 16, 3, 2.8), 'Y');
	fig(poly('22,8 24,8 24,9 22,9'), 'R');
	dots('R', [21, 14], [25, 14]);

	// ---------- 11. the cat pouring sake for the rat ----------
	panel(10);
	// tatami at their feet
	fig(
		poly('0,23 29,23 29,27 0,27'),
		(x, y) => (y === 23 ? 'K' : mod(x, 7) === 0 ? 'K' : y % 2 ? 'Y' : 'G'),
		''
	);
	// the cat, sitting up in a striped kimono, holding out a sake flask
	fig(poly('3,22 6,10 14,10 16,22'), stripes('B', 'S', 2, 0));
	fig(oval(10, 7, 4, 3.4), (x, y) => (x < 9 && y < 7 ? 'K' : x > 11 && y < 6 ? 'Y' : 'S'));
	fig(poly('6,5 7,1 9,4'), 'S');
	fig(poly('11,4 13,1 14,5'), 'S');
	stamp(['Y.Y.', 'K.K.', '.R..'], 9, 6, { Y: 'Y', K: 'K', R: 'R' });
	dots('K', [5, 8], [15, 8]);
	fig(limb(12, 13, 15, 14, 1), 'S');
	fig(or(oval(17, 14.5, 2, 2.3), poly('16,10 18,10 18,12 16,12')), 'Y');
	put(17, 9, 'R');
	// a low tray with two red cups
	fig(poly('14,20 21,20 21,21 14,21'), 'N');
	dots('R', [15, 19], [16, 19], [19, 19], [20, 19]);
	// the rat on its haunches, a red cup held up, its tail curled behind
	art(RAT, 19, 9);
	line(28, 24, 29, 21, 'F');
	line(29, 21, 28, 17, 'F');

	// ---------- 12. the blind man and the dog ----------
	panel(11);
	// grass tufts, and his straw hat flying off
	for (const x of [0, 9, 26]) dots('G', [x, 27], [x + 1, 26], [x + 2, 27]);
	stamp(['...KK...', '..KYYK..', '.KYKYYK.', 'KYYKYYYK', 'KKKKKKKK'], 1, 1, { K: 'K', Y: 'Y' });
	dots('N', [10, 1], [11, 2], [9, 3]);
	// the blind man, shaven, eyes shut, mouth wide, leaning away on his staff
	line(3, 27, 6, 7, 'N');
	fig(limb(9, 24, 7, 26, 1.1), 'F');
	fig(limb(15, 24, 17, 26, 1.1), 'F');
	fig(poly('7,10 15,10 19,24 5,24'), stripes('G', 'Y', 3, -1));
	fig(poly('16,21 19,21 21,24 18,24'), stripes('G', 'Y', 3, -1));
	fig(limb(9, 12, 6, 10, 1), 'F');
	fig(limb(14, 12, 16, 9, 1), 'F');
	fig(oval(11, 6, 3, 3.2), 'F');
	line(9, 6, 10, 6, 'K');
	line(12, 6, 13, 6, 'K');
	dots('R', [11, 8], [11, 9]);
	dots('K', [16, 7], [17, 6]);
	// the dog, spotted, tail up, braced, with his hem in its teeth
	art(DOG, 17, 18);
	put(17, 22, 'R');
	seal(25, 2);
	writing(26, 8, 2, 6);
	c.at();
}

export const otsu: Mural = {
	file: '04-otsu-e',
	name: 'Ōtsu-e',
	prefix: 'otsu-e',
	notes: 'E',
	cols: COLS,
	panel: [PW, PH],
	// W buff paper, K ink, R vermilion, Y ochre, G dull green, B gray-blue, D indigo,
	// S white, F flesh, N brown, P wisteria
	palette: {
		W: '#e4cb94',
		K: '#1d1a17',
		R: '#cf3d24',
		Y: '#d99a1e',
		G: '#5e7c45',
		B: '#6b8cab',
		D: '#2a3f6e',
		S: '#fdfbf4',
		F: '#f2998a',
		N: '#7b4526',
		P: '#9670b8'
	},
	ground: 'W',
	panels: [
		['demon-monk', 'Demon Monk', { mode: 'phrygian', spice: 'lively', lead: 'mallet' }],
		['wisteria-maiden', 'Wisteria Maiden', { mode: 'lydian', spice: 'gentle', lead: 'harp' }],
		['thunder-god', 'Thunder God', { mode: 'harmonic', spice: 'adventurous', lead: 'brass' }],
		['hawk', 'The Hawk', { mode: 'dorian', spice: 'gentle', lead: 'flute' }],
		['benkei', 'Benkei', { mode: 'minor', spice: 'lively', lead: 'brass' }],
		['the-ladder', 'The Ladder', { mode: 'mixolydian', spice: 'lively', lead: 'pizz' }],
		['lost-drum', 'The Lost Drum', { mode: 'dorian', spice: 'adventurous', lead: 'kalimba' }],
		['spear-man', 'Spear Man', { mode: 'major', spice: 'lively', lead: 'keys' }],
		['monkey', 'The Monkey', { mode: 'mixolydian', spice: 'gentle', lead: 'kalimba' }],
		['catfish', 'The Catfish', { mode: 'minor', spice: 'gentle', lead: 'vibes' }],
		['cat-and-rat', 'Cat and Rat', { mode: 'major', spice: 'gentle', lead: 'string' }],
		['blind-man', 'Blind Man', { mode: 'phrygian', spice: 'lively', lead: 'vibes' }]
	],
	draw
};
