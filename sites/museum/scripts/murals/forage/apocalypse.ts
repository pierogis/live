// Apocalypse Tapestry at Angers, France (woven 1377–1382): the Book of Revelation as a
// long run of scenes, each on a ground of madder red or indigo, turn and turn about, sown
// with leafy sprigs, flowers and butterflies. St John watches from his Gothic pavilion; the
// four horsemen ride; angels sound their trumpets; locusts with human faces swarm from the
// pit; the woman clothed with the sun stands on the moon; Michael fights the seven-headed
// dragon; the beast rises from the sea; the whore of Babylon rides her beast; Babylon falls;
// the New Jerusalem shines. Two rows of six scenes, 32 by 32 each.
import { Canvas, SIDES, mod, points } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 32;
const PH = 32;
const COLS = 6;
const KEYS = 'RBKWYOPNGSLA';
const ID: Record<string, string> = Object.fromEntries([...KEYS].map((k) => [k, k]));

/** Each scene's ground: red and blue like a checkerboard. */
const back = (k: number) => (((k % COLS) + Math.floor(k / COLS)) % 2 ? 'B' : 'R');

const hash = (x: number, y: number) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000;

type Paint = (s: Canvas) => void;

/** A figure drawn on its own little canvas, then ringed with a dark outline. */
function sprite(w: number, h: number, fn: Paint, after?: Paint, edge = 'K'): string[] {
	const s = new Canvas(w, h, '.');
	fn(s);
	if (edge) {
		const g = s.rows();
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				if (g[y][x] !== '.') continue;
				if (SIDES.some(([dx, dy]) => (g[y + dy]?.[x + dx] ?? '.') !== '.')) s.g[y][x] = edge;
			}
		}
	}
	after?.(s);
	return s.rows();
}

/** A hand-drawn pattern, outlined. */
const outlined = (p: string[], key: Record<string, string>, after?: Paint, edge = 'K') =>
	sprite(p[0].length + 2, p.length + 2, (s) => s.stamp(p, 1, 1, { ...ID, ...key }), after, edge);

// a prancing horse facing right: c coat, m mane and tail, t saddle cloth, k eye
const HORSE = [
	'...............cc.....',
	'..............cccc....',
	'.............mcccc....',
	'............mmcckcc...',
	'...........mmcc.cccc..',
	'..........mmccc..ccc..',
	'.........mmcccc...cc..',
	'...cccccccccccc.......',
	'..cctttttttcccc.......',
	'.ccttttttttcccc.......',
	'mccttttttttcccc.......',
	'mmcccccccccccc........',
	'm..ccc....cccc........',
	'm..cc.c....cc.cc......',
	'...c..c....c...cc.....',
	'..cc..cc...cc...c.....'
];
// a rider seated facing right: h hair, r robe, k eye; the last rows hang over the horse
const RIDER = [
	'.hhh..',
	'hhWW..',
	'hWWkW.',
	'.WWW..',
	'..W...',
	'.rrr..',
	'rrrrrW',
	'rrrr..',
	'rrrrr.',
	'.rrrrr',
	'...r.r'
];
// one of the beasts' seven heads, facing right: crowned, jaws open
const HEAD7 = ['.Y.Y..', '.YYY..', 'ccccc.', 'cckccc', 'cc.tt.'];
// a locust: a golden horse in armour with wings, a scorpion's tail, and a crowned
// human face with a woman's hair and lion's teeth
const LOCUST = [
	'..............Y.Y.Y...',
	'..aa..........YYYYY...',
	'.a..a........hhWWWW...',
	'.O..a........hhWWkW...',
	'....a........hhWWWWW..',
	'....a.........hWWKK...',
	'....a.LLLLL...hhWW....',
	'...aaLLLLLLLL.hhh.....',
	'..cccLLLLLLLLccch.....',
	'..cttttttttttccc......',
	'..cttttttttttcc.......',
	'..ccccccccccccc.......',
	'...cc.c.....cc.c......',
	'...c..c.....c..c......',
	'..cc..cc...cc..cc.....'
];
// the mouth of hell: a monster's head, jaws open, fire in its throat
const HELL = [
	'..nnnn......',
	'.nYnnnn.....',
	'nnnnnnnnn...',
	'nnnnnnnnnnn.',
	'nnnWKWKWKW..',
	'nnOYOOYOOO..',
	'nnOOYOOYOK..',
	'nnnKWKWKWKW.',
	'nnnnnnnnnnnn',
	'.nnnnnnnnn..'
];
// the twelve foundations of the holy city, each a different stone
const JEWELS = 'OLWSPYBO';

