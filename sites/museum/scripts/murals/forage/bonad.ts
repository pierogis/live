// A Dalarna bonad (Sweden, late 1700s): a wall hanging painted on paper for Christmas and
// weddings. Bible stories are told with people in the painter's own country clothes: men in
// long coats, knee breeches and tricorn hats, women in caps and striped aprons. "Kurbits"
// flower trees, onion buds cupped in curling scrolls and edged with white dashes, grow from
// pots between them, and lines of script float under the borders. The upper strip, under a
// zigzag, shows the Three Wise Men: King Herod on his throne, the three kings riding with
// gold, incense and myrrh, a shepherd under the star, the stable at Bethlehem. The lower
// strip shows the Wise and Foolish Virgins: the oil seller, the watchman's midnight cry, the
// shut door, the wise girls with their lamps alight, the fiddler, the bride and groom.
// 6 x 2 panels of 30 by 30, one strip to a row.
import { type Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 30;
const PH = 30;
const W = PW * 6;

type Key = Record<string, string | ((i: number, r: number) => string)>;
type Test = (x: number, y: number) => boolean;

// ---------- people and beasts, as dot patterns ----------
// t hat, h hair, f face, e eye, p cheek, c coat, u cuff, w linen, v waistcoat, y buttons,
// b breeches, s stockings, k shoes
const MAN = [
	't..ttt..t',
	'ttttttttt',
	'.ttttttt.',
	'..hfffh..',
	'..hefeh..',
	'..hpfph..',
	'...fff...',
	'..cwwwc..',
	'.ccwwwcc.',
	'cccvyvccc',
	'cc.vvv.cc',
	'cc.vyv.cc',
	'uu.vvv.uu',
	'ff.vyv.ff',
	'.cccvccc.',
	'.ccc.ccc.',
	'cccb.bccc',
	'...s.s...',
	'...s.s...',
	'...s.s...',
	'..kk.kk..'
];
// q cap, f face, e eye, p cheek, n kerchief, w sleeves, d bodice, k skirt, a apron, t stockings
const WOMAN = [
	'...qqq...',
	'..qqqqq..',
	'..qfffq..',
	'..qefeq..',
	'..qpfpq..',
	'...fff...',
	'.wwnnnww.',
	'wwwnnnwww',
	'ww.ddd.ww',
	'ww.ddd.ww',
	'ff.ddd.ff',
	'..kkkkk..',
	'..kaaak..',
	'.kkaaakk.',
	'.kkaaakk.',
	'kkkaaakkk',
	'kkkaaakkk',
	'kkkaaakkk',
	'kkkkkkkkk',
	'...t.t...',
	'..xx.xx..'
];
// a woman sitting, her hands in her lap, as WOMAN
const SITTER = [
	'...qqq...',
	'..qqqqq..',
	'..qfffq..',
	'..qefeq..',
	'..qpfpq..',
	'...fff...',
	'.wwnnnww.',
	'wwwnnnwww',
	'ww.ddd.ww',
	'wwfdddfww',
	'kkkaaakkk',
	'kkkaaakkk',
	'kkkaaakkk',
	'.kkkkkkk.',
	'..x...x..'
];
// a horse facing right, one foreleg raised: h body, m mane and tail, e eye, k hooves
const HORSE = [
	'.............hh.h...',
	'............hhhhh...',
	'...........mhhhhhh..',
	'..........mmhhhehhh.',
	'.........mmhhhhhhhhh',
	'........mmhhhhh..hhh',
	'.......mmhhhhh......',
	'..hhhhmmhhhhh.......',
	'.hhhhhhhhhhhh.......',
	'mhhhhhhhhhhhh.......',
	'mhhhhhhhhhhhh.......',
	'mmhhhhhhhhhhh.......',
	'm.hh...hh.hh.hhh....',
	'm.hh...hh.hh...hh...',
	'..hh...hh.hh..hh....',
	'..kk...kk.kk..kk....'
];
// a king riding, facing right: y crown, h hair, f face, e eye, p cheek, c coat,
// v waistcoat, u cuff, b breeches, s stocking, k boot. Rows from 9 down hang over the horse.
const KING = [
	'y.y.y.',
	'yyyyy.',
	'hfffh.',
	'hefeh.',
	'.pfp..',
	'cvyvc.',
	'cvvvcf',
	'cvyvcu',
	'ccccc.',
	'cbbbb.',
	'...s..',
	'...k..'
];

// the script: marks two dots tall that spell nothing
const GLY = '10,01 01,10 11,10 1,1 010,101 101,010 11,01 110,011 01,11 1,0'
	.split(' ')
	.map((g) => g.split(','));

function draw(c: Canvas) {
	const { put, get, rect, line, dots, disk } = c;
	const box =
		(x0: number, y0: number, x1: number, y1: number): Test =>
		(x, y) =>
			x >= x0 && x <= x1 && y >= y0 && y <= y1;

	/** Paint every dot `test` holds near the box, ringed by `ol` where it meets anything else. */
	const fill = (
		x0: number,
		y0: number,
		x1: number,
		y1: number,
		test: Test,
		col: string,
		ol = 'K'
	) => {
		x0 = Math.floor(x0) - 1;
		y0 = Math.floor(y0) - 1;
		x1 = Math.ceil(x1) + 1;
		y1 = Math.ceil(y1) + 1;
		if (ol) {
			for (let y = y0; y <= y1; y++) {
				for (let x = x0; x <= x1; x++) {
					if (test(x, y)) continue;
					if (test(x + 1, y) || test(x - 1, y) || test(x, y + 1) || test(x, y - 1)) put(x, y, ol);
				}
			}
		}
		for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (test(x, y)) put(x, y, col);
	};
	const block = (x0: number, y0: number, x1: number, y1: number, col: string, ol = 'K') =>
		fill(x0, y0, x1, y1, box(x0, y0, x1, y1), col, ol);

	/** A pattern of marks, ringed in black where it meets anything else. */
	const figure = (pat: string[], x: number, y: number, key: Key, flip = false, ol = 'K') => {
		const w = Math.max(...pat.map((r) => r.length));
		const ch = (i: number, r: number) => {
			const row = (pat[r] ?? '').padEnd(w, '.');
			return i < 0 || i >= w ? '.' : flip ? row[w - 1 - i] : row[i];
		};
		const mark = (i: number, r: number) => Object.hasOwn(key, ch(i, r));
		if (ol) {
			for (let r = -1; r <= pat.length; r++) {
				for (let i = -1; i <= w; i++) {
					if (mark(i, r)) continue;
					if (mark(i + 1, r) || mark(i - 1, r) || mark(i, r + 1) || mark(i, r - 1))
						put(x + i, y + r, ol);
				}
			}
		}
		for (let r = 0; r < pat.length; r++) {
			for (let i = 0; i < w; i++) {
				const k = key[ch(i, r)];
				if (k !== undefined) put(x + i, y + r, typeof k === 'string' ? k : k(i, r));
			}
		}
	};

	// a man standing, feet on row y, middle at x
	const man = (
		x: number,
		y: number,
		coat: string,
		vest: string,
		breeches: string,
		{ flip = false, hat = 'K', hair = 'D', cuff = 'R' } = {}
	) =>
		figure(
			MAN,
			x - 4,
			y - 20,
			{
				t: hat,
				h: hair,
				f: 'W',
				e: 'K',
				p: 'P',
				c: coat,
				u: cuff,
				w: 'W',
				v: vest,
				y: 'Y',
				b: breeches,
				s: 'W',
				k: 'K'
			},
			flip
		);
	// a woman standing (or sitting), feet on row y, middle at x; her apron striped across
	const woman = (
		x: number,
		y: number,
		cap: string,
		bodice: string,
		skirt: string,
		apron: string[],
		{ flip = false, kerchief = 'Y', sit = false } = {}
	) => {
		const pat = sit ? SITTER : WOMAN;
		figure(
			pat,
			x - 4,
			y - pat.length + 1,
			{
				q: cap,
				f: 'W',
				e: 'K',
				p: 'P',
				n: kerchief,
				w: 'W',
				d: bodice,
				k: skirt,
				a: (_, r) => apron[r % apron.length],
				t: 'R',
				x: 'K'
			},
			flip
		);
	};
	/** A crowned king on a dappled horse; x is the tail, y the row the hooves stand on. */
	const rider = (
		x: number,
		y: number,
		body: string,
		mane: string,
		spot: string,
		cloth: string,
		coat: string,
		breeches: string
	) => {
		const top = y - 15;
		figure(HORSE, x, top, { h: body, m: mane, e: 'K', k: 'K' });
		for (let r = 8; r <= 11; r++) {
			for (let i = 1; i <= 12; i++) {
				if ((i * 2 + r * 3) % 6 === 0 && get(x + i, top + r) === body) put(x + i, top + r, spot);
			}
		}
		// the saddle cloth, fringed
		rect(x + 3, top + 8, x + 8, top + 10, cloth);
		for (let i = 3; i <= 8; i++) put(x + i, top + 11, i % 2 ? 'K' : cloth);
		figure(KING, x + 3, top - 2, {
			y: 'Y',
			h: 'D',
			f: 'W',
			e: 'K',
			p: 'P',
			c: coat,
			v: 'R',
			u: 'Y',
			b: breeches,
			s: 'W',
			k: 'K'
		});
	};

	// ---------- kurbits ----------
	/** Inside a gourd: round below, drawn up to a point; its edge scalloped. */
	const gourd =
		(cx: number, cy: number, r: number): Test =>
		(x, y) => {
			const dy = y - cy;
			const dx = x - cx;
			const th = Math.atan2(dy, dx);
			const rr = r * (1 + 0.1 * Math.cos(th * 10));
			if (dy >= 0) return dx * dx + dy * dy <= rr * rr;
			const t = -dy / (1.9 * r);
			if (t > 1) return false;
			return Math.abs(dx) <= rr * Math.sqrt(1 - t);
		};
	/** An onion bud: layers of scalloped leaves, each edged in white dashes. */
	const onion = (cx: number, cy: number, r: number, cols: string[]) => {
		let rr = r;
		const step = (r - 0.8) / cols.length;
		cols.forEach((col, i) => {
			const g = gourd(cx, cy, rr);
			fill(cx - rr - 4, cy - rr * 2 - 2, cx + rr + 4, cy + rr + 2, g, col, i === 0 ? 'K' : '');
			if (i < cols.length - 1) {
				const inner = gourd(cx, cy, rr - 1);
				let n = 0;
				for (let y = Math.floor(cy - rr * 2) - 1; y <= cy + rr + 1; y++) {
					for (let x = Math.floor(cx - rr) - 4; x <= cx + rr + 4; x++) {
						if (g(x, y) && !inner(x, y) && y > cy - rr * 1.2 && n++ % 2 === 1) put(x, y, 'W');
					}
				}
			}
			rr -= step;
		});
	};
	/**
	 * A curling scroll leaf from (x, y), first heading at angle a, `len` long, turning `bend`
	 * radians (faster toward its tip), `w` thick at its root and thinning; outlined, white
	 * dashes along its spine.
	 */
	const curl = (
		x: number,
		y: number,
		a: number,
		len: number,
		bend: number,
		w: number,
		col: string
	) => {
		const pts: [number, number, number][] = [];
		const n = Math.max(4, Math.round(len * 3));
		let px = x;
		let py = y;
		let ang = a;
		for (let i = 0; i <= n; i++) {
			const t = i / n;
			pts.push([px, py, Math.max(0.55, w * (1 - 0.6 * t))]);
			ang += (bend * 2 * t) / n;
			px += (Math.cos(ang) * len) / n;
			py += (Math.sin(ang) * len) / n;
		}
		const xs = pts.map((p) => p[0]);
		const ys = pts.map((p) => p[1]);
		const test: Test = (X, Y) =>
			pts.some(([qx, qy, qw]) => (X - qx) ** 2 + (Y - qy) ** 2 <= qw * qw);
		fill(
			Math.min(...xs) - w,
			Math.min(...ys) - w,
			Math.max(...xs) + w,
			Math.max(...ys) + w,
			test,
			col
		);
		for (let i = Math.round(n * 0.2); i < n * 0.75; i += 6)
			put(Math.round(pts[i][0]), Math.round(pts[i][1]), 'W');
	};
	/** Inside a thick line from (x0, y0) to (x1, y1). */
	const thick =
		(x0: number, y0: number, x1: number, y1: number, w: number): Test =>
		(x, y) => {
			const dx = x1 - x0;
			const dy = y1 - y0;
			const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)));
			return Math.hypot(x - x0 - t * dx, y - y0 - t * dy) <= w;
		};
	/** A stem through the given points, ringed in black. */
	const stem = (pts: [number, number][], col = 'G', w = 0.6) => {
		const xs = pts.map((p) => p[0]);
		const ys = pts.map((p) => p[1]);
		const segs = pts.slice(1).map((p, i) => thick(pts[i][0], pts[i][1], p[0], p[1], w));
		fill(
			Math.min(...xs) - 2,
			Math.min(...ys) - 2,
			Math.max(...xs) + 2,
			Math.max(...ys) + 2,
			(x, y) => segs.some((s) => s(x, y)),
			col
		);
	};
	/** A round pot the kurbits grows from, with a band of dots. */
	const pot = (x: number, y: number, col: string, band = 'Y') => {
		fill(
			x - 3,
			y - 4,
			x + 3,
			y,
			(px, py) => py <= y && py >= y - 2 && Math.abs(px - x) <= (py === y - 1 ? 2 : 1),
			col
		);
		dots(band, [x - 1, y - 1], [x + 1, y - 1]);
	};
	/** A small flower: a yellow eye in four petals. */
	const flower = (x: number, y: number, col: string) => {
		dots(col, [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
		put(x, y, 'Y');
	};
	/** Inside an oval turned `a`. */
	const ovalT =
		(cx: number, cy: number, rx: number, ry: number, a: number): Test =>
		(x, y) => {
			const u = (x - cx) * Math.cos(a) + (y - cy) * Math.sin(a);
			const v = -(x - cx) * Math.sin(a) + (y - cy) * Math.cos(a);
			return (u / rx) ** 2 + (v / ry) ** 2 <= 1;
		};
	/** A fat kurbits leaf from (x, y) toward angle a, outlined, white dashes down its middle. */
	const leaf = (x: number, y: number, a: number, len: number, col: string, wide = 2) => {
		const cx = x + (Math.cos(a) * len) / 2;
		const cy = y + (Math.sin(a) * len) / 2;
		fill(cx - len, cy - len, cx + len, cy + len, ovalT(cx, cy, len / 2 + 0.4, wide, a), col);
		for (let k = 2; k < len - 1; k += 2) put(x + Math.cos(a) * k, y + Math.sin(a) * k, 'W');
	};
	interface Kurbits {
		/** the onion's layers, outside in */
		bud: string[];
		/** the two big scrolls cupping it, left and right */
		big: [string, string];
		/** lower scrolls on the stem, left and right; a slim tree has small leaves instead */
		low?: [string, string];
		/** the small leaves up a slim tree's stem */
		twigs?: string;
		pot?: string;
		/** how big */
		s?: number;
	}
	/** A kurbits tree from a pot on row `base`, its bud's tip at row `top`: scrolls cup the bud. */
	const kurbits = (x: number, base: number, top: number, k: Kurbits) => {
		const s = k.s ?? 1;
		const r = 3.2 * s;
		const cy = top + 1.9 * r + 0.5;
		const by = cy + r - 1;
		stem([
			[x, base - 2],
			[x, by]
		]);
		// lower scrolls reach out sideways from the stem and roll down
		const ly = Math.round((base + by) / 2) + 1;
		if (k.low) {
			curl(x - 1, ly, Math.PI + 0.6, 9 * s, -3, 1.8 * s, k.low[0]);
			curl(x + 1, ly - 1, -0.6, 9 * s, 3, 1.8 * s, k.low[1]);
		} else {
			for (let y = base - 5, i = 0; y > by + 2; y -= 3, i++) {
				const side = i % 2 ? 1 : -1;
				leaf(x + side, y, side > 0 ? -0.6 : Math.PI + 0.6, 4, k.twigs ?? 'G', 1.1);
			}
		}
		// the big scrolls rise round the bud and roll outward
		curl(x - 1, by, -Math.PI / 2 - 0.4, 12 * s, -3.5, 2.2 * s, k.big[0]);
		curl(x + 1, by, -Math.PI / 2 + 0.4, 12 * s, 3.5, 2.2 * s, k.big[1]);
		onion(x, cy, r, k.bud);
		pot(x, base, k.pot ?? 'B');
	};

	// ---------- borders and script ----------
	/** A band of triangles `rows` dots tall, between an outer and an inner rule. */
	const zigzag = (y: number, a: string, b: string, rows = 3, out = 'N', inn = 'K') => {
		rect(0, y, W - 1, y, out);
		rect(0, y + rows + 1, W - 1, y + rows + 1, inn);
		const p = rows * 2;
		for (let x = 0; x < W; x++) {
			for (let r = 0; r < rows; r++) {
				const d = Math.abs((x % p) - (p - 1) / 2);
				put(x, y + 1 + r, d <= r + 0.5 ? a : b);
			}
		}
	};
	/** A wave band two dots tall, flecked with white, between two rules. */
	const wave = (y: number, a: string, b: string, top = 'K', bottom = 'K') => {
		rect(0, y, W - 1, y, top);
		rect(0, y + 3, W - 1, y + 3, bottom);
		for (let x = 0; x < W; x++) {
			const up = x % 8 < 4;
			put(x, y + 1, up ? a : b);
			put(x, y + 2, up ? b : a);
			if (x % 8 === 2 || x % 8 === 6) put(x, up ? y + 2 : y + 1, 'W');
		}
	};
	/** A line of script from x0 to x1, its marks only where the paper is bare. */
	const caption = (x0: number, x1: number, y: number, k = 0) => {
		let x = x0;
		while (x <= x1) {
			const g = GLY[k % GLY.length];
			const gw = g[0].length;
			let bare = x + gw - 1 <= x1;
			for (let r = -1; r <= 2 && bare; r++)
				for (let i = -1; i <= gw && bare; i++) if (get(x + i, y + r) !== 'W') bare = false;
			if (bare) c.stamp(g, x, y, { 1: 'K' });
			x += gw + (k % 4 === 3 ? 2 : 1);
			k += 1;
		}
	};
	/** An eight-pointed star with a red heart. */
	const star = (x: number, y: number, big = 3.4) => {
		for (let k = 0; k < 8; k++) {
			const a = (k * Math.PI) / 4;
			const len = k % 2 ? big * 0.65 : big;
			line(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, 'Y');
		}
		put(x, y, 'R');
	};

	/** An oil lamp held up, its foot on (x, y), its flame burning bright. */
	const lamp = (x: number, y: number) => {
		figure(['..r..', '.ryr.', '.ryr.', '..y..', 'ooooo', '.ooo.'], x - 2, y - 5, {
			r: 'R',
			y: 'Y',
			o: 'O'
		});
		dots('Y', [x - 3, y - 5], [x + 3, y - 4]);
	};
	/** An oil lamp hanging upside down from a hand at (x, y), gone out. */
	const deadLamp = (x: number, y: number) => figure(['.d.', 'ddd'], x - 1, y + 1, { d: 'D' });
	/** Little flowers on the bare paper. */
	const sprinkle = (x0: number, x1: number, y0: number, y1: number, cols: string[], seed = 0) => {
		let n = seed;
		for (let y = y0; y <= y1; y += 3) {
			for (let x = x0 + (y % 2); x <= x1; x += 4) {
				let bare = true;
				for (let dy = -2; dy <= 2 && bare; dy++)
					for (let dx = -2; dx <= 2 && bare; dx++) if (get(x + dx, y + dy) !== 'W') bare = false;
				if (bare) flower(x, y, cols[n++ % cols.length]);
			}
		}
	};

	// ================= the upper strip: the Three Wise Men =================
	zigzag(0, 'R', 'Y');
	wave(26, 'B', 'L', 'K', 'N');
	const G1 = 25;

	// kurbits trees stand on the panel edges, between the scenes; slim ones between the riders
	kurbits(25, G1, 8, { bud: ['R', 'Y', 'B'], big: ['G', 'B'], low: ['B', 'G'], s: 0.9 });
	kurbits(57, G1, 8, { bud: ['B', 'P', 'R'], big: ['R', 'G'], pot: 'R', s: 0.75 });
	kurbits(87, G1, 8, { bud: ['G', 'Y', 'R'], big: ['B', 'R'], twigs: 'B', s: 0.75 });
	kurbits(118, G1, 8, { bud: ['R', 'B', 'Y'], big: ['Y', 'G'], low: ['G', 'R'], pot: 'N', s: 0.9 });

	// ---- 1. king Herod before his throne, under a canopy
	// the canopy: a red valance with yellow tassels on two blue posts
	block(0, 6, 18, 7, 'R');
	for (let x = 0; x <= 18; x += 2) put(x, 8, 'Y');
	rect(0, 9, 1, 25, 'N');
	rect(17, 9, 18, 25, 'N');
	// the throne's tall back, knobbed in gold
	block(4, 10, 14, 22, 'O');
	dots('Y', [4, 9], [14, 9]);
	for (let y = 12; y <= 21; y += 3) dots('D', [5, y], [13, y]);
	// a chequered floor
	for (let x = 2; x <= 16; x++) put(x, 25, x % 2 ? 'K' : 'Y');
	man(9, 24, 'R', 'Y', 'N', { hat: 'Y', cuff: 'Y' });
	// his crown has points
	dots('Y', [6, 9], [9, 9], [12, 9]);
	// the sceptre in his hand
	line(14, 17, 15, 11, 'K');
	dots('Y', [15, 10], [14, 10], [16, 10], [15, 9], [15, 11]);

	// ---- 2. the first king, with gold
	rider(32, G1, 'R', 'K', 'W', 'Y', 'N', 'Y');
	// the gold: a casket held up
	block(41, 10, 43, 12, 'Y');
	put(42, 11, 'R');

	// ---- 3. the second king, with incense
	rider(62, G1, 'B', 'N', 'W', 'R', 'G', 'R');
	// a censer swinging on its chain, smoke rising
	line(71, 12, 72, 9, 'K');
	block(72, 7, 74, 8, 'O');
	dots('S', [75, 6], [76, 7]);

	// ---- 4. the third king, with myrrh
	rider(92, G1, 'S', 'O', 'B', 'G', 'R', 'N');
	// the myrrh in a tall jar
	fill(
		101,
		8,
		103,
		12,
		(x, y) => x >= 101 && x <= 103 && y >= 8 && y <= 12 && !(y === 8 && x !== 102),
		'Y'
	);
	put(102, 10, 'R');

	// ---- 5. the star, and a shepherd who sees it
	star(142, 10);
	man(130, 25, 'O', 'G', 'D', { hat: 'N' });
	line(135, 25, 135, 11, 'D');
	dots('D', [136, 10], [137, 11]);
	// his sheep: curly wool, black faces and legs
	const sheep = (x: number, y: number) => {
		const body: Test = (px, py) => (px - x - 3) ** 2 / 10 + (py - y + 3) ** 2 / 2.6 <= 1;
		fill(x - 1, y - 6, x + 7, y - 1, body, 'W');
		for (let py = y - 5; py <= y - 1; py++)
			for (let px = x; px <= x + 6; px++) if (body(px, py) && (px + py) % 3 === 0) put(px, py, 'S');
		block(x + 7, y - 5, x + 8, y - 4, 'K', '');
		dots('K', [x + 1, y], [x + 5, y], [x + 1, y - 1], [x + 5, y - 1]);
	};
	sheep(137, 25);
	sheep(140, 19);

	// ---- 6. the stable at Bethlehem: Mary sits in the door with the Child, Joseph stands by
	// a red cottage under a roof of dark shingles, its door open on the dark inside
	block(150, 11, 170, 25, 'R');
	for (let k = 0; k <= 5; k++) rect(149 + k, 10 - k, 171 - k, 10 - k, k % 2 ? 'D' : 'N');
	block(153, 12, 167, 25, 'N');
	// Mary, haloed, the Child swaddled on her lap
	woman(160, 25, 'B', 'R', 'R', ['Y', 'W'], { kerchief: 'W', sit: true });
	for (let y = 9; y <= 18; y++)
		for (let x = 154; x <= 166; x++) {
			const d = Math.hypot(x - 160, y - 13);
			if (d >= 3.6 && d <= 4.6 && get(x, y) === 'N') put(x, y, 'Y');
		}
	block(159, 20, 161, 21, 'W');
	put(160, 20, 'P');
	// the manger, heaped with hay
	block(164, 22, 166, 24, 'O');
	dots('Y', [164, 21], [166, 21], [165, 20]);
	man(174, 25, 'D', 'Y', 'O', { hat: 'K', flip: true });
	line(178, 25, 178, 9, 'O');
	// the star's ray falls on the roof
	dots('Y', [147, 7], [150, 5], [153, 4]);

	// script in the bare places under the border
	caption(2, 28, 6, 0);
	caption(31, 58, 6, 3);
	caption(61, 88, 6, 5);
	caption(91, 110, 6, 1);
	caption(121, 148, 6, 7);
	caption(152, 178, 6, 2);

	// ================= the lower strip: the Wise and Foolish Virgins =================
	wave(30, 'R', 'P', 'N', 'K');
	zigzag(56, 'G', 'Y', 2, 'K', 'N');
	const G2 = 55;

	kurbits(29, G2, 38, { bud: ['B', 'Y', 'R'], big: ['R', 'G'], low: ['G', 'B'], s: 0.9 });
	kurbits(89, G2, 38, { bud: ['R', 'G', 'Y'], big: ['B', 'Y'], low: ['Y', 'R'], pot: 'R', s: 0.9 });
	kurbits(141, G2, 38, { bud: ['G', 'R', 'P'], big: ['Y', 'R'], low: ['R', 'G'], s: 1 });

	// ---- 7. the oil seller behind his counter, his jugs, a foolish girl come to buy
	man(6, G2, 'O', 'R', 'N', { hat: 'N' });
	block(1, G2 - 9, 12, G2, 'D');
	for (let y = G2 - 7; y <= G2 - 1; y += 3) for (let x = 2; x <= 11; x += 3) put(x, y, 'O');
	rect(1, G2 - 9, 12, G2 - 9, 'O');
	const jug = (x: number, y: number, col: string) =>
		figure(['.c.', 'ccc', 'ccc'], x - 1, y - 2, { c: col });
	jug(2, G2 - 11, 'B');
	jug(11, G2 - 11, 'G');
	woman(18, G2, 'R', 'N', 'N', ['R', 'Y', 'G'], { flip: true });
	deadLamp(14, G2 - 10);

	// ---- 8. the midnight cry: the watchman blows his horn under the moon; a girl sleeps
	man(39, G2, 'G', 'Y', 'N', { hat: 'K' });
	// the long wooden horn, banded, raised to his lips
	line(41, G2 - 16, 48, G2 - 22, 'O');
	line(42, G2 - 16, 49, G2 - 22, 'D');
	dots('Y', [44, G2 - 18], [46, G2 - 20]);
	// a crescent moon and stars
	disk(54, G2 - 19, 2.6, 'Y');
	disk(55, G2 - 20, 2.3, 'W');
	dots('Y', [58, G2 - 16], [50, G2 - 14], [57, G2 - 22]);
	// the foolish girl asleep, her lamp tipped over
	woman(51, G2, 'P', 'G', 'N', ['R', 'W'], { sit: true });
	figure(['dd.', 'ddd'], 56, G2 - 1, { d: 'D' });

	// ---- 9. the shut door of the wedding house, a foolish girl knocking
	woman(66, G2, 'P', 'N', 'N', ['Y', 'B']);
	// her fist raised to the door
	figure(['..ff', '.ww.', 'ww..'], 68, G2 - 16, { f: 'W', w: 'W' });
	// the house: a red wall, a shingled gable, a studded door and a window
	block(72, G2 - 10, 84, G2, 'R');
	for (let k = 0; k < 7; k++) rect(71 + k, G2 - 11 - k, 85 - k, G2 - 11 - k, k % 2 ? 'D' : 'O');
	block(73, G2 - 8, 77, G2, 'N');
	dots('Y', [74, G2 - 7], [76, G2 - 7], [74, G2 - 4], [76, G2 - 4], [74, G2 - 1], [76, G2 - 1]);
	block(80, G2 - 8, 82, G2 - 6, 'S');
	dots('K', [81, G2 - 8], [81, G2 - 7], [81, G2 - 6], [80, G2 - 7], [82, G2 - 7]);

	// ---- 10. the wise virgins, their lamps alight
	woman(100, G2, 'B', 'R', 'N', ['R', 'Y']);
	lamp(105, G2 - 11);
	woman(112, G2, 'B', 'R', 'N', ['G', 'Y']);
	lamp(117, G2 - 11);

	// ---- 11. the fiddler leads the wedding
	man(127, G2, 'B', 'R', 'Y');
	// the fiddle under his chin, the bow across it
	line(129, G2 - 14, 127, G2 - 16, 'D');
	figure(['.oo.', 'oooo', '.ok.', 'oooo', '.oo.'], 129, G2 - 14, { o: 'O', k: 'K' });
	line(134, G2 - 15, 127, G2 - 8, 'K');

	// ---- 12. bride and groom, she in the bridal crown
	man(158, G2, 'N', 'R', 'Y');
	woman(168, G2, 'Y', 'R', 'N', ['R', 'G', 'B'], { kerchief: 'P' });
	dots('R', [166, G2 - 19], [170, G2 - 19]);
	dots('B', [168, G2 - 19]);
	dots('Y', [166, G2 - 21], [168, G2 - 21], [170, G2 - 21]);
	kurbits(177, G2, 40, { bud: ['B', 'R', 'Y'], big: ['G', 'R'], low: ['B', 'Y'], s: 0.6 });

	// script between the heads
	caption(0, W - 1, 35, 4);

	// little flowers on the bare paper
	sprinkle(0, W - 1, 21, 24, ['P', 'R', 'B']);
	sprinkle(0, W - 1, 48, 53, ['R', 'B', 'P'], 1);
}

export const bonad: Mural = {
	file: 'bonad',
	name: 'The Dalarna Bonad',
	prefix: 'bonad',
	notes: 'G',
	cols: 6,
	difficulty: 0.55,
	panel: [PW, PH],
	// W paper, K black, N dark blue, B blue, S pale blue, R red, D dark red, P pink, G green,
	// L light green, Y yellow, O ochre
	palette: {
		W: '#f4ead0',
		K: '#1e1a1c',
		N: '#1f3170',
		B: '#3f7fc6',
		S: '#a8c8e0',
		R: '#c9302a',
		D: '#6e2a1e',
		P: '#ef93a2',
		G: '#2f7d3a',
		L: '#9cc441',
		Y: '#f6c62e',
		O: '#b8782a'
	},
	ground: 'W',
	panels: [
		['king-herod', 'King Herod', { mode: 'harmonic', spice: 'adventurous', lead: 'brass' }],
		['gold', 'King with Gold', { mode: 'mixolydian', spice: 'lively', lead: 'keys' }],
		['incense', 'King with Incense', { mode: 'dorian', spice: 'gentle', lead: 'flute' }],
		['myrrh', 'King with Myrrh', { mode: 'minor', spice: 'gentle', lead: 'string' }],
		['the-star', 'The Star', { mode: 'lydian', spice: 'gentle', lead: 'vibes' }],
		['the-stable', 'The Stable', { mode: 'major', spice: 'gentle', lead: 'harp' }],
		['oil-seller', 'The Oil Seller', { mode: 'mixolydian', spice: 'lively', lead: 'pizz' }],
		[
			'midnight-cry',
			'The Midnight Cry',
			{ mode: 'phrygian', spice: 'adventurous', lead: 'mallet' }
		],
		['shut-door', 'The Shut Door', { mode: 'minor', spice: 'gentle', lead: 'keys' }],
		['wise-virgins', 'Wise Virgins', { mode: 'dorian', spice: 'gentle', lead: 'kalimba' }],
		['fiddler', 'The Fiddler', { mode: 'mixolydian', spice: 'lively', lead: 'string' }],
		['bride-and-groom', 'Bride and Groom', { mode: 'major', spice: 'lively', lead: 'flute' }]
	],
	draw
};
