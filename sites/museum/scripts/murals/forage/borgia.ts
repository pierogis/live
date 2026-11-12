// Codex Borgia (central Mexico, before 1500).
import { points, SIDES, type Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 34;
const PH = 32;

const SELF = Object.fromEntries([...'WKRYOTGBSDAPLM'].map((k) => [k, k]));

const CROCODILE = [
	'...KKKKK.',
	'..KGTGTGK',
	'.KGGKWKGK',
	'KGGGKKKGK',
	'KKKKKKGGK',
	'KWKWKWKGK',
	'KRRRRRKGK',
	'.KKKKKKK.'
];
const WIND = [
	'...KKKK..',
	'..KYKYK..',
	'.KKKKKKK.',
	'.KKWKKKK.',
	'KRRKKKKWK',
	'KRRRKKKWK',
	'.KRRKKKK.',
	'..KK.KK..'
];
const HOUSE = [
	'.KKKKKKK.',
	'KYKYKYKYK',
	'KKKKKKKKK',
	'.KRRRRRK.',
	'.KRKKKRK.',
	'.KRKTKRK.',
	'.KRKKKRK.',
	'.KKKKKKK.'
];
const SERPENT = [
	'..KKK....',
	'.KYWK....',
	'.KYYK....',
	'..KYK.KK.',
	'.KYKKKYYK',
	'KYRYRYRYK',
	'KRYRYRYK.',
	'.KKKKKK..'
];
const DEATH = [
	'.KKKKKK..',
	'KWWWWWWK.',
	'KWKKWWWWK',
	'KWKKWKWWK',
	'KWWWWWWWK',
	'KKWKWKWK.',
	'.KWKWKWK.',
	'..KKKKK..'
];
const DEER = [
	'.K.K.....',
	'.KKK.KK..',
	'..KKKSK..',
	'..KSSSKK.',
	'.KSWKSSSK',
	'KSSSSSSK.',
	'KKSSSSK..',
	'.KKKKK...'
];
const RABBIT = [
	'.KK.KK...',
	'.KWKKWK..',
	'.KWKKWK..',
	'..KWWWWK.',
	'.KWKWWWWK',
	'KWWWWWWWK',
	'KPWWWWKK.',
	'.KKKKK...'
];
const WATER = [
	'KKKKKKKK.',
	'KBLBLBLBK',
	'KBBBBBBBK',
	'KLBLBLBLK',
	'.KKKKKKK.',
	'KWK.KGK..',
	'KWK.KGK..',
	'.K...K...'
];
const MONKEY = [
	'..KKKKK..',
	'.KRKKKKK.',
	'KSSKWKSK.',
	'KSSSSSSK.',
	'KSSKKSSSK',
	'.KSSSSSK.',
	'..KRRRK..',
	'...KKK...'
];
const REED = [
	'..K.K.K..',
	'.KYKYKYK.',
	'.KGKGKGK.',
	'.KGKGKGK.',
	'KRRRRRRRK',
	'.KGKGKGK.',
	'.KGKGKGK.',
	'..KKKKK..'
];
const MOVEMENT = [
	'KK.....KK',
	'KRK...KYK',
	'.KRK.KYK.',
	'..KKWKK..',
	'..KKKKK..',
	'.KYK.KRK.',
	'KYK...KRK',
	'KK.....KK'
];
const FLINT = [
	'....KKKK.',
	'...KRWWWK',
	'..KRRWWK.',
	'.KRKWRK..',
	'KWRRRK...',
	'KWRKK....',
	'KWWK.....',
	'.KK......'
];

const SERPENT_HEAD = [
	'...KK.KK.KK........',
	'..KGTKGTKRYK.......',
	'..KGTKGTKRYKK......',
	'.KKKKKKKKKKKKKK..KK',
	'KGGGGGGGGGGGGGGKKYK',
	'KGGKKKKGGTGGTGGGKYK',
	'KGKWWWKGGGGGGGGGKK.',
	'KGKWKKKGGGGGGGKKGK.',
	'KGGKKKGGGGGGGGGGGK.',
	'KGGGGGGKKKKKKKKKKK.',
	'KGGGGGKWKWKWKWKWK..',
	'KGGGGKRRRRRRRRRRRRR',
	'KGGGKRRRRRRRRRRK.R.R',
	'KYYYYKRRRRRRKK.....',
	'KYYYYYKWKWKWK......',
	'.KKYYYYYYYYYK......',
	'...KKKKKKKKK.......'
];
const TEZ = [
	'.....KKKKKKKKKK.........',
	'....KRWRWRWRWRK.........',
	'...KKKKKKKKKKKKKK.......',
	'..KYYYYYYYYYYKBBBK......',
	'.KKKKKKKKKKKKKBLBK......',
	'KYWKYYYYYYYYKKBBBK......',
	'KKKKKKKKKKKKKKKKK.......',
	'.KYYYYYYYYKTTK..........',
	'..KRRYYYYKTKTK..........',
	'..KKKYYYYKTTK...........',
	'....KKKKKKKKK...........',
	'...KKSSTTSSSSKK.........',
	'..KSSSTRRTSSSSSK........',
	'.KSSKSSTTSSSKSSSK.......',
	'KSSK.KSSSSSSK.KSSK......',
	'KYK..KSSSSSSK..KYK......',
	'KSK.KWRWRWRWRK.KSK......',
	'.K..KWWWWWWWWK..K.......',
	'....KRWKSSKKSSK.........',
	'....KWRKSSK.KSSK........',
	'....KRWKYYK..KYYK.......',
	'.....KKKSSK...KSSK......',
	'........KSSK...KSSK.....',
	'.....KKKKSSK....KKK.....',
	'....KDDDDDDK............',
	'....KKKKKKKK............'
];
const TLALOC = [
	'.....KKKKKKKKKK.......',
	'....KWGWGWGWGWGK......',
	'...KKKKKKKKKKKKKK.....',
	'..KBBBKKKKKKBBBBK.....',
	'..KBBKTTTTTTKBBBK.....',
	'..KBKTKKKKKTKBBBK.....',
	'..KBKTKWWKKTKBBKK.....',
	'..KBKTKWKKKTKBKTTK....',
	'..KBBKTTTTTKBBKTTK....',
	'.KKKKKKKKKKKBBBKKK....',
	'KTTTTTTTTTTKBBBK......',
	'KTKKKKKKKKTKBBBK......',
	'KTKRRRRRRKKBBBK.......',
	'.KKWKRRKWKBBBK........',
	'..KWK.KKWKKKKK........',
	'...K....KKBBBBK.......',
	'....KKKBBBTTBBBK......',
	'...KBBBBBTRRTBBBK.....',
	'..KBBKBBBBTTBBKBBK....',
	'.KBBK.KBBBBBBBK.KBBK..',
	'.KYK..KWRWRWRWK..KYK..',
	'.KBK.KWWWWWWWWWK.KBK..',
	'..K..KBBBBBBBBBK..K...',
	'.....KBBBBBBBBBBK.....',
	'.....KBBBBBBBBDDDK....',
	'.....KKKKKKKKKKKKK....'
];
const JAG_HEAD = [
	'.KK...KK....',
	'KRYK.KRYK...',
	'KYYKKKYYYK..',
	'KYYYYYYYYYK.',
	'KYKYYKWWKYK.',
	'KYYYYKWKKYYK',
	'KYKYYYKKYYYK',
	'KYYYYYYYYKKK',
	'KYYYYKWKWKRK',
	'.KYYKRRRRRRK',
	'.KYYYKWKWKK.',
	'..KKKKKKKK..'
];
const PRIEST = [
	'.KKK..',
	'KKKKK.',
	'KKSWK.',
	'.KSSK.',
	'KRRRRK',
	'KRRKYK',
	'KRRRRK',
	'.KSKS.',
	'.KDKD.'
];
const SUN_FACE = [
	'..KKKKK..',
	'.KOOOOOK.',
	'KOKWOKWOK',
	'KOKKOKKOK',
	'KOOOROOOK',
	'KOKRRRKOK',
	'KOOKWKOOK',
	'.KOOOOOK.',
	'..KKKKK..'
];
const MICTLAN = [
	'.KKK..KK.KK.KK..............',
	'KWRWKKKKKKKKKKKKK...........',
	'KWRWKKKWWWWWWWWWKK..........',
	'.KKKKKWWWWWWWWWWWWK.........',
	'KWRKKWWWWWWKKKKWWWWK........',
	'KKKKKWWWWWKKWWKKWWWK........',
	'.KWRKWWWWWKKWRKKWWWWK.......',
	'KKKKKWWWWWWKKKKWWWWWK.......',
	'.KKKKWWWWWWWWWWWKKWWK.......',
	'..KKKWWWWWWWWWWWWWWWK.......',
	'...KKWWKWKWKWKWKWKWK........',
	'....KKWKWKWKWKWKWKK...KK.KK.',
	'.....KKKKKKKKKKKKK...KWKKWK.',
	'......KWWWWWWWWK...KWWWWWK..',
	'......KKKKKKKKKWKKKWWWKKK...',
	'......KWWWWWWWKWWWWKKK......',
	'......KKKKKKKKKKKKKK........',
	'......KWWWWWWWK.............',
	'.....KKRRDDDDKK.............',
	'...KKWKRDDDK.KKWK...........',
	'..KWWK.KDDK..KWWWK..........',
	'.KWWK...KK....KWWK..........',
	'KKKK..........KKKK..........'
];
const CROC_HEAD = [
	'......KKKKKKK',
	'....KKGGTGGGG',
	'..KKGGGGKKGGG',
	'KKGGGGGKWKKGG',
	'KGGKGGGGKKGGG',
	'KGGGGGGGGGGGG',
	'KKKKKKKKKKKGG',
	'.KWKWKWKWKKGG',
	'..K.K.K.K.KRR'
];
const WATER_GODDESS = [
	'....KK.KK.KK.KK.......',
	'...KWWKTTKWWKTTK......',
	'..KKKKKKKKKKKKKKK.....',
	'..KYYBYYBYYBYYBYK.....',
	'..KKKKKKKKKKKKKKKKK...',
	'...KSSSSSSKKKKKKKKWK..',
	'..KSSWKSSSKTTKKKWWK...',
	'.KSSSKKSSSKTKTKKWWK...',
	'KSSSSSSSSSKTTKKWWK....',
	'.KSSYYSSSSKKKKWWK.....',
	'..KRSSSSSK.KKKKK......',
	'...KKSSSKK............',
	'....KGTGTGK...........',
	'...KRRRRRRRRK.........',
	'..KSKWWWWWWRWK........',
	'.KSK.KRRRRRRRK........',
	'KYK...KWWWWWWK........',
	'KSK..KTTTTTTTTK.......',
	'.K..KTGTGTGTGTTK......',
	'....KTTTTTTTTTTTK.....',
	'...KGTGTGTGTGTGTTK....',
	'...KWWWKWWWKWWWKWWK...',
	'...KKKKKKKKKKKKKKK....'
];
const CONCH = [
	'..KKK..',
	'.KWWWK.',
	'KWPPWWK',
	'KWPPPWK',
	'.KWPPWK',
	'.KWWPWK',
	'..KWWK.',
	'...KK..'
];
const JAR = [
	'.KKKKK.',
	'.KWWWK.',
	'..KBK..',
	'.KBBBK.',
	'KBGBGBK',
	'KBBBBBK',
	'.KBBBK.',
	'..KKK..'
];
const SKULL = ['.KKKKK.', 'KWWWWWK', 'KKKWKKK', 'KKKWKKK', 'KWWKWWK', '.KWKWK.', '..KKK..'];
const VULTURE = [
	'..KKK.....',
	'.KROK.....',
	'KWKRK.....',
	'.KKKKKK...',
	'..KMKMKKK.',
	'..KKMKMKMK',
	'...KMKMKMK',
	'....KKKKK.',
	'....KY.KY.'
];

function draw(c: Canvas) {
	const { put, rect, disk, line, dots, stamp, leaf } = c;
	const art = (p: string[], x: number, y: number, flip = false) => stamp(p, x, y, SELF, flip);

	const panel = (col: number, row: number) => {
		c.at(col * PW, row * PH);
		c.clip(0, 0, PW - 1, PH - 1);
	};
	const free = () => {
		c.at();
		c.clip();
	};

	const ink = (fn: () => void) => {
		const g = c.g;
		const before = g.map((r) => r.slice());
		for (const r of g) r.fill('_');
		fn();
		const mask = g.map((r) => r.map((k) => k !== '_'));
		const painted = (x: number, y: number) => mask[y][x];
		for (let y = 0; y < c.h; y++) {
			for (let x = 0; x < c.w; x++) if (!painted(x, y)) g[y][x] = before[y][x];
		}
		const todo: [number, number][] = [];
		for (let y = 0; y < c.h; y++) {
			for (let x = 0; x < c.w; x++) {
				if (!painted(x, y) || g[y][x] === 'K') continue;
				for (const [dx, dy] of SIDES) {
					const nx = x + dx;
					const ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= c.w || ny >= c.h || painted(nx, ny)) continue;
					const n = g[ny][nx];
					if (n !== 'K') todo.push(n === 'W' ? [nx, ny] : [x, y]);
				}
			}
		}
		for (const [x, y] of todo) g[y][x] = 'K';
	};

	const tube = (
		keys: [number, number][],
		r: (i: number, n: number) => number,
		paint: (i: number, side: number, d: number) => string
	) => {
		const path: [number, number][] = [];
		for (let k = 0; k < keys.length - 1; k++) {
			const [x0, y0] = keys[k];
			const [x1, y1] = keys[k + 1];
			for (let i = 0; i < 8; i++) path.push([x0 + ((x1 - x0) * i) / 8, y0 + ((y1 - y0) * i) / 8]);
		}
		path.push(keys[keys.length - 1]);
		const xs = path.map((p) => p[0]);
		const ys = path.map((p) => p[1]);
		for (let y = Math.floor(Math.min(...ys)) - 4; y <= Math.max(...ys) + 4; y++) {
			for (let x = Math.floor(Math.min(...xs)) - 4; x <= Math.max(...xs) + 4; x++) {
				let best = 99;
				let bi = 0;
				path.forEach(([bx, by], i) => {
					const d = Math.hypot(x - bx, y - by);
					if (d < best) {
						best = d;
						bi = i;
					}
				});
				if (best > r(bi, path.length)) continue;
				const [bx, by] = path[bi];
				const [nx, ny] = path[Math.min(bi + 1, path.length - 1)];
				const [px, py] = path[Math.max(bi - 1, 0)];
				const side = (nx - px) * (y - by) - (ny - py) * (x - bx);
				put(x, y, paint(bi, side, best));
			}
		}
		return path;
	};

	free();
	let spine: [number, number][] = [];
	ink(() => {
		spine = tube(
			[
				[12, 13],
				[7, 15],
				[4, 20],
				[6, 25],
				[14, 27],
				[24, 25],
				[32, 26],
				[38, 27],
				[42, 25]
			],
			(i, n) => 2.6 - Math.max(0, i - n + 18) * 0.1,
			(i, side, d) => (side > 0.8 ? (i % 4 === 0 ? 'R' : 'Y') : i % 3 === 0 && d > 1.2 ? 'T' : 'G')
		);
	});
	for (let i = 4; i < spine.length - 6; i += 6) {
		const [bx, by] = spine[i];
		const [nx, ny] = spine[i + 1];
		const a = Math.atan2(ny - by, nx - bx) - Math.PI / 2 - 0.5;
		ink(() =>
			leaf(bx + Math.cos(a) * 3, by + Math.sin(a) * 3, a, 4, i % 12 ? 'G' : 'R', i % 12 ? 'T' : 'Y')
		);
	}
	ink(() => {
		dots('Y', [43, 25], [44, 24], [45, 24]);
		dots('R', [44, 25], [45, 25]);
	});
	ink(() => leaf(45, 23, -1.9, 5, 'G', 'T'));
	panel(0, 0);
	art(SERPENT_HEAD, 11, 3);
	for (const [x, y, k] of [
		[5, 6, 'G'],
		[29, 21, 'Y'],
		[22, 21, 'G'],
		[31, 5, 'R'],
		[16, 22, 'Y'],
		[6, 10, 'R']
	] as const)
		ink(() => put(x, y, k));

	panel(1, 0);
	for (const d of [0, 3]) {
		line(14 + d, 25, 5 + d, 7, 'D');
		ink(() => dots('R', [5 + d, 6], [4 + d, 5]));
	}
	const feather = (x: number, y: number) => Math.floor(Math.atan2(y - 9, x - 23) * 2.2 + 9) % 2;
	ink(() => {
		disk(23, 9, 7, 'Y', (x) => x >= 21);
		disk(23, 9, 5.8, 'G', (x, y) => x >= 21 && feather(x, y) === 0);
		disk(23, 9, 5.8, 'T', (x, y) => x >= 21 && feather(x, y) === 1);
		disk(23, 9, 2.5, 'R', (x) => x >= 21);
	});
	art(TEZ, 9, 4);
	ink(() => {
		disk(8, 19, 3.6, 'W');
		disk(8, 19, 1.7, 'T');
		put(8, 19, 'R');
	});
	ink(() => {
		disk(28, 28, 1.8, 'B');
		put(28, 28, 'W');
	});
	ink(() => {
		dots('A', [30, 26], [31, 25], [31, 24], [30, 23], [29, 22], [29, 21], [30, 20]);
		dots('Y', [31, 21], [28, 23]);
	});

	panel(2, 0);
	ink(() => {
		for (const [a, k] of [
			[-1.9, 'W'],
			[-1.5, 'G'],
			[-1.1, 'W'],
			[-0.7, 'G']
		] as const)
			leaf(17, 5, a, 7, k);
	});
	ink(() => {
		for (let y = 12; y < 20; y++) for (let x = 22; x < 27; x++) put(x, y, x % 2 ? 'W' : 'R');
	});
	art(TLALOC, 6, 4);
	ink(() => {
		for (let y = 7; y < 28; y++) {
			const x = 2 + Math.abs((y % 6) - 3);
			put(x, y, 'Y');
			put(x + 1, y, y % 3 ? 'Y' : 'R');
		}
		rect(2, 4, 4, 6, 'R');
	});
	put(3, 5, 'W');
	ink(() => {
		disk(27, 23, 2.5, 'O');
		line(25, 23, 29, 23, 'W');
	});
	ink(() => {
		for (let y = 26; y < 30; y++) put(29, y, 'L');
		dots('L', [30, 24], [30, 25]);
	});
	for (let x = 0; x < PW; x++) {
		for (let y = 3; y < 30; y++) {
			const k = x % 4 === 1 && y % 4 < 2 ? 'B' : x % 4 === 3 && (y + 2) % 4 < 2 ? 'L' : '';
			if (!k) continue;
			const open = [[0, 0], ...SIDES].every(([dx, dy]) => c.get(x + dx, y + dy) === 'W');
			if (open) put(x, y, k);
		}
	}

	const signs = [
		[CROCODILE, 1],
		[WIND, 2],
		[HOUSE, 3],
		[SERPENT, 5],
		[DEATH, 6],
		[DEER, 7],
		[RABBIT, 8],
		[WATER, 4],
		[MONKEY, 3],
		[REED, 6],
		[MOVEMENT, 7],
		[FLINT, 2]
	] as const;
	free();
	const DOT = ['Y', 'G', 'T', 'R'];
	const rowsY = [3, 12, 21, 31, 41, 51, 61];
	for (let r = 0; r < 6; r++) {
		const y0 = rowsY[r];
		const y1 = rowsY[r + 1];
		for (let k = 0; k < 2; k++) {
			const x0 = 104 + k * 14;
			rect(x0, y0, x0 + 14, y1, 'R');
			rect(x0 + 1, y0 + 1, x0 + 13, y1 - 1, 'W');
			const [sign, n] = signs[r * 2 + k];
			art(sign, x0 + 1, y0 + 1);
			for (let i = 0; i < n; i++)
				put(x0 + 11 + (i % 2) * 2, y0 + 1 + Math.floor(i / 2) * 2, DOT[(3 * r + k) % 4]);
		}
	}

	panel(0, 1);
	ink(() => {
		c.ell(16, 14, 10, 5, 'Y');
		for (let k = 0; k < 14; k++) {
			const a = (k / 14) * Math.PI * 1.4;
			disk(6 - Math.sin(a) * 2.5, 13 - k * 0.65, 1, 'Y');
		}
	});
	for (const x of [8, 13, 20, 25]) {
		ink(() => {
			rect(x, 18, x + 2, 25, 'Y');
			dots('W', [x - 1, 26], [x + 1, 26], [x + 3, 26]);
		});
	}
	for (let y = 10; y < 25; y += 4) {
		for (let x = 7 + (y % 8 === 2 ? 2 : 0); x < 28; x += 4) {
			const ring: [number, number][] = [
				[x + 1, y],
				[x - 1, y],
				[x, y + 1],
				[x, y - 1]
			];
			if (ring.some(([rx, ry]) => c.get(rx, ry) !== 'Y')) continue;
			dots('K', ...ring);
			put(x, y, 'O');
		}
	}
	art(JAG_HEAD, 22, 4);
	for (const [x, y] of [
		[13, 4],
		[18, 6],
		[9, 3]
	]) {
		ink(() => put(x, y, 'W'));
		put(x, y, 'R');
	}

	panel(1, 1);
	ink(() => {
		for (let t = 0; t < 4; t++)
			rect(4 + t * 2, 26 - t * 2, 31 - t * 2, 28 - t * 2, t % 2 ? 'R' : 'W');
		rect(14, 18, 21, 28, 'W');
	});
	for (let y = 19; y < 29; y += 2) line(14, y, 21, y, 'K');
	ink(() => {
		rect(10, 10, 25, 18, 'R');
		rect(14, 12, 21, 18, 'K');
		rect(9, 6, 26, 9, 'Y');
		for (let x = 9; x <= 26; x += 3) rect(x, 3, x + 1, 4, 'W');
	});
	for (let x = 10; x < 26; x += 2) dots('K', [x, 7], [x + 1, 8]);
	for (let x = 15; x < 21; x++) put(x, 12, x % 2 ? 'G' : 'T');
	for (let y = 12; y < 18; y += 4) dots('W', [11, y], [24, y]);
	art(PRIEST, 1, 16);
	for (const x of [5, 29]) {
		ink(() => rect(x - 1, 23, x + 1, 24, 'D'));
		ink(() => dots('O', [x, 22], [x - 1, 21], [x + 1, 21]));
		put(x, 21, 'R');
	}
	ink(() => dots('A', [28, 10], [29, 9], [29, 8], [28, 7], [28, 6], [29, 5], [30, 4]));
	ink(() => dots('A', [6, 10], [5, 9], [5, 8], [6, 7], [6, 6], [5, 5], [4, 4]));

	panel(2, 1);
	ink(() => {
		for (let k = 0; k < 16; k++) {
			const a = (k / 16) * Math.PI * 2 + 0.2;
			c.oval(18 + Math.cos(a) * 10, 13 + Math.sin(a) * 10, 2, 1, a, k % 2 ? 'Y' : 'O');
		}
		disk(18, 13, 8.5, 'R');
		disk(18, 13, 6.5, 'Y');
	});
	for (let k = 0; k < 12; k++) {
		const a = (k / 12) * Math.PI * 2;
		put(18 + Math.cos(a) * 7.6, 13 + Math.sin(a) * 7.6, 'G');
	}
	art(SUN_FACE, 14, 9);
	ink(() => {
		tube(
			[
				[8, 25],
				[6, 21],
				[8, 18],
				[11, 18]
			],
			() => 1,
			(i) => (i % 6 === 3 ? 'Y' : 'R')
		);
	});
	ink(() => {
		c.ell(5, 27, 3.5, 1.6, 'A');
		dots('W', [4, 27], [6, 26], [2, 27]);
		dots('O', [3, 29], [6, 29]);
	});
	for (const [x, y] of [
		[22, 27],
		[27, 25],
		[16, 27]
	]) {
		ink(() => dots('R', [x, y], [x - 1, y], [x + 1, y], [x, y - 1]));
		put(x, y, 'Y');
		ink(() => put(x, y + 2, 'G'));
	}

	panel(1, 2);
	ink(() => {
		tube(
			[
				[13, 14],
				[20, 15],
				[26, 13],
				[29, 9],
				[28, 5]
			],
			(i, n) => 4 - (i / n) * 3,
			(i, side, d) => (side > 2 ? 'Y' : (i + Math.round(d)) % 3 === 0 ? 'T' : 'G')
		);
		for (const x of [15, 23]) rect(x, 17, x + 2, 21, 'G');
	});
	for (let x = 13; x < 27; x += 3)
		ink(() => put(x, Math.round(10 + Math.abs(x - 20) * 0.1) - (x > 24 ? 2 : 0), 'R'));
	art(CROC_HEAD, 2, 8);

	free();
	const top = (x: number) =>
		x < 34 ? 90 : x < 40 ? 90 - (x - 34) : x < 62 ? 84 : x < 70 ? 84 + (x - 62) / 2 : 88;
	ink(() => {
		for (let x = 3; x < 92; x++) {
			for (let y = Math.round(top(x)); y < 93; y++) {
				const r = (92 - y) % 3;
				const wave = r === 1 || (r === 2 && (x + y) % 8 === 0);
				put(x, y, wave ? 'L' : r === 0 && x % 12 === (y % 2) * 6 ? 'T' : 'B');
			}
		}
	});
	for (let x = 6; x < 86; x += 6) {
		const y = Math.round(top(x)) - 2;
		if (x > 64 && x < 70) continue;
		ink(() => put(x, y, (x / 6) % 2 ? 'W' : 'G'));
	}
	for (const [x, y] of [
		[44, 88],
		[56, 90],
		[24, 91]
	]) {
		dots('O', [x, y], [x + 1, y], [x + 2, y - 1], [x + 2, y + 1]);
		put(x, y, 'K');
	}

	panel(0, 2);
	disk(7, 8, 5, 'K');
	disk(5, 14, 3.5, 'K');
	for (const [x, y] of points('5,5 8,3 3,9 6,12 4,16')) {
		put(x, y, 'W');
		put(x + 1, y, 'R');
	}
	art(MICTLAN, 5, 2);
	ink(() => {
		c.ell(29, 6, 2.6, 3.5, 'D');
		disk(28, 5, 0.8, 'Y');
		disk(30, 5, 0.8, 'Y');
	});
	dots('K', [28, 5], [30, 5]);
	put(29, 7, 'O');
	for (const [x, y] of points('28,8 30,9')) put(x, y, 'W');
	ink(() => dots('O', [28, 10], [30, 10]));

	panel(2, 2);
	ink(() => {
		rect(19, 12, 23, 24, 'Y');
		rect(14, 20, 23, 24, 'Y');
	});
	dots('O', [21, 14], [20, 17], [22, 20], [19, 23]);
	art(WATER_GODDESS, 4, 2);
	art(CONCH, 26, 10);
	art(JAR, 25, 20);

	panel(3, 2);
	ink(() => rect(0, 25, 30, 28, 'R'));
	for (let x = 2; x < 30; x += 3) dots('W', [x, 27], [x + 1, 27]);
	ink(() => {
		rect(2, 11, 3, 24, 'O');
		rect(27, 11, 28, 24, 'O');
		rect(2, 10, 28, 10, 'O');
		line(4, 14, 26, 14, 'O');
		line(4, 20, 26, 20, 'O');
	});
	for (const y of [12, 18]) for (let k = 0; k < 3; k++) art(SKULL, 4 + k * 8, y);
	ink(() => dots('R', [7, 24], [15, 24], [23, 24]));
	art(VULTURE, 12, 1);
	free();
	const band = (x0: number, y0: number, x1: number, y1: number, across: boolean) => {
		rect(x0, y0, x1, y1, 'K');
		if (across) rect(x0, y0 + 1, x1, y1 - 1, 'R');
		else rect(x0 + 1, y0, x1 - 1, y1, 'R');
	};
	band(0, 30, 101, 33, true);
	band(0, 62, 135, 65, true);
	band(100, 0, 103, 63, false);
	band(66, 64, 69, 85, false);
	rect(0, 0, 135, 2, 'K');
	rect(0, 93, 135, 95, 'K');
	rect(0, 0, 2, 95, 'K');
	rect(133, 0, 135, 95, 'K');
	rect(0, 0, 135, 1, 'R');
	rect(0, 94, 135, 95, 'R');
	rect(0, 0, 1, 95, 'R');
	rect(134, 0, 135, 95, 'R');
}

