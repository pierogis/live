// Giancarlo Mola, after Guna molas (Guna Yala, Panama).
import { div, inell, mod, points, type Canvas } from '../canvas.ts';
import type { Mural } from '../mural.ts';

const PW = 30;
const PH = 28;
const COLS = 4;

interface Shape {
	box: [x0: number, y0: number, x1: number, y1: number];
	has(x: number, y: number): boolean;
}
type Coat = (x: number, y: number, d: number, u: number, v: number) => string;
interface Pose {
	x: number;
	y: number;
	f?: number;
	s?: number;
	a?: number;
}
interface Fig {
	shape: Shape;
	coat: Coat;
	bands: string;
	back: (x: number, y: number) => [number, number];
}
type Line = [u0: number, v0: number, u1: number, v1: number];
interface Face {
	eyes?: [u: number, v: number, rings: string][];
	dots?: [u: number, v: number, c: string][];
	lines?: [...Line, string][];
}
type Kind = 'head' | 'body' | 'chest' | 'leg' | 'tail' | 'white';
interface Cat {
	parts: [Shape, Kind, number?, number?][];
	face: Face;
}

const poly = (list: string): Shape => {
	const p = points(list);
	const xs = p.map((q) => q[0]);
	const ys = p.map((q) => q[1]);
	return {
		box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
		has(x, y) {
			let inside = false;
			for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
				const [xi, yi] = p[i];
				const [xj, yj] = p[j];
				if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
			}
			return inside;
		}
	};
};
const oval = (cx: number, cy: number, rx: number, ry = rx, a = 0): Shape => {
	const r = Math.max(rx, ry);
	const ca = Math.cos(a);
	const sa = Math.sin(a);
	return {
		box: [cx - r, cy - r, cx + r, cy + r],
		has(x, y) {
			const u = (x - cx) * ca + (y - cy) * sa;
			const v = -(x - cx) * sa + (y - cy) * ca;
			return inell(u, v, 0, 0, rx, ry);
		}
	};
};
const limb = (x0: number, y0: number, x1: number, y1: number, w = 1.4): Shape => ({
	box: [Math.min(x0, x1) - w, Math.min(y0, y1) - w, Math.max(x0, x1) + w, Math.max(y0, y1) + w],
	has(x, y) {
		const dx = x1 - x0;
		const dy = y1 - y0;
		const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy || 1)));
		return Math.hypot(x - x0 - t * dx, y - y0 - t * dy) <= w;
	}
});
const or = (...rs: Shape[]): Shape => ({
	box: [
		Math.min(...rs.map((r) => r.box[0])),
		Math.min(...rs.map((r) => r.box[1])),
		Math.max(...rs.map((r) => r.box[2])),
		Math.max(...rs.map((r) => r.box[3]))
	],
	has: (x, y) => rs.some((r) => r.has(x, y))
});
const chain = (w: number, ...pts: number[]) =>
	or(
		...Array.from({ length: pts.length / 2 - 1 }, (_, k) =>
			limb(pts[2 * k], pts[2 * k + 1], pts[2 * k + 2], pts[2 * k + 3], w)
		)
	);
const head = (hx: number, hy: number, rx: number, ry: number, ear: number) =>
	or(
		oval(hx, hy, rx, ry),
		poly(
			`${hx - rx * 0.98},${hy - ry * 0.2} ${hx - rx * 0.78},${hy - ry - ear} ${hx - rx * 0.12},${hy - ry * 0.86}`
		),
		poly(
			`${hx + rx * 0.98},${hy - ry * 0.2} ${hx + rx * 0.78},${hy - ry - ear} ${hx + rx * 0.12},${hy - ry * 0.86}`
		)
	);
const brow = (hx: number, hy: number, w: number): [...Line, string][] => [
	[hx - w, hy + 0.8, hx - w / 2, hy, 'D'],
	[hx - w / 2, hy, hx, hy + 0.8, 'D'],
	[hx, hy + 0.8, hx + w / 2, hy, 'D'],
	[hx + w / 2, hy, hx + w, hy + 0.8, 'D']
];

const DOTS = 'YWBGLO';
const SLITS = 'YWBGLOVY';