interface Who {
	robe: string;
	fold?: string;
	hair?: string;
	halo?: boolean;
	crown?: boolean;
	/** Body length below the neck. */
	h?: number;
	/** Hem half-width. */
	hem?: number;
	wings?: [string, string];
	extra?: Paint;
	after?: Paint;
}

/** A standing Gothic figure facing right: small head, long robe with folds. Head at (7, 4). */
const person = (o: Who) =>
	sprite(
		16,
		28,
		(s) => {
			const h = o.h ?? 17;
			const hem = o.hem ?? 4;
			if (o.wings) {
				// a long wing rising behind the shoulders, feathers in bands
				const [a, b] = o.wings;
				s.oval(3.5, 8, 6.5, 2.2, -1.2, a);
				for (let y = 0; y < 20; y++)
					for (let x = 0; x < 8; x++) if (s.get(x, y) === a && mod(x + y, 3) === 0) s.put(x, y, b);
			}
			if (o.halo) s.disk(7, 4, 3.4, 'Y');
			s.ell(7, 4, 1.9, 2.3, 'W');
			s.dots(o.hair ?? 'N', [6, 2], [7, 2], [8, 2], [6, 3], [6, 4], [6, 5]);
			s.put(8, 4, 'K');
			s.put(7, 7, 'W');
			for (let y = 8; y < 8 + h; y++) {
				const t = (y - 8) / (h - 1);
				const hw = Math.round(1.6 + t * (hem - 1.6) + (y > 9 && y < 12 ? 0.6 : 0));
				for (let x = 7 - hw; x <= 7 + hw; x++) {
					const fold = y > 10 && mod(x - 7, 3) === 1;
					s.put(x, y, fold ? (o.fold ?? 'K') : o.robe);
				}
			}
			if (o.crown) s.dots('Y', [6, 1], [7, 1], [8, 1], [6, 0], [8, 0]);
			o.extra?.(s);
		},
		o.after
	);

