// Generate Forage level pictures from shape templates, seeded, so the packs can be rebuilt:
//   pnpm -F parlor forage:pictures [--count 88] [--start-pack 2] [--per-pack 22]
// Every picture is original: simple objects and scenes drawn from circles, rects and
// polygons, with dark outlines around objects so their insides start sealed off.
// Writes src/lib/forage/levels/NN-<name>.json packs (without seeds; run forage:tune next).
import { writeFileSync } from 'node:fs';

import { closePairs, MIN_DELTA } from '../src/lib/shared/palette.ts';
import { rasterize, type Shape } from '../src/lib/shared/shapes.ts';
import { makeRng, type Rng } from '../src/lib/forage/engine.ts';

const arg = (name: string, fallback: string) => {
	const at = process.argv.indexOf(`--${name}`);
	return at >= 0 ? process.argv[at + 1] : fallback;
};
const COUNT = Number(arg('count', '88'));
const START_PACK = Number(arg('start-pack', '2'));
const PER_PACK = Number(arg('per-pack', '22'));

/** Colors to choose from, by name, so templates can ask for "something warm". */
const BANK: Record<string, string> = {
	red: '#e63946',
	coral: '#ff6f61',
	orange: '#ff9f43',
	amber: '#f2a541',
	yellow: '#ffd23f',
	lime: '#a7d948',
	green: '#2e9d5b',
	forest: '#1e5631',
	teal: '#1fb5a8',
	mint: '#9ad0c2',
	sky: '#8fd3ff',
	blue: '#3b7dd8',
	navy: '#24426b',
	indigo: '#4b3f9e',
	violet: '#9b5de5',
	lilac: '#c8a2e8',
	pink: '#ff7eb6',
	rose: '#f4a6b8',
	magenta: '#d63aa0',
	plum: '#6a2c70',
	brown: '#8a5a32',
	tan: '#e8c39e',
	sand: '#f2c46d',
	cream: '#fff4d6',
	white: '#ffffff',
	grey: '#9a97a8',
	night: '#1c2340',
	dusk: '#3f5fb0'
};
const WARM = ['red', 'coral', 'orange', 'amber', 'yellow', 'pink', 'magenta'];
const COOL = ['teal', 'blue', 'indigo', 'violet', 'sky', 'mint', 'green'];
const SKY = ['sky', 'cream', 'mint', 'rose', 'lilac', 'night', 'dusk', 'sand'];
const GROUND = ['green', 'forest', 'sand', 'tan', 'brown', 'lime', 'teal'];
const ANY = Object.keys(BANK).filter((k) => !['white', 'cream', 'night'].includes(k));
const OUTLINES = ['#24212b', '#000000', '#f8f8f2', '#5a3a1a', '#3a2f5b', '#7a1f3d', '#0f4d3a'];

interface Picture {
	id: string;
	name: string;
	palette: Record<string, string>;
	art: string[];
}

/** What a template draws with. */
class Canvas {
	w: number;
	h: number;
	rng: Rng;
	draw: [string, Shape][] = [];
	base = 'A';
	background = new Set<string>();
	#keys = 'ABCDEFGHIJLMNOPRSTUVWY';
	#used = new Map<string, string>(); // key -> hex
	#names = new Map<string, string>(); // key -> bank name

	constructor(w: number, h: number, rng: Rng) {
		this.w = w;
		this.h = h;
		this.rng = rng;
	}

	/** A random number in [a, b). */
	r(a: number, b: number) {
		return a + this.rng() * (b - a);
	}
	ri(a: number, b: number) {
		return Math.floor(this.r(a, b + 1));
	}
	pick<T>(list: T[]): T {
		return list[Math.floor(this.rng() * list.length)];
	}