function draw(c: Canvas) {
	const figs: Fig[] = [];
	const after: (() => void)[] = [];
	let ox = 0;
	let oy = 0;
	const panels: number[] = [];
	const panel = (k: number, g: number) => {
		ox = (k % COLS) * PW;
		oy = div(k, COLS) * PH;
		panels[k] = g;
	};

	const place = (pose: Pose) => {
		const p = { f: 1, s: 1, a: 0, ...pose, x: pose.x + ox, y: pose.y + oy };
		const ca = Math.cos(p.a);
		const sa = Math.sin(p.a);
		const back = (x: number, y: number): [number, number] => {
			const dx = (x - p.x) / p.s;
			const dy = (y - p.y) / p.s;
			return [p.f * (dx * ca + dy * sa), -dx * sa + dy * ca];
		};
		const fwd = (u: number, v: number): [number, number] => {
			const du = p.f * u;
			return [p.x + p.s * (du * ca - v * sa), p.y + p.s * (du * sa + v * ca)];
		};
		return { back, fwd };
	};

	const fig = (pose: Pose, local: Shape, coat: Coat, bands: string) => {
		const { back, fwd } = place(pose);
		const [u0, v0, u1, v1] = local.box;
		const pts = [fwd(u0, v0), fwd(u1, v0), fwd(u0, v1), fwd(u1, v1)];
		const xs = pts.map((q) => q[0]);
		const ys = pts.map((q) => q[1]);
		figs.push({
			shape: {
				box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
				has: (x, y) => local.has(...back(x, y))
			},
			coat,
			bands,
			back
		});
	};

	const face = (pose: Pose, { eyes = [], dots = [], lines = [] }: Face) => {
		const { fwd } = place(pose);
		after.push(() => {
			for (const [u0, v0, u1, v1, col] of lines) c.line(...fwd(u0, v0), ...fwd(u1, v1), col);
			for (const [u, v, col] of dots) {
				const [x, y] = fwd(u, v);
				c.put(Math.round(x), Math.round(y), col);
			}
			for (const [u, v, rings] of eyes) {
				const [x, y] = fwd(u, v).map(Math.round);
				const n = rings.length - 1;
				for (let dy = -n; dy <= n; dy++)
					for (let dx = -n; dx <= n; dx++)
						c.put(x + dx, y + dy, rings[Math.max(Math.abs(dx), Math.abs(dy))]);
			}
		});
	};

	const grid: Coat = (x, y, d) =>
		d < 1.5
			? 'O'
			: mod(x, 2) === 0 && mod(y, 2) === 0
				? DOTS[mod(div(x, 2) * 2 + div(y, 2) * 3, DOTS.length)]
				: 'R';

	const tabby = (cat: Cat, belly: number): Coat => {
		return (_x, _y, d, u, v) => {
			if (d < 1.5) return 'D';
			const hit = cat.parts.find(([s]) => s.has(u, v));
			if (!hit) return 'C';
			const [, kind, bu = 0, bv = 0] = hit;
			const rv = Math.round(v);
			switch (kind) {
				case 'white':
					return 'W';
				case 'head':
					return 'C';
				case 'leg':
					return v > bv ? 'W' : mod(rv, 3) === 0 ? 'D' : 'C';
				case 'tail':
					return mod(Math.round(Math.hypot(u - bu, v - bv)), 3) === 0 ? 'D' : 'C';
				case 'chest':
					if (Math.abs(u) < 2.4 && v > belly) return 'O';
					if (Math.abs(u) < 2.4 && v < bu) return 'W';
					return mod(rv, 3) === 0 ? 'D' : 'C';
				default:
					if (v > belly) return 'O';
					return mod(Math.round(u + 0.4 * v), 3) === 0 || v < bv ? 'D' : 'C';
			}
		};
	};

	const cat = (pose: Pose, k: Cat, belly: number, bands = 'OVVY') =>
		fig(pose, or(...k.parts.map(([s]) => s)), tabby(k, belly), bands);
	const giancarlo = (pose: Pose, k: Cat, belly: number, bands?: string) => {
		cat(pose, k, belly, bands);
		face(pose, k.face);
	};

	const front = (): Cat => ({
		parts: [
			[head(0, -6, 5.2, 4, 3.6), 'head'],
			[or(limb(-2.2, 4, -2.4, 10.2), limb(2.2, 4, 2.4, 10.2)), 'leg', 0, 9.2],
			[oval(0, 3.6, 5.6, 6.4), 'chest', 0.5, 5],
			[oval(0, 9.6, 7.4, 1.8), 'body', 0, -9],
			[chain(1.3, 6, 9.5, 9.5, 8, 10, 3, 8.5, 0), 'tail', 6, 9.5]
		],
		face: {
			eyes: [
				[-2.2, -6.6, 'DY'],
				[2.2, -6.6, 'DY']
			],
			dots: [
				[0, -4.4, 'N'],
				[0, -3, 'W'],
				[-1, -3, 'W'],
				[1, -3, 'W']
			],
			lines: [
				...brow(0, -9.6, 2.4),
				[1.6, -3.8, 8, -5, 'W'],
				[1.6, -3.2, 8, -2, 'W'],
				[-1.6, -3.8, -8, -5, 'W'],
				[-1.6, -3.2, -8, -2, 'W']
			]
		}
	});

	const walk = (): Cat => ({
		parts: [
			[head(10, -5, 4, 3.4, 3.2), 'head'],
			[
				or(
					limb(-6, 1.5, -7, 9.5),
					limb(-3, 2, -3, 9.5),
					limb(4, 2, 4, 9.5),
					limb(6.5, 1, 7.5, 9.5)
				),
				'leg',
				0,
				8.6
			],
			[chain(1.3, -8, -1.5, -10.5, -5, -10, -10), 'tail', -8, -1.5],
			[oval(0, 0, 8.5, 4.2), 'body', 0, -3]
		],
		face: {
			eyes: [[11, -5.6, 'DY']],
			dots: [
				[13.6, -4.2, 'N'],
				[12.8, -2.4, 'W'],
				[13.6, -2.6, 'W']
			],
			lines: [...brow(10.4, -7.6, 1.6), [13, -3.8, 17, -4.8, 'W'], [13, -3.2, 17, -1.8, 'W']]
		}
	});

	const sit = (): Cat => ({
		parts: [
			[head(3, -7.5, 3.8, 3.3, 3), 'head'],
			[limb(3.4, 1, 3.8, 10.2), 'leg', 0, 9.3],
			[or(oval(1.8, 1.5, 3.2, 6.5)), 'chest', -3, 4],
			[or(oval(-2.4, 6, 4.6, 4.6), oval(-0.5, 10.2, 6, 1.4)), 'body', 0, -9],
			[chain(1.3, -5.5, 10, -8.5, 7, -8, 1), 'tail', -5.5, 10]
		],
		face: {
			eyes: [[4.2, -8, 'DY']],
			dots: [
				[6.4, -6.6, 'N'],
				[5.8, -5, 'W']
			],
			lines: [...brow(3.2, -9.8, 1.4), [6, -6, 9.4, -7, 'W'], [6, -5.4, 9.4, -4, 'W']]
		}
	});

	const curl = (): Cat => ({
		parts: [
			[head(7, -1, 3.8, 3.3, 2.8), 'head'],
			[chain(1.3, -9, 2.5, -5, 5.2, 2, 5.6, 7.4, 4), 'tail', -9, 2.5],
			[oval(-1, 0, 9, 4.8), 'body', 0, -3.4]
		],
		face: {
			dots: [
				[9.8, 0.2, 'N'],
				[9.2, 1.6, 'W']
			],
			lines: [
				[6.2, -1.2, 8.4, -1.2, 'D'],
				...brow(7, -3.4, 1.4),
				[10, 1, 13, 0, 'W'],
				[10, 1.6, 13, 3, 'W']
			]
		}
	});

	const crouch = (): Cat => ({
		parts: [
			[head(11, -0.5, 3.8, 3.2, 3), 'head'],
			[
				or(limb(-7, 1, -9, 6), limb(-4, 1.5, -3, 6), limb(4, 1.5, 3, 6), limb(7, 1, 9, 6)),
				'leg',
				0,
				5.2
			],
			[chain(1.3, -9.5, -1, -12, -5, -10, -10), 'tail', -9.5, -1],
			[oval(-1, 0, 9.5, 3.6), 'body', 0, -2.4]
		],
		face: {
			eyes: [[12, -1, 'DY']],
			dots: [
				[14.6, 0.4, 'N'],
				[13.8, 2, 'W']
			],
			lines: [...brow(11.4, -2.9, 1.4), [14, 0.8, 17.5, -0.2, 'W'], [14, 1.4, 17.5, 2.6, 'W']]
		}
	});

	const lie = (): Cat => ({
		parts: [
			[head(10, -6.5, 4.2, 3.6, 3.2), 'head'],
			[or(limb(7, 3, 14, 6), limb(6, 4.5, 13, 8.5)), 'leg', 0, 0],
			[chain(1.3, -10.5, 2, -12.5, 6, -9, 9), 'tail', -10.5, 2],
			[oval(0, 0.5, 11, 6.2), 'body', 0, -4.6]
		],
		face: {
			eyes: [[11.2, -7, 'DY']],
			dots: [
				[13.8, -5.6, 'N'],
				[13, -4, 'W']
			],
			lines: [...brow(10.6, -9.4, 1.6), [13.4, -5, 17, -6, 'W'], [13.4, -4.4, 17, -3, 'W']]
		}
	});

	const leap = (): Cat => ({
		parts: [
			[head(9.5, -4.5, 4, 3.4, 3), 'head'],
			[
				or(limb(-6, 2, -13, 6), limb(-5, 3, -11, 9), limb(6, 1.5, 13, -2), limb(6, 3, 13.5, 3)),
				'leg',
				0,
				99
			],
			[chain(1.3, -8.5, -1, -12, -3.5, -14.5, -1), 'tail', -8.5, -1],
			[oval(0, 0, 9, 3.8), 'body', 0, -2.6]
		],
		face: {
			eyes: [[10.6, -5, 'DY']],
			dots: [
				[13.2, -3.6, 'N'],
				[12.4, -2, 'W']
			],
			lines: [...brow(10, -7, 1.4), [12.6, -3, 16, -4.2, 'W'], [12.6, -2.4, 16, -1, 'W']]
		}
	});

	const stretch = (): Cat => ({
		parts: [
			[head(8.5, 3, 4, 3.4, 3), 'head'],
			[
				or(limb(-7, 1, -9, 11), limb(-4, 2, -5, 11), limb(6, 3, 14, 10), limb(5, 4.5, 12, 11)),
				'leg',
				0,
				10
			],
			[chain(1.3, -9, -4, -11, -8, -9, -12.5), 'tail', -9, -4],
			[oval(-1, -1, 9.5, 4, 0.3), 'body', 0, -3]
		],
		face: {
			eyes: [[9.6, 2.6, 'DY']],
			dots: [
				[12.2, 4, 'N'],
				[11.4, 5.6, 'W']
			],
			lines: [...brow(9, 0.6, 1.4), [11.8, 4.4, 15.4, 3.4, 'W'], [11.8, 5, 15.4, 6.4, 'W']]
		}
	});

	const bigFace = (): Cat => ({
		parts: [
			[oval(0, 9.5, 5, 2.4), 'white'],
			[head(0, 0, 11.5, 9.5, 5), 'head']
		],
		face: {
			eyes: [
				[-4.6, -1, 'DYD'],
				[4.6, -1, 'DYD']
			],
			dots: [
				[-0.5, 3.5, 'N'],
				[0.5, 3.5, 'N'],
				[0, 4.5, 'N']
			],
			lines: [
				...brow(0, -7, 4),
				[-2, -5, -2, -3, 'D'],
				[2, -5, 2, -3, 'D'],
				[0, -6, 0, -3, 'D'],
				[-9, 2, -6.5, 2, 'D'],
				[9, 2, 6.5, 2, 'D'],
				[-9.5, 4.5, -7, 4.5, 'D'],
				[9.5, 4.5, 7, 4.5, 'D'],
				[-2.5, 5.5, -14, 3, 'W'],
				[-2.5, 6.5, -14, 7.5, 'W'],
				[-2.5, 7.5, -13, 11, 'W'],
				[2.5, 5.5, 14, 3, 'W'],
				[2.5, 6.5, 14, 7.5, 'W'],
				[2.5, 7.5, 13, 11, 'W']
			]
		}
	});

	const kitten = (pose: Pose) => {
		const k = front();
		cat(pose, k, 4.8, 'VY');
		face(pose, {
			dots: [
				[-2, -6.6, 'Y'],
				[2, -6.6, 'Y'],
				[0, -4.4, 'N']
			]
		});
	};
	const bird = (pose: Pose, body: string, wing: string) => {
		fig(
			pose,
			or(
				oval(0, 0, 3.6, 2),
				oval(3, -1.6, 1.8),
				poly('-2.4,-0.6 -6,-2.8 -6,1.8'),
				poly('-1.4,-1 2,-1 -2,-5')
			),
			(_x, _y, d, u, v) => (d < 1.5 ? 'O' : v < -1 && u < 2 ? wing : u < -3 ? wing : body),
			'VY'
		);
		face(pose, { dots: [[3.4, -1.8, 'D']] });
	};
	const fish = (pose: Pose, body: string, stripe: string) => {
		fig(
			pose,
			or(oval(0.5, 0, 4, 2.2), poly('-2.4,0 -6,-2.6 -6,2.6')),
			(_x, _y, d, u) => (d < 1.5 ? 'O' : mod(Math.round(u), 2) ? body : stripe),
			'VY'
		);
		face(pose, { dots: [[2.8, -0.6, 'D']] });
	};
	const cushion = (x0: number, y0: number, x1: number, y1: number) =>
		fig(
			{ x: 0, y: 0 },
			oval((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2),
			grid,
			'VY'
		);

	panel(0, 2);
	cushion(3, 21, 27, 27);
	giancarlo({ x: 15, y: 12, s: 0.85 }, front(), 4.8);

	panel(1, 3);
	giancarlo({ x: 13, y: 16, s: 0.75 }, walk(), 1.8);
	bird({ x: 4.5, y: 4.5, s: 0.6 }, 'B', 'L');
	kitten({ x: 25, y: 7, s: 0.5 });

	panel(2, 2);
	cushion(2, 17, 28, 27);
	giancarlo({ x: 14, y: 14, s: 0.95 }, curl(), 2);

	panel(3, 3);
	giancarlo({ x: 8, y: 14, s: 0.78 }, sit(), 4);
	giancarlo({ x: 21, y: 14, f: -1, s: 0.78 }, sit(), 4);

	panel(4, 2);
	giancarlo({ x: 14, y: 13, s: 0.85 }, stretch(), 1.6);
	fish({ x: 24, y: 4, f: -1, s: 0.55 }, 'W', 'B');
	kitten({ x: 25, y: 22, s: 0.5 });

	panel(5, 3);
	giancarlo({ x: 15, y: 15 }, bigFace(), 99);

	panel(6, 2);
	giancarlo({ x: 13, y: 15, s: 0.9 }, lie(), 2.4);
	giancarlo({ x: 11, y: 15.5, s: 0.5 }, curl(), 2, '');

	panel(7, 3);
	giancarlo({ x: 14, y: 16, s: 0.8, a: -0.45 }, leap(), 1.8);
	bird({ x: 25, y: 4, f: -1, s: 0.6 }, 'W', 'G');
	kitten({ x: 5, y: 22, s: 0.5 });

	panel(8, 2);
	giancarlo({ x: 12, y: 19, s: 0.85 }, crouch(), 1.6);
	bird({ x: 22, y: 6, f: -1, s: 0.7 }, 'L', 'B');
	kitten({ x: 6, y: 7, s: 0.5 });

	panel(9, 3);
	giancarlo({ x: 9, y: 15, s: 0.78 }, sit(), 4);
	fish({ x: 23, y: 9, f: -1, a: -0.5, s: 0.7 }, 'B', 'W');
	fish({ x: 23, y: 22, s: 0.5 }, 'G', 'Y');

	panel(10, 2);
	giancarlo({ x: 13, y: 7.5, s: 0.75 }, curl(), 2);
	giancarlo({ x: 17, y: 20.5, s: 0.75, a: Math.PI }, curl(), 2);

	panel(11, 3);
	giancarlo({ x: 9, y: 15, s: 0.78 }, sit(), 4);
	bird({ x: 23, y: 7, f: -1, s: 0.7 }, 'Y', 'G');
	kitten({ x: 24, y: 21, s: 0.5 });

	const W = c.w;
	const H = c.h;
	const top = new Int16Array(W * H).fill(-2);
	const deep = new Float32Array(W * H);
	const best = new Float32Array(W * H).fill(Infinity);
	const near = new Int16Array(W * H).fill(-1);
	const M = 7;
	figs.forEach((g, i) => {
		const [bx0, by0, bx1, by1] = g.shape.box;
		const ins: [number, number][] = [];
		const outs: [number, number][] = [];
		for (let y = Math.floor(by0) - M; y <= Math.ceil(by1) + M; y++)
			for (let x = Math.floor(bx0) - M; x <= Math.ceil(bx1) + M; x++)
				(g.shape.has(x, y) ? ins : outs).push([x, y]);
		const dist = (x: number, y: number, set: [number, number][]) => {
			let m = Infinity;
			for (const [px, py] of set) m = Math.min(m, Math.hypot(px - x, py - y));
			return m;
		};
		for (let y = Math.max(0, Math.floor(by0) - M); y <= Math.min(H - 1, Math.ceil(by1) + M); y++) {
			for (
				let x = Math.max(0, Math.floor(bx0) - M);
				x <= Math.min(W - 1, Math.ceil(bx1) + M);
				x++
			) {
				const j = y * W + x;
				if (g.shape.has(x, y)) {
					top[j] = i;
					deep[j] = dist(x, y, outs);
					continue;
				}
				const d = dist(x, y, ins);
				if (d <= 1 && top[j] >= 0) top[j] = -1;
				if (d <= best[j]) {
					best[j] = d;
					near[j] = i;
				}
			}
		}
	});

	const ground = (x: number, y: number, k: number) => {
		if (k < 1) return 'R';
		const g = panels[div(y, PH) * COLS + div(x, PW)];
		const row = div(y, 5);
		if (mod(x + row, g) !== 0 || mod(y, 5) > 2) return 'R';
		return SLITS[mod(div(x + row, 4 * g) * 5 + row * 3, SLITS.length)];
	};

	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const j = y * W + x;
			const t = top[j];
			let col: string;
			if (t >= 0) col = figs[t].coat(x, y, deep[j], ...figs[t].back(x, y));
			else if (t === -1) col = 'V';
			else if (near[j] < 0) col = ground(x, y, 9);
			else {
				const k = Math.max(0, Math.ceil(best[j] - 0.5) - 1);
				const b = figs[near[j]].bands;
				col = k < b.length ? b[k] : ground(x, y, k - b.length);
			}
			c.g[y][x] = col;
		}
	}
	for (const f of after) f();
}