function draw(c: Canvas) {
	const { put, get, rect, disk, line, dots, ring } = c;
	const S = (p: string[], x: number, y: number, flip = false, re: Record<string, string> = {}) =>
		c.stamp(p, x, y, { ...ID, ...re }, flip);

	const panel = (k: number, wide = 0) => {
		c.at((k % COLS) * PW, Math.floor(k / COLS) * PH);
		c.clip(-wide, 0, PW - 1 + wide, PH - 1);
	};

	// ---------- every scene: its ground, and a meadow along the bottom ----------
	for (let k = 0; k < 12; k++) {
		panel(k);
		rect(0, 0, PW - 1, PH - 1, back(k));
		const gx = (k % COLS) * PW;
		for (let x = 0; x < PW; x++) {
			const top = 27 + Math.round(Math.sin((gx + x) / 4.5) * 1.2);
			for (let y = top; y < PH; y++) {
				const tuft = mod(x + (y % 2) * 2, 4) === 0;
				put(x, y, y === top ? 'S' : tuft ? 'S' : 'G');
			}
		}
	}

	// little meadow flowers along the bottom of each scene
	const meadow = (cols: string) => {
		for (let x = 1; x < PW; x += 3) {
			const y = 29 + (hash(x, 3) % 3);
			if ('GS'.includes(get(x, y))) put(x, y, cols[hash(x, y) % cols.length]);
		}
	};
	// rolling water: crests of cream over pale and dark blue
	const waves = (y0: number, x0 = 0, x1 = PW - 1) => {
		for (let y = y0; y < PH; y++) {
			for (let x = x0; x <= x1; x++) {
				const v = mod(y + Math.round(Math.sin((x + y * 2) / 1.7) * 0.9), 3);
				put(x, y, v === 0 ? 'W' : v === 1 ? 'L' : 'B');
			}
		}
	};
	/** Paint in scene coordinates on a layer of its own, then ring it with an outline. */
	const layer = (fn: Paint, after?: Paint, edge = 'K') => {
		const shift = (f: Paint) => (s: Canvas) => {
			s.at(20, 4);
			f(s);
			s.at();
		};
		S(sprite(PW + 40, PH + 8, shift(fn), after && shift(after), edge), -20, -4);
	};
	/** A horse with its rider; (x, y) is the horse's top left. */
	const mount = (
		x: number,
		y: number,
		[coat, mane, cloth]: string,
		robe: string,
		hair: string,
		{ crown = false, skull = false, edge = 'K' } = {}
	) => {
		S(
			outlined(
				HORSE,
				{ c: coat, m: mane, t: cloth, k: edge === 'K' ? 'K' : 'A' },
				(s) => {
					for (let yy = 0; yy < 18; yy++)
						for (let xx = 0; xx < 24; xx++)
							if (s.get(xx, yy) === cloth && mod(xx + yy, 2)) s.put(xx, yy, 'Y');
				},
				edge
			),
			x,
			y
		);
		S(
			outlined(RIDER, { h: hair, r: robe, k: 'K' }, (s) => {
				if (crown) s.dots('Y', [2, 0], [4, 0], [2, 1], [3, 1], [4, 1]);
				if (skull) s.dots('K', [2, 2], [4, 3], [3, 4], [4, 4]);
			}),
			x + 5,
			y
		);
	};
	/** Seven necks from one chest, a crowned head on each; heads are given by their middles. */
	const hydra = (
		bx: number,
		by: number,
		list: string,
		skin: string,
		tongue: string,
		left = false
	) => {
		const heads = points(list).map(([x, y]) => [x, y, Math.hypot(x - bx, y - by)] as const);
		const neck = (s: Canvas, cx: number, cy: number) => {
			const ex = cx + (left ? 2 : -2);
			const ey = cy + 1;
			const mx = (bx + ex) / 2 + (ey - by) * 0.15;
			const my = (by + ey) / 2 - (ex - bx) * 0.15;
			for (let k = 0; k <= 30; k++) {
				const t = k / 30;
				const x = (1 - t) ** 2 * bx + 2 * t * (1 - t) * mx + t * t * ex;
				const y = (1 - t) ** 2 * by + 2 * t * (1 - t) * my + t * t * ey;
				s.disk(x, y, 0.8, skin);
			}
		};
		// the necks bare, then each head outlined, far ones first
		layer((s) => heads.forEach(([cx, cy]) => neck(s, cx, cy)), undefined, '');
		for (const [cx, cy] of heads.sort((p, q) => q[2] - p[2]))
			layer((s) => s.stamp(HEAD7, cx - 3, cy - 2, { ...ID, c: skin, k: 'K', t: tongue }, left));
	};

	// ---------- 1. St John in his pavilion with his book, an angel appears to him ----------
	panel(0);
	// slate roof in checks, gold crockets and finial
	for (let y = 1; y <= 8; y++) {
		const hw = Math.round((y - 1) * 0.9);
		for (let x = 7 - hw; x <= 7 + hw; x++) {
			const edge = x === 7 - hw || x === 7 + hw;
			put(x, y, edge ? 'K' : mod(x + y, 2) ? 'A' : 'L');
		}
		if (y % 2 === 0) dots('Y', [6 - hw, y], [8 + hw, y]);
	}
	dots('Y', [7, 0]);
	rect(0, 9, 14, 9, 'Y');
	dots('K', [1, 9], [4, 9], [7, 9], [10, 9], [13, 9]);
	// inside: a blue wall with a gold lattice
	rect(1, 10, 13, 25, 'B');
	for (let y = 10; y <= 25; y++)
		for (let x = 2; x <= 12; x++) if (mod(x + y, 4) === 0 && mod(x - y, 4) === 0) put(x, y, 'Y');
	// slim columns and a pointed arch
	for (const x of [0, 14]) line(x, 10, x, 25, 'K');
	for (const x of [1, 13]) line(x, 10, x, 25, 'W');
	for (let x = 2; x <= 12; x++) put(x, 10 + Math.round(((x - 7) / 5) ** 2 * 3), 'W');
	// John on his bench, a book open on his knees
	S(
		sprite(16, 22, (s) => {
			s.disk(7, 4, 3.4, 'Y');
			s.ell(7, 4, 1.9, 2.3, 'W');
			s.dots('N', [6, 2], [7, 2], [8, 2], [6, 3], [6, 4], [6, 5]);
			s.put(8, 4, 'K');
			s.put(7, 7, 'W');
			for (let y = 8; y <= 12; y++) s.rect(5, y, 9, y, 'W');
			s.rect(5, 13, 12, 14, 'W');
			for (let y = 15; y <= 19; y++) s.rect(9, y, 12, y, 'W');
			for (let y = 10; y <= 19; y++) if (y % 3 === 0) s.put(10, y, 'A');
			s.dots('A', [6, 10], [8, 11], [6, 12]);
			// the open book held up
			s.rect(10, 9, 13, 11, 'R');
			s.dots('W', [10, 10], [11, 10], [12, 10], [13, 10]);
			s.put(9, 11, 'W');
		}),
		-1,
		9
	);
	// bench and floor
	rect(1, 23, 8, 25, 'N');
	for (let x = 1; x <= 8; x += 2) put(x, 24, 'Y');
	rect(0, 26, 15, 27, 'A');
	for (let x = 0; x <= 15; x += 3) put(x, 27, 'K');
	// the angel on a cloud, pointing John to the vision
	S(
		person({
			robe: 'W',
			fold: 'L',
			hair: 'Y',
			halo: true,
			wings: ['L', 'W'],
			h: 14,
			extra: (s) => {
				s.line(9, 10, 12, 8, 'W');
				s.put(13, 7, 'W');
			}
		}),
		15,
		4,
		true
	);
	// the cloud
	for (let x = 16; x <= 31; x++) {
		const top = 21 + (mod(x, 4) === 1 || mod(x, 4) === 2 ? 0 : 1);
		for (let y = top; y <= 24; y++) put(x, y, y === top ? 'W' : mod(x + y, 3) ? 'L' : 'W');
	}
	meadow('WYP');

	// ---------- 2. the white horse and the red: a crowned archer, a swordsman ----------
	panel(1);
	mount(-4, 2, 'WYR', 'R', 'Y', { crown: true });
	// his bow raised, an arrow on the string
	for (let k = 0; k <= 8; k++) {
		const t = k / 8;
		put(6 + t * 5 + Math.sin(t * Math.PI) * 1.6, 1 + t * 5 - Math.sin(t * Math.PI) * 2, 'N');
	}
	line(6, 1, 11, 6, 'W');
	line(6, 6, 12, 0, 'Y');
	put(13, 0, 'A');
	mount(10, 14, 'RKY', 'Y', 'K');
	// the great sword held high
	line(22, 19, 28, 13, 'A');
	line(22, 18, 27, 13, 'W');
	dots('Y', [21, 18], [22, 20], [20, 19]);
	meadow('WYP');

	// ---------- 3. the black horse and the pale: scales, and Death ----------
	panel(2);
	mount(-4, 1, 'KAG', 'G', 'N', { edge: 'A' });
	// the scales, held up
	line(9, 0, 9, 5, 'Y');
	line(6, 1, 12, 1, 'Y');
	dots('W', [5, 2], [6, 2], [7, 2], [11, 2], [12, 2], [13, 2]);
	mount(10, 14, 'SAN', 'A', 'W', { skull: true });
	// Death's spear, hell gaping at his heels
	line(22, 21, 29, 14, 'N');
	dots('W', [30, 13], [29, 13], [30, 14]);
	S(outlined(HELL, { n: 'N' }), -1, 19);
	meadow('WYO');

	// ---------- 4. three angels sound their trumpets; hail and fire fall ----------
	panel(3);
	for (const [x, y, robe, fold] of [
		[1, 3, 'W', 'A'],
		[11, 1, 'P', 'R'],
		[21, 3, 'Y', 'N']
	] as const) {
		S(
			person({
				robe,
				fold,
				hair: 'Y',
				halo: true,
				wings: ['L', 'W'],
				h: 18,
				extra: (s) => s.line(8, 10, 11, 7, robe)
			}),
			x - 4,
			y
		);
		// a long gold trumpet raised to the lips
		line(x + 5, y + 4, x + 10, y - 1, 'Y');
		dots('Y', [x + 10, y - 2], [x + 11, y - 1], [x + 11, y - 2]);
	}
	for (const [x, y] of [
		[3, 1],
		[17, 2],
		[29, 2],
		[8, 0],
		[24, 0]
	])
		dots(hash(x, y) % 2 ? 'O' : 'W', [x, y]);
	meadow('WYO');

	// ---------- 5. locusts with human faces come up from the pit ----------
	panel(4);
	// the pit, a stone well, smoke rising out of it
	ring(4, 25, 3.5, 'A', 1.1);
	disk(4, 25, 2.4, 'K');
	for (let y = 0; y < 21; y++) {
		const x = 3 + Math.round(Math.sin(y / 2.5) * 1.5);
		dots(y % 6 ? 'A' : 'W', [x, y], [x + 1, y]);
	}
	const locust = outlined(LOCUST, { a: 'A', c: 'Y', t: 'N', h: 'N' }, (s) => {
		for (let x = 7; x < 14; x += 2) s.put(x, 8, 'W');
	});
	S(locust, 8, 0);
	S(locust, 7, 14, false, { N: 'O' });
	meadow('WYS');

	// ---------- 6. the woman clothed with the sun, the moon under her feet ----------
	panel(5);
	for (let k = 0; k < 20; k++) {
		const a = (k / 20) * Math.PI * 2;
		const r1 = k % 2 ? 12.5 : 10.5;
		line(
			16 + Math.cos(a) * 7,
			14 + Math.sin(a) * 7,
			16 + Math.cos(a) * r1,
			14 + Math.sin(a) * r1,
			k % 2 ? 'Y' : 'O'
		);
	}
	disk(16, 14, 7.5, 'Y');
	S(
		person({
			robe: 'L',
			fold: 'W',
			hair: 'N',
			crown: true,
			h: 15,
			extra: (s) => {
				s.line(9, 10, 10, 8, 'L');
				s.put(10, 7, 'W');
			}
		}),
		9,
		3
	);
	// twelve stars round her head
	for (let k = 0; k < 12; k++) {
		const a = Math.PI * 0.85 + (k / 11) * Math.PI * 1.3;
		put(16 + Math.cos(a) * 5.5, 7.5 + Math.sin(a) * 5, 'W');
	}
	// the moon, a crescent under her feet
	for (let x = 9; x <= 23; x++) {
		const d = Math.abs(x - 16) / 7;
		const y0 = 26 - Math.round((1 - d * d) * 2);
		put(x, y0, 'W');
		if (d < 0.8) put(x, y0 + 1, 'A');
	}
	meadow('WYP');

	// ---------- 7 and 8. the great red dragon, Michael and his angels ----------
	panel(6, 4);
	layer(
		(s) => {
			// bat wings raised from the back
			for (let y = 2; y < 18; y++) {
				for (let x = 1; x < 17; x++) {
					const top = 3 + Math.abs(Math.sin((x / 16) * Math.PI * 2.5)) * 3;
					if (y >= top && y <= 17 - x * 0.25) s.put(x, y, 'O');
				}
			}
			s.ell(10, 20, 8, 4.5, 'R');
			// tail curling back
			for (let k = 0; k <= 14; k++) s.disk(3 - k * 0.25, 21 + Math.sin(k / 2.4) * 3, 0.9, 'R');
			// legs with claws
			s.rect(5, 23, 6, 27, 'R');
			s.rect(13, 23, 14, 27, 'R');
		},
		(s) => {
			// ribs in the wings, scales and a gold belly
			for (const [x, y] of [
				[2, 4],
				[7, 3],
				[13, 4]
			])
				s.line(11, 16, x, y, 'K');
			for (let y = 15; y < 27; y++)
				for (let x = 2; x < 19; x++) {
					if (s.get(x, y) !== 'R') continue;
					if (y >= 22) s.put(x, y, mod(x, 2) ? 'Y' : 'R');
					else if (mod(x + y * 2, 4) === 0) s.put(x, y, 'O');
				}
			s.dots('W', [4, 28], [6, 28], [12, 28], [14, 28]);
		}
	);
	hydra(14, 18, '22,3 22,10 22,17 29,1 29,7 29,13 29,20', 'R', 'O');
	// the stars his tail drew down
	dots('W', [2, 1], [7, 0], [1, 6], [24, 25], [29, 26]);
	dots('Y', [5, 2], [11, 1], [20, 24]);
	panel(6);
	meadow('WYP');

	panel(7, 6);
	// Michael in mail, a shield with a cross, his lance in a dragon's mouth
	S(
		person({
			robe: 'A',
			fold: 'W',
			hair: 'Y',
			halo: true,
			wings: ['O', 'Y'],
			h: 18,
			extra: (s) => {
				for (let y = 9; y < 26; y++)
					for (let x = 3; x < 13; x++) if (s.get(x, y) === 'W' && mod(y, 2)) s.put(x, y, 'A');
				s.rect(9, 11, 12, 16, 'W');
				s.line(10, 11, 10, 16, 'R');
				s.line(9, 13, 12, 13, 'R');
			}
		}),
		15,
		4,
		true
	);
	line(19, 12, -3, 5, 'N');
	// one of his angels below, sword raised against the heads
	S(
		person({
			robe: 'L',
			fold: 'W',
			hair: 'Y',
			halo: true,
			wings: ['W', 'L'],
			h: 12,
			hem: 3,
			extra: (s) => s.line(9, 10, 11, 8, 'L')
		}),
		-1,
		8,
		true
	);
	line(2, 15, -3, 12, 'W');
	dots('Y', [2, 16], [3, 15], [1, 16]);
	panel(7);
	meadow('WYO');

	// ---------- 9. the beast rises from the sea ----------
	panel(8);
	waves(19);
	layer(
		(s) => {
			s.ell(22, 15, 9, 5, 'Y');
			s.disk(15, 14, 3.5, 'Y');
			// a bear's front paws reaching out of the waves
			s.line(14, 17, 10, 20, 'N');
			s.line(14, 18, 10, 21, 'N');
			s.line(18, 19, 16, 22, 'N');
			s.line(19, 19, 17, 22, 'N');
			// tail
			s.line(30, 13, 31, 9, 'Y');
		},
		(s) => {
			// leopard spots
			for (let y = 10; y < 22; y++)
				for (let x = 12; x < 32; x++)
					if (s.get(x, y) === 'Y' && mod(x + (y % 4 === 1 ? 2 : 0), 4) === 0 && y % 2)
						s.put(x, y, 'N');
			s.dots('W', [9, 20], [9, 22], [15, 23]);
		}
	);
	hydra(14, 13, '3,2 10,1 17,3 3,9 10,8 3,16 9,15', 'Y', 'R', true);
	// the sea washes over its belly
	waves(21, 18, 31);
	dots('A', [3, 27], [4, 26], [5, 27], [24, 29], [25, 28], [26, 29]);

	// ---------- 10. the whore of Babylon on the scarlet beast ----------
	panel(9);
	waves(26);
	layer(
		(s) => {
			s.ell(21, 19, 8.5, 4, 'O');
			s.rect(14, 21, 15, 26, 'O');
			s.rect(26, 21, 27, 26, 'O');
			s.line(29, 18, 31, 23, 'O');
		},
		(s) => {
			// the names of blasphemy written all over it
			for (let y = 15; y < 24; y++)
				for (let x = 13; x < 31; x++)
					if (s.get(x, y) === 'O' && mod(x * 2 + y, 5) === 0) s.put(x, y, 'K');
		}
	);
	hydra(13, 17, '3,3 10,2 3,10 10,9 3,17 9,16 16,7', 'O', 'W', true);
	// she sits in purple and scarlet, crowned, raising a golden cup
	S(
		person({
			robe: 'P',
			fold: 'R',
			hair: 'Y',
			crown: true,
			h: 11,
			hem: 4,
			extra: (s) => {
				s.line(9, 10, 11, 7, 'P');
				s.rect(11, 4, 13, 5, 'Y');
				s.put(12, 6, 'Y');
			}
		}),
		14,
		1
	);

	// ---------- 11. Babylon is fallen ----------
	panel(10);
	/** Stone in courses, mortar dark. */
	const stone = (x: number, y: number) =>
		y % 3 === 2 || mod(x + (Math.floor(y / 3) % 2) * 3, 6) === 0 ? 'K' : 'A';
	/** A stone tower, w wide, from row `top` down to row `bottom`; `tilt` leans it as it falls. */
	const tower = (x: number, top: number, w: number, tilt: number, roof: string, bottom = 26) => {
		const h = bottom - top;
		const p = sprite(w + 2, h + 2, (s) => {
			const mid = (w + 1) / 2;
			// a tall pointed roof with a gold knob
			for (let y = 1; y < 8; y++) {
				const hw = (y - 1) * ((w + 1) / 14);
				for (let xx = 1; xx <= w; xx++)
					if (Math.abs(xx - mid) <= hw)
						s.put(xx, y, y % 3 === 0 && Math.abs(xx - mid) < hw ? 'Y' : roof);
			}
			s.put(Math.round(mid), 0, 'Y');
			for (let y = 8; y <= h; y++)
				for (let xx = 1; xx <= w; xx++) s.put(xx, y, y % 3 === 2 ? 'K' : 'A');
			// burning windows
			for (let wy = 10; wy + 2 <= h; wy += 6) {
				s.rect(Math.round(mid) - 1, wy, Math.round(mid), wy + 2, 'O');
				s.put(Math.round(mid) - 1, wy, 'Y');
			}
		});
		p.forEach((row, r) => {
			const off = Math.round((p.length - r) * tilt);
			[...row].forEach((ch, i) => {
				if (ch !== '.') put(x + i + off, top - 1 + r, ch);
			});
		});
	};
	tower(-1, 4, 7, 0, 'R');
	tower(23, 7, 7, 0, 'L');
	// the middle tower breaks: its stump stands, its top topples away
	for (let y = 15; y <= 22; y++) {
		const jag = y === 15 ? [10, 12, 15] : y === 16 ? [10, 15] : [];
		for (let x = 9; x <= 17; x++)
			put(x, y, x === 9 || x === 17 ? 'K' : jag.includes(x) ? back(10) : stone(x, y));
	}
	tower(10, 0, 7, 0.55, 'R', 12);
	// the city wall, its gate, flames along the top
	for (let y = 22; y <= 27; y++)
		for (let x = 0; x < PW; x++) {
			if (y === 22 && x % 2) continue;
			put(x, y, stone(x, y + 1));
		}
	rect(14, 23, 18, 27, 'K');
	rect(15, 24, 17, 27, 'O');
	dots('Y', [16, 24], [15, 26], [17, 25]);
	for (const [x, y] of points('2,21 7,21 21,21 28,21 12,14')) {
		dots('O', [x, y], [x + 1, y], [x, y - 1]);
		dots('Y', [x + 1, y - 1], [x, y - 2]);
	}
	// stones tumbling from the falling tower
	for (const [x, y] of points('20,15 19,19 9,12 23,18')) {
		rect(x, y, x + 1, y + 1, 'A');
		put(x + 1, y + 1, 'K');
	}
	// unclean birds flying off
	for (const [x, y] of points('27,1 15,2 2,0')) dots('K', [x, y], [x + 1, y + 1], [x + 2, y]);
	meadow('AO');

	// ---------- 12. the New Jerusalem ----------
	panel(11);
	// golden walls on courses of jewels, pearl gates
	for (let y = 13; y <= 26; y++)
		for (let x = 11; x <= 31; x++) {
			if (y >= 23) put(x, y, mod(x + y, 2) ? JEWELS[mod(x + y * 3, JEWELS.length)] : 'Y');
			else put(x, y, y % 3 === 0 || mod(x + (Math.floor(y / 3) % 2) * 3, 6) === 0 ? 'N' : 'Y');
		}
	for (let x = 11; x <= 31; x += 2) put(x, 12, 'Y');
	for (const gx of [17, 26]) {
		rect(gx - 2, 16, gx + 2, 26, 'K');
		rect(gx - 1, 17, gx + 1, 26, 'W');
		put(gx, 15, 'K');
		put(gx, 16, 'W');
		put(gx, 21, 'Y');
	}
	// towers with blue roofs
	for (const [tx, ty] of points('13,6 21,4 29,6')) {
		rect(tx - 2, ty + 3, tx + 2, 12, 'Y');
		for (let y = ty + 4; y <= 12; y++) put(tx, y, y % 2 ? 'K' : 'Y');
		for (let k = 0; k < 4; k++) rect(tx - k + 1, ty + k - 1, tx + k - 1, ty + k - 1, 'L');
		rect(tx - 3, ty + 3, tx + 3, ty + 3, 'L');
		put(tx, ty - 2, 'Y');
	}
	// the river of life flows out under the gate
	for (let y = 27; y < PH; y++)
		for (let x = 15; x <= 19; x++) {
			const xx = x + (y % 2);
			put(xx, y, mod(xx + y, 3) ? 'L' : 'W');
		}
	// the angel with the golden reed, showing John the city
	S(
		person({ robe: 'W', fold: 'L', hair: 'Y', halo: true, wings: ['L', 'W'], h: 16, hem: 4 }),
		-4,
		6
	);
	line(6, 15, 9, 1, 'Y');
	put(6, 14, 'W');
	meadow('WYO');

	// ---------- sprigs, flowers and butterflies in the empty ground ----------
	const SPRIGS = [
		['.a.', 'aba', '.a.'],
		['a.a', '.a.', '.c.'],
		['b.b', '.c.', 'b.b'],
		['a.a', 'bcb']
	];
	for (let k = 0; k < 12; k++) {
		panel(k);
		const bg = back(k);
		const [a, b, cc] = bg === 'R' ? ['S', 'Y', 'G'] : ['W', 'Y', 'S'];
		for (let gy = 0; gy < 27; gy += 4) {
			for (let gx = 0; gx < PW; gx += 4) {
				const x = gx + (hash(gx + k * 40, gy) % 3) - 1;
				const y = gy + (hash(gy + k * 40, gx) % 3) - 1;
				const p = SPRIGS[hash(x + k, y) % SPRIGS.length];
				const w = p[0].length;
				let ok = x >= 1 && y >= 1 && x + w < PW && y + p.length < PH;
				for (let dy = -1; ok && dy <= p.length; dy++)
					for (let dx = -1; dx <= w; dx++) if (get(x + dx, y + dy) !== bg) ok = false;
				if (ok) S(p, x, y, false, { a, b, c: cc });
			}
		}
	}
	c.at();
	c.clip();
}