	/**
	 * A palette key for a color from `names` that stands apart from the colors
	 * already chosen. `bg` marks it as background, which objects get outlined against.
	 */
	color(names: string[], bg = false): string {
		const order = [...names].sort(() => this.rng() - 0.5);
		const taken = new Set(this.#names.values());
		for (const name of [...order, ...ANY]) {
			if (taken.has(name)) continue;
			const hex = BANK[name];
			const trial = Object.fromEntries([...this.#used, ['?', hex]]);
			if (closePairs(trial, undefined, MIN_DELTA + 2).length) continue;
			const key = this.#keys[this.#used.size];
			this.#used.set(key, hex);
			this.#names.set(key, name);
			if (bg) this.background.add(key);
			return key;
		}
		throw new Error('ran out of distinct colors');
	}

	nameOf(key: string) {
		return this.#names.get(key) ?? '';
	}

	fill(key: string) {
		this.base = key;
	}
	add(key: string, shape: Shape) {
		this.draw.push([key, shape]);
	}

	/** Rows of letters, with a 1-pixel outline around everything that isn't background. */
	finish(id: string, name: string): Picture | null {
		let art = rasterize({ w: this.w, h: this.h, base: this.base, draw: this.draw });
		// A background that's most of the picture is split into bands of two tones.
		const tally = (rows: string[]) => {
			const t: Record<string, number> = {};
			for (const ch of rows.join('')) t[ch] = (t[ch] || 0) + 1;
			return t;
		};
		const first = tally(art);
		const big = Object.keys(first).sort((a, b) => first[b] - first[a])[0];
		if (this.background.has(big) && first[big] > this.w * this.h * 0.4) {
			let second: string;
			try {
				second = this.color(SKY.concat(GROUND, ['lilac', 'rose', 'mint', 'sand']), true);
			} catch {
				return null;
			}
			const bands = this.ri(1, 2);
			const band = this.h / (bands * 2);
			art = art.map((row, y) => (Math.floor(y / band) % 2 ? row.replaceAll(big, second) : row));
		}
		const used = new Set(art.join(''));
		const colors = Object.fromEntries([...this.#used].filter(([k]) => used.has(k)));
		const hex = OUTLINES.find((h) => !closePairs({ ...colors, '?': h }).length);
		if (!hex) return null;
		const key = 'K';
		const { w, h } = this;
		const isBg = (x: number, y: number) =>
			x < 0 || y < 0 || x >= w || y >= h || this.background.has(art[y][x]);
		const out = art.map((row, y) =>
			[...row]
				.map((ch, x) =>
					!this.background.has(ch) &&
					(isBg(x - 1, y) || isBg(x + 1, y) || isBg(x, y - 1) || isBg(x, y + 1))
						? key
						: ch
				)
				.join('')
		);
		const palette: Record<string, string> = {};
		for (const k of new Set(out.join(''))) palette[k] = k === key ? hex : colors[k];
		// Too few colors, or one color is most of the picture: skip it.
		const counts: Record<string, number> = {};
		for (const ch of out.join('')) counts[ch] = (counts[ch] || 0) + 1;
		const total = w * h;
		if (Object.keys(palette).length < 4) return null;
		if (Math.max(...Object.values(counts)) > total * 0.55) return null;
		if (closePairs(palette).length) return null;
		return { id, name, palette, art: out };
	}
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

type Template = (c: Canvas) => string;

/** Each template draws onto the canvas and returns the picture's name. */
const TEMPLATES: Record<string, Template> = {
	target(c) {
		const bg = c.color(SKY, true);
		c.fill(bg);
		const cx = c.w / 2;
		const cy = c.h / 2;
		const rings = c.ri(3, 5);
		const r = Math.min(c.w, c.h) / 2 - 1.5;
		const keys = Array.from({ length: rings }, () => c.color(ANY));
		for (let k = 0; k < rings; k++) c.add(keys[k], ['circle', cx, cy, r - (k * r) / rings]);
		return `${cap(c.nameOf(keys[0]))} Target`;
	},
	gem(c) {
		const bg = c.color(['night', 'dusk', 'navy', 'plum', 'sky', 'cream'], true);
		c.fill(bg);
		const cx = c.w / 2;
		const cy = c.h / 2;
		const a = c.color(COOL.concat(['pink', 'red']));
		const b = c.color(['white', 'lilac', 'mint', 'sky']);
		const inner = c.color(WARM);
		const rx = c.w / 2 - 1.5;
		const ry = c.h / 2 - 1.5;
		c.add(a, [
			'poly',
			[
				[cx, cy - ry],
				[cx + rx, cy - ry * 0.25],
				[cx, cy + ry],
				[cx - rx, cy - ry * 0.25]
			]
		]);
		c.add(inner, [
			'poly',
			[
				[cx, cy - ry * 0.5],
				[cx + rx * 0.5, cy - ry * 0.1],
				[cx, cy + ry * 0.55],
				[cx - rx * 0.5, cy - ry * 0.1]
			]
		]);
		c.add(b, [
			'poly',
			[
				[cx - rx * 0.55, cy - ry * 0.45],
				[cx - rx * 0.25, cy - ry * 0.65],
				[cx - rx * 0.15, cy - ry * 0.4]
			]
		]);
		if (c.rng() < 0.6) {
			const star = c.color(['yellow', 'white', 'cream']);
			for (let k = 0; k < 4; k++) c.add(star, ['circle', c.r(2, c.w - 2), c.r(2, 6), 0.8]);
		}
		return `${cap(c.nameOf(a))} Gem`;
	},
	flower(c) {
		const sky = c.color(SKY, true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.78, c.w, c.h]);
		const stem = c.color(['green', 'forest', 'lime']);
		const petal = c.color(WARM.concat(['violet', 'lilac', 'rose']));
		const middle = c.color(['yellow', 'amber', 'brown', 'orange']);
		const cx = c.w / 2 + c.r(-2, 2);
		const cy = c.h * 0.38;
		const pr = c.w * c.r(0.11, 0.14);
		c.add(stem, ['rect', cx - 1, cy, 2.2, c.h]);
		c.add(stem, ['ellipse', cx + 4, c.h * 0.66, 4, 1.8]);
		c.add(stem, ['ellipse', cx - 4, c.h * 0.56, 4, 1.8]);
		const petals = c.ri(5, 8);
		for (let k = 0; k < petals; k++) {
			const t = (k / petals) * Math.PI * 2;
			c.add(petal, ['circle', cx + Math.cos(t) * pr * 1.3, cy + Math.sin(t) * pr * 1.3, pr]);
		}
		c.add(middle, ['circle', cx, cy, pr * 0.95]);
		if (c.rng() < 0.5) {
			const sun = c.color(['yellow', 'orange', 'white']);
			c.add(sun, ['circle', c.w * 0.85, c.h * 0.12, 2.6]);
		}
		return `${cap(c.nameOf(petal))} Flower`;
	},
	mushroom(c) {
		const sky = c.color(SKY, true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.8, c.w, c.h]);
		const capk = c.color(['red', 'orange', 'violet', 'blue', 'magenta', 'brown']);
		const spot = c.color(['white', 'cream', 'yellow']);
		const stalk = c.color(['tan', 'cream', 'sand']);
		const cx = c.w / 2;
		const capY = c.h * 0.42;
		const rx = c.w * c.r(0.38, 0.45);
		c.add(stalk, ['rect', cx - rx * 0.3, capY, rx * 0.6, c.h * 0.45]);
		c.add(capk, ['and', ['ellipse', cx, capY, rx, c.h * 0.3], ['rect', 0, 0, c.w, capY + 1]]);
		const spots = c.ri(3, 6);
		for (let k = 0; k < spots; k++) {
			c.add(spot, [
				'circle',
				cx + c.r(-rx * 0.7, rx * 0.7),
				capY - c.r(1.5, c.h * 0.22),
				c.r(1.2, 2.4)
			]);
		}
		if (c.rng() < 0.5) {
			const small = c.color(['orange', 'pink', 'lilac', 'yellow']);
			const sx = c.rng() < 0.5 ? c.w * 0.16 : c.w * 0.84;
			c.add(stalk, ['rect', sx - 1, c.h * 0.7, 2.4, c.h * 0.15]);
			c.add(small, ['and', ['ellipse', sx, c.h * 0.71, 3.6, 3], ['rect', 0, 0, c.w, c.h * 0.72]]);
		}
		return `${cap(c.nameOf(capk))} Mushroom`;
	},
	house(c) {
		const sky = c.color(SKY, true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['rect', 0, c.h * 0.8, c.w, c.h]);
		const wall = c.color(['cream', 'tan', 'sand', 'rose', 'mint', 'white', 'sky']);
		const roof = c.color(['red', 'brown', 'navy', 'plum', 'indigo', 'coral']);
		const door = c.color(['brown', 'blue', 'green', 'red', 'violet']);
		const glass = c.color(['yellow', 'sky', 'amber']);
		const x0 = c.w * c.r(0.18, 0.26);
		const x1 = c.w - x0;
		const top = c.h * 0.45;
		const bottom = c.h * 0.82;
		c.add(wall, ['rect', x0, top, x1 - x0, bottom - top]);
		c.add(roof, [
			'poly',
			[
				[x0 - 2, top + 0.5],
				[c.w / 2, c.h * 0.14],
				[x1 + 2, top + 0.5]
			]
		]);
		c.add(door, ['rect', c.w / 2 - 2, bottom - c.h * 0.2, 4, c.h * 0.2]);
		c.add(glass, ['rect', x0 + 2, top + 2.5, 4, 3.5]);
		c.add(glass, ['rect', x1 - 6, top + 2.5, 4, 3.5]);
		if (c.rng() < 0.6) {
			const chim = c.color(['brown', 'grey', 'red']);
			c.add(chim, ['rect', x1 - 6, c.h * 0.18, 3, c.h * 0.14]);
		}
		if (c.rng() < 0.6) {
			const sun = c.color(['yellow', 'orange', 'white']);
			c.add(sun, ['circle', c.w * 0.12, c.h * 0.12, 2.8]);
		}
		return `${cap(c.nameOf(wall))} House`;
	},
	tree(c) {
		const sky = c.color(SKY, true);
		const ground = c.color(GROUND, true);
		c.fill(sky);
		c.add(ground, ['ellipse', c.w / 2, c.h * 1.05, c.w * 0.8, c.h * 0.22]);
		const trunk = c.color(['brown', 'tan', 'plum']);
		const leaves = c.color(['green', 'forest', 'lime', 'teal', 'orange', 'pink']);
		const fruit = c.color(['red', 'yellow', 'orange', 'violet', 'white']);
		const cx = c.w / 2;
		c.add(trunk, [
			'poly',
			[
				[cx - 2.5, c.h * 0.88],
				[cx + 2.5, c.h * 0.88],
				[cx + 1.5, c.h * 0.5],
				[cx - 1.5, c.h * 0.5]
			]
		]);
		const blobs = c.ri(4, 6);
		for (let k = 0; k < blobs; k++) {
			const t = (k / blobs) * Math.PI * 2;
			c.add(leaves, [
				'circle',
				cx + Math.cos(t) * c.w * 0.18,
				c.h * 0.34 + Math.sin(t) * c.h * 0.12,
				c.w * c.r(0.15, 0.2)
			]);
		}
		c.add(leaves, ['circle', cx, c.h * 0.34, c.w * 0.2]);
		const fruits = c.ri(4, 8);
		for (let k = 0; k < fruits; k++) {
			c.add(fruit, [
				'circle',
				cx + c.r(-c.w * 0.28, c.w * 0.28),
				c.h * 0.34 + c.r(-c.h * 0.16, c.h * 0.16),
				1.2
			]);
		}
		return `${cap(c.nameOf(fruit))} Fruit Tree`;
	},
	fish(c) {
		const water = c.color(['sky', 'teal', 'blue', 'navy', 'mint'], true);
		const sand = c.color(['sand', 'tan', 'cream'], true);
		c.fill(water);
		c.add(sand, ['ellipse', c.w / 2, c.h * 1.1, c.w * 0.9, c.h * 0.22]);
		const body = c.color(WARM.concat(['violet', 'lime']));
		const stripe = c.color(['white', 'cream', 'navy', 'yellow']);
		const fin = c.color(WARM.concat(COOL));
		const cx = c.w * 0.45;
		const cy = c.h * 0.45;
		const rx = c.w * 0.3;
		const ry = c.h * 0.2;
		c.add(fin, [
			'poly',
			[
				[cx + rx * 0.8, cy],
				[c.w - 1.5, cy - ry * 1.1],
				[c.w - 1.5, cy + ry * 1.1]
			]
		]);
		c.add(fin, [
			'poly',
			[
				[cx - rx * 0.2, cy - ry * 0.8],
				[cx + rx * 0.3, cy - ry * 1.7],
				[cx + rx * 0.5, cy - ry * 0.7]
			]
		]);
		c.add(body, ['ellipse', cx, cy, rx, ry]);
		const stripes = c.ri(1, 3);
		for (let k = 0; k < stripes; k++) {
			c.add(stripe, [
				'and',
				['ellipse', cx, cy, rx, ry],
				['rect', cx - rx * 0.5 + k * rx * 0.45, 0, 1.6, c.h]
			]);
		}
		const eye = c.color(['white', 'cream']);
		c.add(eye, ['circle', cx - rx * 0.6, cy - ry * 0.25, 1.4]);
		const weed = c.color(['green', 'forest', 'lime']);
		for (let k = 0; k < 3; k++)
			c.add(weed, ['ellipse', c.r(2, c.w - 2), c.h * 0.95, 1.1, c.h * 0.1]);
		return `${cap(c.nameOf(body))} Fish`;
	},
	planet(c) {
		const space = c.color(['night', 'navy', 'plum', 'dusk', 'indigo'], true);
		c.fill(space);
		const star = c.color(['white', 'yellow', 'cream']);
		for (let k = 0; k < 9; k++) c.add(star, ['circle', c.r(1, c.w - 1), c.r(1, c.h - 1), 0.7]);
		const body = c.color(WARM.concat(['teal', 'sky', 'lime', 'violet']));
		const band = c.color(ANY);
		const ringk = c.color(['sand', 'tan', 'cream', 'lilac', 'mint', 'rose']);
		const cx = c.w / 2;
		const cy = c.h / 2;
		const r = Math.min(c.w, c.h) * c.r(0.26, 0.32);
		const tilt = c.r(-0.2, 0.2);
		const ringShape: Shape = [
			'and',
			['ellipse', cx, cy, r * 1.85, r * 0.45],
			['not', ['ellipse', cx, cy, r * 1.45, r * 0.28]]
		];
		c.add(ringk, ringShape);
		c.add(body, ['and', ['circle', cx, cy, r], ['not', ['rect', 0, cy + r * 0.25, c.w, c.h]]]);
		c.add(body, ['and', ['circle', cx, cy, r], ['rect', 0, cy + r * 0.25, c.w, c.h]]);
		c.add(band, ['and', ['circle', cx, cy, r], ['rect', 0, cy - r * (0.45 - tilt), c.w, r * 0.3]]);
		c.add(ringk, ['and', ringShape, ['rect', 0, cy, c.w, c.h]]);
		if (c.rng() < 0.6) {
			const moon = c.color(['grey', 'cream', 'lilac', 'white']);
			c.add(moon, ['circle', c.w * 0.82, c.h * 0.18, 2.6]);
		}
		return `${cap(c.nameOf(body))} Planet`;
	},
	cake(c) {
		const bg = c.color(['rose', 'mint', 'sky', 'lilac', 'cream', 'sand'], true);
		c.fill(bg);
		const plate = c.color(['white', 'grey', 'cream']);
		const sponge = c.color(['tan', 'brown', 'sand', 'pink']);
		const cream = c.color(['white', 'cream', 'rose', 'mint']);
		const cherry = c.color(['red', 'magenta', 'violet']);
		const x0 = c.w * 0.18;
		const x1 = c.w * 0.82;
		c.add(plate, ['ellipse', c.w / 2, c.h * 0.86, c.w * 0.42, 2]);
		const tiers = c.ri(2, 3);
		let bottom = c.h * 0.85;
		for (let k = 0; k < tiers; k++) {
			const inset = k * c.w * 0.1;
			const height = c.h * (0.22 - k * 0.03);
			c.add(sponge, ['rect', x0 + inset, bottom - height, x1 - x0 - 2 * inset, height]);
			c.add(cream, ['rect', x0 + inset, bottom - height, x1 - x0 - 2 * inset, 2.2]);
			c.add(cream, ['rect', x0 + inset, bottom - height * 0.55, x1 - x0 - 2 * inset, 1.3]);
			bottom -= height;
		}
		c.add(cherry, ['circle', c.w / 2, bottom - 2, 2.2]);
		const candle = c.color(['sky', 'yellow', 'lime', 'pink']);
		if (c.rng() < 0.6) c.add(candle, ['rect', c.w / 2 + 3, bottom - 6, 1.5, 6]);
		return `${cap(c.nameOf(sponge))} Cake`;
	},
	potion(c) {
		const bg = c.color(['night', 'plum', 'dusk', 'navy', 'cream', 'sand'], true);
		c.fill(bg);
		const glass = c.color(['white', 'mint', 'sky', 'lilac']);
		const liquid = c.color(['magenta', 'lime', 'violet', 'red', 'teal', 'orange']);
		const cork = c.color(['brown', 'tan', 'sand']);
		const cx = c.w / 2;
		const cy = c.h * 0.6;
		const r = Math.min(c.w, c.h) * 0.3;
		c.add(glass, ['circle', cx, cy, r]);
		c.add(glass, ['rect', cx - r * 0.3, cy - r * 1.6, r * 0.6, r]);
		c.add(liquid, [
			'and',
			['circle', cx, cy, r - 1.5],
			['rect', 0, cy - r * c.r(0.2, 0.5), c.w, c.h]
		]);
		c.add(cork, ['rect', cx - r * 0.35, cy - r * 1.9, r * 0.7, r * 0.45]);
		const bubble = c.color(['white', 'cream', 'yellow']);
		for (let k = 0; k < 4; k++)
			c.add(bubble, ['circle', cx + c.r(-r * 0.5, r * 0.5), cy + c.r(0, r * 0.6), 0.9]);
		return `${cap(c.nameOf(liquid))} Potion`;
	},
	mountains(c) {
		const sky = c.color(SKY, true);
		c.fill(sky);
		const sun = c.color(['yellow', 'orange', 'white', 'coral']);
		c.add(sun, ['circle', c.w * c.r(0.15, 0.85), c.h * 0.18, 3.2]);
		const far = c.color(['lilac', 'grey', 'dusk', 'mint', 'violet']);
		const near = c.color(['indigo', 'navy', 'forest', 'plum', 'brown']);
		const snow = c.color(['white', 'cream']);
		const lake = c.color(['blue', 'teal', 'sky']);
		const p1 = c.w * c.r(0.25, 0.4);
		const p2 = c.w * c.r(0.6, 0.75);
		c.add(far, [
			'poly',
			[
				[-2, c.h * 0.75],
				[p1, c.h * 0.22],
				[c.w * 0.65, c.h * 0.75]
			]
		]);
		c.add(snow, [
			'poly',
			[
				[p1 - 3, c.h * 0.33],
				[p1, c.h * 0.22],
				[p1 + 3, c.h * 0.33]
			]
		]);
		c.add(near, [
			'poly',
			[
				[c.w * 0.3, c.h * 0.78],
				[p2, c.h * 0.32],
				[c.w + 2, c.h * 0.78]
			]
		]);
		c.add(snow, [
			'poly',
			[
				[p2 - 2.5, c.h * 0.41],
				[p2, c.h * 0.32],
				[p2 + 2.5, c.h * 0.41]
			]
		]);
		c.add(lake, ['rect', 0, c.h * 0.76, c.w, c.h]);
		return `${cap(c.nameOf(near))} Peaks`;
	},
	balloons(c) {
		const sky = c.color(['sky', 'mint', 'cream', 'rose', 'lilac'], true);
		c.fill(sky);
		const string = c.color(['grey', 'brown', 'navy']);
		const n = c.ri(2, 3);
		const colors = Array.from({ length: n }, () => c.color(WARM.concat(COOL)));
		for (let k = 0; k < n; k++) {
			const cx = (c.w * (k + 1)) / (n + 1) + c.r(-1.5, 1.5);
			const cy = c.h * c.r(0.25, 0.42);
			const r = c.w * c.r(0.12, 0.16);
			c.add(string, ['rect', cx - 0.4, cy + r, 0.9, c.h]);
			c.add(colors[k], ['ellipse', cx, cy, r, r * 1.2]);
		}
		const cloud = c.color(['white', 'cream']);
		c.add(cloud, ['ellipse', c.w * 0.2, c.h * 0.85, 5, 2]);
		return `${cap(c.nameOf(colors[0]))} Balloons`;
	},
	cat(c) {
		const bg = c.color(['mint', 'sky', 'rose', 'lilac', 'cream', 'sand'], true);
		c.fill(bg);
		const fur = c.color(['orange', 'grey', 'brown', 'tan', 'white', 'amber']);
		const ear = c.color(['pink', 'rose', 'coral']);
		const eye = c.color(['green', 'yellow', 'blue', 'teal']);
		const nose = c.color(['pink', 'red', 'brown', 'magenta']);
		const cx = c.w / 2;
		const cy = c.h * 0.58;
		const r = c.w * 0.32;
		c.add(fur, [
			'poly',
			[
				[cx - r, cy - r * 0.2],
				[cx - r * 0.7, cy - r * 1.35],
				[cx - r * 0.15, cy - r * 0.7]
			]
		]);
		c.add(fur, [
			'poly',
			[
				[cx + r, cy - r * 0.2],
				[cx + r * 0.7, cy - r * 1.35],
				[cx + r * 0.15, cy - r * 0.7]
			]
		]);
		c.add(ear, [
			'poly',
			[
				[cx - r * 0.8, cy - r * 0.45],
				[cx - r * 0.68, cy - r * 1.05],
				[cx - r * 0.35, cy - r * 0.7]
			]
		]);
		c.add(ear, [
			'poly',
			[
				[cx + r * 0.8, cy - r * 0.45],
				[cx + r * 0.68, cy - r * 1.05],
				[cx + r * 0.35, cy - r * 0.7]
			]
		]);
		c.add(fur, ['ellipse', cx, cy, r, r * 0.85]);
		c.add(eye, ['ellipse', cx - r * 0.4, cy - r * 0.15, r * 0.18, r * 0.24]);
		c.add(eye, ['ellipse', cx + r * 0.4, cy - r * 0.15, r * 0.18, r * 0.24]);
		c.add(nose, [
			'poly',
			[
				[cx - 1.5, cy + r * 0.15],
				[cx + 1.5, cy + r * 0.15],
				[cx, cy + r * 0.32]
			]
		]);
		return `${cap(c.nameOf(fur))} Cat`;
	},
	owl(c) {
		const sky = c.color(['night', 'dusk', 'navy', 'plum', 'sky'], true);
		c.fill(sky);
		const moon = c.color(['cream', 'yellow', 'white']);
		c.add(moon, ['circle', c.w * 0.82, c.h * 0.14, 3]);
		const branch = c.color(['brown', 'tan']);
		c.add(branch, ['rect', 0, c.h * 0.84, c.w, 2.5]);
		const body = c.color(['brown', 'tan', 'grey', 'violet', 'orange']);
		const belly = c.color(['cream', 'sand', 'white', 'rose']);
		const eyes = c.color(['yellow', 'amber', 'orange', 'lime']);
		const cx = c.w / 2;
		const cy = c.h * 0.55;
		const rx = c.w * 0.27;
		const ry = c.h * 0.3;
		c.add(body, [
			'poly',
			[
				[cx - rx, cy - ry * 0.9],
				[cx - rx * 0.6, cy - ry * 1.25],
				[cx - rx * 0.4, cy - ry * 0.8]
			]
		]);
		c.add(body, [
			'poly',
			[
				[cx + rx, cy - ry * 0.9],
				[cx + rx * 0.6, cy - ry * 1.25],
				[cx + rx * 0.4, cy - ry * 0.8]
			]
		]);
		c.add(body, ['ellipse', cx, cy, rx, ry]);
		c.add(belly, ['ellipse', cx, cy + ry * 0.3, rx * 0.6, ry * 0.55]);
		c.add(eyes, ['circle', cx - rx * 0.42, cy - ry * 0.4, rx * 0.3]);
		c.add(eyes, ['circle', cx + rx * 0.42, cy - ry * 0.4, rx * 0.3]);
		const pupil = c.color(['night', 'navy', 'brown']);
		c.add(pupil, ['circle', cx - rx * 0.42, cy - ry * 0.4, rx * 0.12]);
		c.add(pupil, ['circle', cx + rx * 0.42, cy - ry * 0.4, rx * 0.12]);
		return `${cap(c.nameOf(body))} Owl`;
	},
	snowman(c) {
		const sky = c.color(['sky', 'dusk', 'navy', 'night', 'lilac'], true);
		const snow = c.color(['white', 'cream']);
		const snowGround = c.color(['mint', 'lilac', 'rose', 'sky', 'grey'], true);
		c.fill(sky);
		c.add(snowGround, ['rect', 0, c.h * 0.86, c.w, c.h]);
		const hat = c.color(['night', 'red', 'navy', 'plum', 'forest']);
		const scarf = c.color(['red', 'orange', 'green', 'magenta', 'yellow']);
		const nose = c.color(['orange', 'coral', 'amber']);
		const cx = c.w / 2;
		c.add(snow, ['circle', cx, c.h * 0.72, c.w * 0.24]);
		c.add(snow, ['circle', cx, c.h * 0.43, c.w * 0.17]);
		c.add(scarf, ['rect', cx - c.w * 0.16, c.h * 0.54, c.w * 0.32, 2.2]);
		c.add(scarf, ['rect', cx + c.w * 0.05, c.h * 0.54, 2.2, 6]);
		c.add(hat, ['rect', cx - c.w * 0.17, c.h * 0.29, c.w * 0.34, 1.8]);
		c.add(hat, ['rect', cx - c.w * 0.1, c.h * 0.13, c.w * 0.2, c.h * 0.17]);
		c.add(nose, [
			'poly',
			[
				[cx, c.h * 0.42],
				[cx + 4, c.h * 0.44],
				[cx, c.h * 0.46]
			]
		]);
		for (let k = 0; k < 8; k++) c.add(snow, ['circle', c.r(1, c.w - 1), c.r(1, c.h * 0.8), 0.7]);
		return `${cap(c.nameOf(scarf))} Snowman`;
	},
	butterfly(c) {
		const bg = c.color(['mint', 'sky', 'cream', 'rose', 'lime', 'sand'], true);
		c.fill(bg);
		const wing = c.color(WARM.concat(['violet', 'blue', 'teal']));
		const spot = c.color(['white', 'yellow', 'cream', 'navy']);
		const body = c.color(['night', 'brown', 'navy', 'plum']);
		const inner = c.color(WARM.concat(COOL));
		const cx = c.w / 2;
		const cy = c.h / 2;
		for (const sx of [-1, 1]) {
			c.add(wing, ['ellipse', cx + sx * c.w * 0.22, cy - c.h * 0.12, c.w * 0.22, c.h * 0.2]);
			c.add(wing, ['ellipse', cx + sx * c.w * 0.18, cy + c.h * 0.18, c.w * 0.16, c.h * 0.15]);
			c.add(inner, ['ellipse', cx + sx * c.w * 0.24, cy - c.h * 0.12, c.w * 0.12, c.h * 0.1]);
			c.add(spot, ['circle', cx + sx * c.w * 0.2, cy + c.h * 0.18, 1.6]);
		}
		c.add(body, ['ellipse', cx, cy, 1.6, c.h * 0.3]);
		return `${cap(c.nameOf(wing))} Butterfly`;
	},
	rocket(c) {
		const space = c.color(['night', 'navy', 'plum', 'dusk'], true);
		c.fill(space);
		const star = c.color(['white', 'yellow']);
		for (let k = 0; k < 8; k++) c.add(star, ['circle', c.r(1, c.w - 1), c.r(1, c.h - 1), 0.7]);
		const hull = c.color(['white', 'grey', 'cream', 'sky']);
		const nosec = c.color(['red', 'orange', 'magenta', 'teal']);
		const glass = c.color(['sky', 'teal', 'mint', 'blue']);
		const flame = c.color(['orange', 'yellow', 'amber']);
		const cx = c.w / 2;
		const rx = c.w * 0.15;
		const top = c.h * 0.1;
		const bottom = c.h * 0.72;
		c.add(flame, [
			'poly',
			[
				[cx - rx * 0.7, bottom],
				[cx + rx * 0.7, bottom],
				[cx, c.h * 0.95]
			]
		]);
		c.add(nosec, [
			'poly',
			[
				[cx - rx * 1.9, bottom + 1],
				[cx - rx, bottom - c.h * 0.18],
				[cx - rx, bottom + 1]
			]
		]);
		c.add(nosec, [
			'poly',
			[
				[cx + rx * 1.9, bottom + 1],
				[cx + rx, bottom - c.h * 0.18],
				[cx + rx, bottom + 1]
			]
		]);
		c.add(hull, ['ellipse', cx, (top + bottom) / 2 + 2, rx, (bottom - top) / 2]);
		c.add(nosec, [
			'and',
			['ellipse', cx, (top + bottom) / 2 + 2, rx, (bottom - top) / 2],
			['rect', 0, 0, c.w, top + c.h * 0.14]
		]);
		c.add(glass, ['circle', cx, c.h * 0.38, rx * 0.5]);
		return `${cap(c.nameOf(nosec))} Rocket`;
	},
	quilt(c) {
		const bg = c.color(['cream', 'white', 'sand', 'mint', 'rose'], true);
		c.fill(bg);
		const a = c.color(WARM);
		const b = c.color(COOL);
		const d = c.color(ANY);
		const n = c.ri(2, 3);
		const cw = c.w / n;
		const ch = c.h / n;
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < n; j++) {
				const x = i * cw + cw / 2;
				const y = j * ch + ch / 2;
				const k = (i + j) % 2 ? a : b;
				const r = Math.min(cw, ch) * 0.42;
				if (c.rng() < 0.5) c.add(k, ['circle', x, y, r]);
				else
					c.add(k, [
						'poly',
						[
							[x, y - r],
							[x + r, y],
							[x, y + r],
							[x - r, y]
						]
					]);
				c.add(d, ['circle', x, y, r * 0.4]);
			}
		}
		return `${cap(c.nameOf(a))} Quilt`;
	},
	icecream(c) {
		const bg = c.color(['sky', 'mint', 'rose', 'lilac', 'cream'], true);
		c.fill(bg);
		const cone = c.color(['sand', 'tan', 'amber']);
		const scoops = c.ri(2, 3);
		const flavors = Array.from({ length: scoops }, () =>
			c.color(['pink', 'white', 'brown', 'mint', 'yellow', 'lilac', 'coral'])
		);
		const cx = c.w / 2;
		c.add(cone, [
			'poly',
			[
				[cx - c.w * 0.2, c.h * 0.55],
				[cx + c.w * 0.2, c.h * 0.55],
				[cx, c.h * 0.95]
			]
		]);
		for (let k = 0; k < scoops; k++) {
			c.add(flavors[k], [
				'circle',
				cx + (k % 2 ? 1 : -1) * (k ? 1.5 : 0),
				c.h * (0.5 - k * 0.17),
				c.w * 0.21
			]);
		}
		const sprinkle = c.color(['red', 'blue', 'green', 'violet']);
		for (let k = 0; k < 6; k++)
			c.add(sprinkle, ['rect', cx + c.r(-5, 5), c.h * c.r(0.2, 0.5), 1.2, 1.2]);
		return `${cap(c.nameOf(flavors[0]))} Ice Cream`;
	}
};

const kinds = Object.keys(TEMPLATES);
const pictures: Picture[] = [];
const ids = new Set<string>();
let fails = 0;
for (let n = 0, seed = 1; pictures.length < COUNT && seed < COUNT * 40; seed++) {
	// A template that keeps failing (colors too alike, too plain) gives way to the next.
	if (fails >= 6) {
		n++;
		fails = 0;
	}
	const rng = makeRng(seed * 2654435761);
	// Bigger as the game goes on: 28 wide at first, up to 34.
	const grow = pictures.length / Math.max(1, COUNT - 1);
	const w = Math.round(28 + grow * 6) + (rng() < 0.5 ? 0 : -1);
	const h = Math.round(w * (0.9 + rng() * 0.25));
	const kind = kinds[n % kinds.length];
	const c = new Canvas(w, h, rng);
	let name: string;
	try {
		name = TEMPLATES[kind](c);
	} catch {
		fails++;
		continue;
	}
	let id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
	let shown = name;
	for (let k = 2; ids.has(id); k++) {
		id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${k}`;
		shown = `${name} ${['II', 'III', 'IV', 'V', 'VI'][k - 2] ?? k}`;
	}
	const pic = c.finish(id, shown);
	if (!pic) {
		fails++;
		continue;
	}
	ids.add(id);
	pictures.push(pic);
	fails = 0;
	n++;
}

const names = ['Morning', 'Afternoon', 'Evening', 'Midnight', 'Dawn', 'Noon'];
for (let p = 0; p * PER_PACK < pictures.length; p++) {
	const levels = pictures.slice(p * PER_PACK, (p + 1) * PER_PACK);
	const num = String(START_PACK + p).padStart(2, '0');
	const title = names[p % names.length];
	const file = new URL(
		`../src/lib/forage/levels/${num}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`,
		import.meta.url
	);
	writeFileSync(file, JSON.stringify({ name: title, levels }) + '\n');
	console.log(
		`${num} ${title}: ${levels.map((l) => `${l.id} ${l.art[0].length}x${l.art.length}`).join(', ')}`
	);
}
console.log(`${pictures.length} pictures`);