export const borgia: Mural = {
	file: 'codex-borgia',
	name: 'Codex Borgia',
	prefix: 'codex-borgia',
	notes: 'F#',
	cols: 4,
	difficulty: 0.95,
	panel: [PW, PH],
	palette: {
		W: '#efe6cf',
		K: '#1b1714',
		R: '#c42a20',
		Y: '#f0c22a',
		O: '#e47a24',
		T: '#34b3aa',
		G: '#1d6e4a',
		B: '#2f5fa6',
		L: '#8ec7e6',
		S: '#c98a5e',
		D: '#5b301c',
		A: '#8f8a84',
		P: '#ee9fae',
		M: '#7e3b8c'
	},
	ground: 'W',
	panels: [
		[
			'feathered-serpent',
			'Feathered Serpent',
			{ mode: 'minor-pentatonic', spice: 'lively', lead: 'flute' }
		],
		['smoking-mirror', 'Smoking Mirror', { mode: 'phrygian', spice: 'adventurous', lead: 'brass' }],
		['rain-god', 'Rain God', { mode: 'pentatonic', spice: 'lively', lead: 'kalimba' }],
		['first-days', 'First Days', { mode: 'dorian', spice: 'gentle', lead: 'mallet' }],
		['jaguar', 'The Jaguar', { mode: 'minor-pentatonic', spice: 'lively', lead: 'pizz' }],
		['temple', 'The Temple', { mode: 'harmonic', spice: 'gentle', lead: 'string' }],
		['blood-sun', 'Blood for the Sun', { mode: 'pentatonic', spice: 'adventurous', lead: 'brass' }],
		['counted-days', 'Counted Days', { mode: 'minor-pentatonic', spice: 'gentle', lead: 'vibes' }],
		['lord-of-dead', 'Lord of the Dead', { mode: 'phrygian', spice: 'lively', lead: 'string' }],
		['earth-crocodile', 'Earth Crocodile', { mode: 'minor', spice: 'lively', lead: 'mallet' }],
		['water-goddess', 'Water Goddess', { mode: 'pentatonic', spice: 'gentle', lead: 'harp' }],
		['skull-rack', 'Skull Rack', { mode: 'harmonic', spice: 'adventurous', lead: 'keys' }]
	],
	draw
};