export const apocalypse: Mural = {
	file: 'apocalypse-tapestry',
	name: 'Apocalypse Tapestry',
	prefix: 'apocalypse',
	notes: 'C',
	cols: COLS,
	difficulty: 0.85,
	panel: [PW, PH],
	// R madder red, B indigo, K dark brown, W cream, Y gold, O orange, P rose, N brown,
	// G olive green, S sage, L pale blue, A gray
	palette: {
		R: '#9a3030',
		B: '#2c4370',
		K: '#241a17',
		W: '#ede0c2',
		Y: '#cfa23c',
		O: '#df6a2c',
		P: '#d99a8e',
		N: '#6a3f22',
		G: '#3d5a2a',
		S: '#94ad6e',
		L: '#8fa9c8',
		A: '#6e6a66'
	},
	ground: 'R',
	panels: [
		['st-john', 'St John', { mode: 'dorian', spice: 'gentle', lead: 'harp' }],
		[
			'white-and-red',
			'White and Red Horses',
			{ mode: 'mixolydian', spice: 'lively', lead: 'brass' }
		],
		[
			'black-and-pale',
			'Black and Pale Horses',
			{ mode: 'phrygian', spice: 'lively', lead: 'string' }
		],
		['trumpets', 'The Trumpets', { mode: 'lydian', spice: 'lively', lead: 'brass' }],
		['locusts', 'The Locusts', { mode: 'phrygian', spice: 'adventurous', lead: 'pizz' }],
		['sun-woman', 'Woman of the Sun', { mode: 'lydian', spice: 'gentle', lead: 'vibes' }],
		['red-dragon', 'The Red Dragon', { mode: 'minor', spice: 'adventurous', lead: 'string' }],
		['st-michael', 'St Michael', { mode: 'mixolydian', spice: 'lively', lead: 'brass' }],
		['sea-beast', 'Beast of the Sea', { mode: 'phrygian', spice: 'lively', lead: 'mallet' }],
		['babylon-whore', 'Whore of Babylon', { mode: 'dorian', spice: 'gentle', lead: 'flute' }],
		['babylon-falls', 'Babylon Falls', { mode: 'minor', spice: 'lively', lead: 'keys' }],
		['new-jerusalem', 'New Jerusalem', { mode: 'lydian', spice: 'gentle', lead: 'kalimba' }]
	],
	draw
};