export const giancarloMola: Mural = {
	file: 'giancarlo-mola',
	name: 'Giancarlo Mola',
	prefix: 'giancarlo-mola',
	notes: 'G',
	cols: COLS,
	difficulty: 0.4,
	panel: [PW, PH],
	palette: {
		R: '#c8202a',
		V: '#7f7896',
		O: '#ee6f1c',
		Y: '#f2c72a',
		C: '#b8843f',
		D: '#4a2a1a',
		N: '#b56c6c',
		W: '#f1ece0',
		B: '#2348a8',
		G: '#2f9a5a',
		L: '#d4aaeb'
	},
	ground: 'R',
	panels: [
		['sitting-cat', 'Sitting Cat', { mode: 'pentatonic', spice: 'gentle', lead: 'vibes' }],
		['walking-cat', 'Walking Cat', { mode: 'dorian', spice: 'lively', lead: 'flute' }],
		['nap', 'The Nap', { mode: 'lydian', spice: 'gentle', lead: 'harp' }],
		['watchers', 'Watchers', { mode: 'dorian', spice: 'gentle', lead: 'string' }],
		['stretch', 'The Stretch', { mode: 'mixolydian', spice: 'lively', lead: 'mallet' }],
		['cat-face', 'Cat Face', { mode: 'phrygian', spice: 'adventurous', lead: 'brass' }],
		['mother-cat', 'Mother Cat', { mode: 'major', spice: 'gentle', lead: 'kalimba' }],
		['leap', 'The Leap', { mode: 'harmonic', spice: 'lively', lead: 'pizz' }],
		['stalker', 'The Stalker', { mode: 'phrygian', spice: 'adventurous', lead: 'keys' }],
		['fish-catch', 'Fish Catch', { mode: 'mixolydian', spice: 'lively', lead: 'kalimba' }],
		['sleepers', 'The Sleepers', { mode: 'minor-pentatonic', spice: 'gentle', lead: 'harp' }],
		['bird-hunt', 'Bird Hunt', { mode: 'minor', spice: 'lively', lead: 'flute' }]
	],
	draw
};
