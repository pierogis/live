/* Mosaic picture templates: still lifes, vehicles, food, space and other objects. */
import {
	clouds,
	DARK_GRASS,
	glow,
	GRASS,
	hills,
	sky,
	stars,
	sun,
	timed,
	WATER,
	WOOD,
	type Template,
	type Time
} from './backdrop.ts';
import type { Canvas } from './canvas.ts';

const WALLS = [
	'sage',
	'mint',
	'lilac',
	'blush',
	'ice',
	'lemon',
	'peach',
	'sky',
	'beige',
	'lavender'
];
const DARK = ['black', 'charcoal'];
const METAL = ['silver', 'grey', 'steel', 'white'];

/** A wheel: tire and hub. r in cells. */
function wheel(c: Canvas, x: number, y: number, r: number, tire: string, hub: string) {
	c.paint(tire, c.dot(x, y, r));
	c.paint(hub, c.dot(x, y, Math.max(1, r * 0.45)));
}

/** Wall above a table edge at `y`, with an optional stripe along the table. */
function room(c: Canvas, y: number) {
	c.part('wall', WALLS, 2);
	c.fill('wall');
	c.part('table', [...WOOD, 'tan', 'slate', 'teal'], 2);
	c.paint('table', c.rect(0, y, 1, 1));
	c.part('edge', ['chocolate', 'maroon', 'charcoal', 'caramel', 'cream'], 6, 'table');
	c.paint('edge', c.rect(0, y, 1, y + 1.4 / c.h));
}

const fruit: Template = {
	id: 'fruit',
	aspect: 1.25,
	draw(c) {
		room(c, 0.7);
		c.part('bowl', ['cobalt', 'white', 'teal', 'rust', 'azure', 'cream'], 1);
		c.paint('bowl', c.and(c.ell(0.5, 0.58, 0.36, 0.26), c.rect(0, 0.58, 1, 1)));
		c.paint('bowl', c.rect(0.4, 0.8, 0.6, 0.86));
		c.part('rim', ['white', 'gold', 'snow', 'navy', 'yellow'], 5, 'bowl');
		c.paint('rim', c.rect(0.14, 0.58, 0.86, 0.58 + 1.6 / c.h));
		c.part('apple', ['red', 'crimson'], 1);
		c.part('orange', ['orange', 'amber'], 3, 'apple');
		c.part('banana', ['yellow', 'gold', 'lemon'], 3, 'orange');
		c.part('grape', ['purple', 'violet', 'plum'], 4, 'apple');
		c.part('pear', ['lime', 'leaf', 'olive'], 5, 'banana');
		c.part('stalk', ['forest', 'green', 'chocolate'], 7, 'apple', 4);
		c.paint('grape', c.circ(0.26, 0.48, 0.07));
		c.paint('grape', c.circ(0.22, 0.4, 0.06));
		c.paint('grape', c.circ(0.3, 0.38, 0.06));
		c.paint('banana', c.and(c.ell(0.5, 0.36, 0.3, 0.18), c.not(c.ell(0.5, 0.28, 0.27, 0.16))));
		c.paint('pear', c.circ(0.72, 0.5, 0.1));
		c.paint('pear', c.circ(0.75, 0.38, 0.06));
		c.paint('orange', c.circ(0.58, 0.5, 0.11));
		c.paint('apple', c.circ(0.4, 0.5, 0.12));
		c.paint('stalk', c.line(0.4, 0.38, 0.42, 0.33, 1.2));
		c.paint('stalk', c.ell(0.46, 0.33, 0.04, 0.02));
		if (c.chance(0.5)) c.mirror();
		return c.cycle(['Fruit Bowl', 'Bowl of Fruit', 'Still Life with Fruit'], 9);
	}
};

const vase: Template = {
	id: 'vase',
	aspect: 0.85,
	draw(c) {
		const v = c.cycle([
			{
				name: 'Poppies',
				bloom: [
					['red', 'crimson'],
					['orange', 'coral'],
					['red', 'coral']
				]
			},
			{
				name: 'Blue Vase',
				bloom: [
					['yellow', 'gold'],
					['white', 'snow'],
					['orange', 'amber']
				]
			},
			{
				name: 'Spring Flowers',
				bloom: [
					['pink', 'rose'],
					['violet', 'lavender'],
					['yellow', 'lemon']
				]
			},
			{
				name: 'Daisies',
				bloom: [
					['white', 'snow'],
					['lemon', 'yellow'],
					['white', 'cream']
				]
			}
		]);
		room(c, 0.78);
		c.part('stem', ['green', 'forest', 'leaf', 'olive'], 2);
		const heads: [number, number][] = [
			[0.5, 0.18],
			[0.3, 0.28],
			[0.7, 0.26],
			[0.4, 0.08],
			[0.62, 0.1]
		];
		const n = c.more(3, 5);
		for (let k = 0; k < n; k++) {
			const [x, y] = heads[k];
			c.paint('stem', c.line(0.5, 0.6, x, y, 1.4));
		}
		c.paint('stem', c.ell(0.36, 0.46, 0.08, 0.03));
		c.paint('stem', c.ell(0.64, 0.42, 0.08, 0.03));
		for (let k = 0; k < n; k++) {
			const [x, y] = heads[k];
			const p = `bloom${k % 3}`;
			c.part(p, v.bloom[k % 3], k === 0 ? 1 : 3 + (k % 3), 'bloom0');
			for (let a = 0; a < 5; a++) {
				const t = (a / 5) * 2 * Math.PI;
				c.paint(p, c.circ(x + Math.cos(t) * 0.055 * (c.h / c.w), y + Math.sin(t) * 0.05, 0.05));
			}
		}
		c.part('heart', ['gold', 'chocolate', 'amber', 'black'], 5, 'bloom0', 3);
		for (let k = 0; k < n; k++) c.paint('heart', c.dot(heads[k][0], heads[k][1], 1.2));
		c.part('vase', ['cobalt', 'teal', 'azure', 'rust', 'navy'], 1);
		c.paint('vase', c.ell(0.5, 0.68, 0.17, 0.14));
		c.paint('vase', c.rect(0.43, 0.48, 0.57, 0.68));
		c.paint('vase', c.rect(0.4, 0.47, 0.6, 0.5));
		c.part('band', ['white', 'gold', 'yellow', 'cream'], 4, 'vase');
		c.paintOver('band', c.rect(0, 0.66, 1, 0.66 + 1.6 / c.h), ['vase']);
		return v.name;
	}
};

const cactus: Template = {
	id: 'cactus',
	aspect: 0.8,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'night']);
		c.part('wall', WALLS, 2);
		c.fill('wall');
		c.part('frame', ['white', 'cream', 'brown', 'snow'], 4, 'wall');
		c.paint('frame', c.rect(0.12, 0.06, 0.88, 0.7));
		sky(c, time, 5, false, 'frame');
		c.paint('sky', c.rect(0.16, 0.09, 0.84, 0.67));
		c.paint('frame', c.rect(0.49, 0.06, 0.51 + 0.4 / c.w, 0.7));
		c.part('cloud', ['white', 'snow', 'cream', 'slate'], 7, 'sky');
		c.paint('cloud', c.ell(0.3, 0.2, 0.1, 0.04));
		c.part('curtain', ['red', 'cobalt', 'teal', 'magenta', 'gold'], 5, 'frame');
		c.paint(
			'curtain',
			c.poly([
				[0.08, 0.04],
				[0.24, 0.04],
				[0.14, 0.4],
				[0.08, 0.7]
			])
		);
		c.paint(
			'curtain',
			c.poly([
				[0.92, 0.04],
				[0.76, 0.04],
				[0.86, 0.4],
				[0.92, 0.7]
			])
		);
		c.part('sill', [...WOOD, 'white', 'stone'], 3, 'wall');
		c.part('book', ['crimson', 'navy', 'forest', 'purple'], 6, 'sill');
		c.paint('sill', c.rect(0.06, 0.68, 0.94, 0.74));
		c.part('pot', ['rust', 'caramel', 'orange', 'coral', 'cobalt'], 1);
		c.paint(
			'pot',
			c.poly([
				[0.32, 0.7],
				[0.68, 0.7],
				[0.62, 0.95],
				[0.38, 0.95]
			])
		);
		c.paint('pot', c.rect(0.29, 0.66, 0.71, 0.72));
		c.part('soil', ['chocolate', 'brown', 'charcoal'], 6, 'pot');
		c.paint('soil', c.rect(0.32, 0.64, 0.68, 0.66));
		c.part('cactus', ['green', 'leaf', 'forest', 'olive'], 1);
		c.paint('cactus', c.rect(0.42, 0.2, 0.58, 0.66));
		c.paint('cactus', c.ell(0.5, 0.2, 0.08, 0.06));
		c.paint('cactus', c.rect(0.26, 0.42, 0.42, 0.48));
		c.paint('cactus', c.rect(0.26, 0.28, 0.32, 0.48));
		c.paint('cactus', c.ell(0.29, 0.28, 0.03, 0.025));
		c.paint('cactus', c.rect(0.58, 0.48, 0.72, 0.54));
		c.paint('cactus', c.rect(0.66, 0.34, 0.72, 0.54));
		c.paint('cactus', c.ell(0.69, 0.34, 0.03, 0.025));
		c.part('rib', ['lime', 'mint', 'sage', 'pine'], 5, 'cactus');
		for (const x of [0.47, 0.53])
			c.paintOver('rib', c.rect(x, 0.22, x + 1 / c.w, 0.64), ['cactus']);
		c.part('bloom', ['pink', 'magenta', 'red', 'yellow', 'orange'], 3, 'cactus', 4);
		c.paint('bloom', c.circ(0.5, 0.13, 0.06));
		c.paint('book', c.rect(0.76, 0.6, 0.9, 0.68));
		c.part('dish', ['white', 'snow', 'cream', 'silver'], 7, 'sill');
		c.paint('dish', c.rect(0.28, 0.95, 0.72, 0.97));
		return timed(time, c.use % 2 ? 'Cactus on the Sill' : 'Potted Cactus', c.use);
	}
};

const candles: Template = {
	id: 'candles',
	aspect: 1.2,
	draw(c) {
		c.part('wall', ['plum', 'navy', 'night', 'maroon', 'indigo', 'pine'], 2);
		c.fill('wall');
		c.part('window', ['indigo', 'navy', 'purple', 'slate'], 3, 'wall');
		c.part('moon', ['cream', 'lemon', 'white'], 6, 'window');
		const wx = c.pick([0.04, 0.78]);
		c.paint('window', c.rect(wx, 0.08, wx + 0.18, 0.4));
		c.paint('moon', c.circ(wx + 0.09, 0.18, 0.05));
		c.part('table', [...WOOD, 'charcoal'], 3, 'wall');
		c.part('runner', ['crimson', 'gold', 'teal', 'white', 'cream'], 6, 'table');
		c.paint('table', c.rect(0, 0.76, 1, 1));
		c.paint('runner', c.rect(0, 0.84, 1, 0.9));
		c.part('plate', ['gold', 'silver', 'amber', 'grey'], 4, 'table');
		const cols = [
			['cream', 'white', 'snow'],
			['red', 'crimson'],
			['cobalt', 'teal', 'azure']
		];
		const set: [number, number][] = [
			[0.28, 0.4],
			[0.5, 0.28],
			[0.72, 0.46]
		];
		const n = c.more(2, 3);
		c.part('flame', ['orange', 'amber', 'gold'], 1);
		c.part('core', ['yellow', 'lemon', 'white'], 3, 'flame');
		set.slice(0, n).forEach(([x, top], k) => {
			const p = `wax${k}`;
			c.part(p, cols[(k + c.use) % 3], k === 0 ? 1 : 3 + k, 'wax0');
			c.paint('plate', c.ell(x, 0.77, 0.12, 0.035));
			c.paint(p, c.rect(x - 0.07, top, x + 0.07, 0.76));
			c.paint(
				'flame',
				c.poly([
					[x - 0.04, top - 0.03],
					[x, top - 0.2],
					[x + 0.04, top - 0.03]
				])
			);
			c.paint('flame', c.ell(x, top - 0.06, 0.04, 0.05));
			c.paint('core', c.ell(x, top - 0.06, 0.018, 0.03));
		});
		return c.cycle(['Candles', 'Candlelight', 'Evening Candles'], 9);
	}
};

const books: Template = {
	id: 'books',
	aspect: 1,
	draw(c) {
		c.part('wall', WALLS, 2);
		c.fill('wall');
		c.part('shelf', WOOD, 1);
		const spines = [
			['red', 'crimson'],
			['cobalt', 'navy', 'blue'],
			['forest', 'green', 'teal'],
			['gold', 'yellow', 'amber'],
			['plum', 'purple', 'violet'],
			['orange', 'coral'],
			['cream', 'beige', 'white']
		];
		const kinds = c.more(3, 7);
		c.part('label', ['white', 'cream', 'gold', 'lemon'], 6, undefined, 4);
		for (const [y0, y1] of [
			[0.1, 0.44],
			[0.54, 0.88]
		]) {
			c.paint('shelf', c.rect(0, y1, 1, y1 + 0.06));
			let x = 0.04;
			let k = Math.floor(c.r(0, kinds));
			while (x < 0.94) {
				const bw = c.ri(3, 4) / c.w;
				const top = y0 + c.r(0, 0.1);
				const p = `book${k % kinds}`;
				c.part(p, spines[k % kinds], k % kinds < 2 ? 1 : 2 + (k % kinds), `book${k % 2}`);
				if (c.chance(0.12) && x > 0.3 && x < 0.7) {
					c.paint(
						p,
						c.poly([
							[x, y1],
							[x + bw, y1],
							[x + bw + 0.22, top + 0.06],
							[x + 0.22, top + 0.02]
						])
					);
					x += bw + 0.24;
				} else {
					c.paint(p, c.rect(x, top, Math.min(x + bw, 0.96), y1));
					if (c.chance(0.5))
						c.paintOver('label', c.rect(x, top + 0.06, x + bw, top + 0.06 + 1.5 / c.h), [p]);
					x += bw + 0.3 / c.w;
				}
				k++;
			}
		}
		c.part('plant', DARK_GRASS, 5, 'wall');
		c.part('pot', ['rust', 'caramel', 'white', 'coral'], 6, 'plant');
		if (c.t > 0.3) {
			c.paint('plant', c.circ(0.86, 0.02, 0.08));
			c.paint('pot', c.rect(0.82, 0.04, 0.9, 0.1));
		}
		return c.cycle(['Bookshelf', 'Library Shelf', 'Reading Nook'], 9);
	}
};

const car: Template = {
	id: 'car',
	aspect: 1.5,
	draw(c) {
		const v = c.cycle([
			{ name: 'Red Car', body: ['red', 'crimson'] },
			{ name: 'Little Blue Car', body: ['azure', 'blue', 'cobalt'] },
			{ name: 'Yellow Taxi', body: ['yellow', 'gold'] },
			{ name: 'Green Car', body: ['leaf', 'green', 'teal'] }
		]);
		const time = c.cycle<Time>(['day', 'dusk', 'dawn'], 1);
		sky(c, time);
		sun(c, time, c.pick([0.15, 0.85]), 0.15, 0.08, 5);
		clouds(c, time, c.more(1, 2), 0.05, 0.18, 6);
		hills(c, 'far', ['sage', 'olive', 'lavender', 'teal'], 4, 0.5, 0.05, 1, 'grass');
		c.part('grass', GRASS, 2);
		c.paint('grass', c.rect(0, 0.62, 1, 0.76));
		c.part('road', ['charcoal', 'slate', 'stone'], 2);
		c.paint('road', c.rect(0, 0.76, 1, 1));
		c.part('line', ['white', 'yellow', 'snow'], 5, 'road', 4);
		for (let x = 0.02; x < 1; x += 0.2) c.paint('line', c.rect(x, 0.92, x + 0.1, 0.92 + 1 / c.h));
		c.part('body', v.body, 1);
		c.paint('body', c.rect(0.14, 0.52, 0.86, 0.78));
		c.paint('body', c.ell(0.14, 0.65, 0.04, 0.13));
		c.paint(
			'body',
			c.poly([
				[0.26, 0.53],
				[0.34, 0.32],
				[0.64, 0.32],
				[0.74, 0.53]
			])
		);
		c.part('glass', ['ice', 'sky', 'aqua', 'white'], 3, 'body');
		c.paint(
			'glass',
			c.poly([
				[0.31, 0.52],
				[0.37, 0.36],
				[0.48, 0.36],
				[0.48, 0.52]
			])
		);
		c.paint(
			'glass',
			c.poly([
				[0.52, 0.52],
				[0.52, 0.36],
				[0.62, 0.36],
				[0.69, 0.52]
			])
		);
		c.part('tire', DARK, 1);
		c.part('hub', METAL, 4, 'tire', 3);
		wheel(c, 0.3, 0.78, c.h * 0.1, 'tire', 'hub');
		wheel(c, 0.7, 0.78, c.h * 0.1, 'tire', 'hub');
		c.part('lamp', ['lemon', 'yellow', 'orange', 'white'], 5, 'body', 3);
		c.paint('lamp', c.rect(0.83, 0.56, 0.87, 0.62));
		c.part('trim', METAL.concat(['charcoal']), 6, 'body', 4);
		c.paint('trim', c.rect(0.14, 0.7, 0.86, 0.7 + 1.2 / c.h));
		if (c.chance(0.5)) c.mirror();
		return v.name;
	}
};

const train: Template = {
	id: 'train',
	aspect: 1.6,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'dawn']);
		sky(c, time);
		sun(c, time, 0.12, 0.15, 0.08, 5);
		hills(c, 'far', ['sage', 'teal', 'olive', 'lavender'], 4, 0.45, 0.07, 1.2, 'grass');
		hills(c, 'grass', GRASS, 2, 0.66, 0.02, 1);
		c.part('rail', ['chocolate', 'brown', 'stone', 'slate'], 3, 'grass');
		c.paint('rail', c.rect(0, 0.86, 1, 0.9));
		c.part('engine', ['red', 'crimson', 'navy', 'forest', 'black'], 1);
		c.paint('engine', c.rect(0.5, 0.44, 0.8, 0.78));
		c.paint('engine', c.rect(0.66, 0.3, 0.8, 0.5));
		c.paint('engine', c.rect(0.54, 0.26, 0.59, 0.44));
		c.paint(
			'engine',
			c.poly([
				[0.5, 0.66],
				[0.44, 0.84],
				[0.5, 0.84]
			])
		);
		c.part('roof', DARK.concat(['slate']), 4, 'engine');
		c.paint('roof', c.rect(0.64, 0.27, 0.82, 0.31));
		c.paint('roof', c.rect(0.53, 0.24, 0.6, 0.27));
		c.part('window', ['lemon', 'yellow', 'ice', 'sky'], 5, 'engine', 4);
		c.paint('window', c.rect(0.7, 0.35, 0.76, 0.43));
		c.part('car', ['gold', 'cobalt', 'teal', 'orange', 'leaf'], 3, 'engine');
		c.paint('car', c.rect(0.06, 0.44, 0.42, 0.78));
		c.paint('roof', c.rect(0.04, 0.41, 0.44, 0.45));
		for (const x of [0.1, 0.2, 0.3]) c.paint('window', c.rect(x, 0.5, x + 0.06, 0.6));
		c.part('wheel', DARK, 1);
		for (const x of [0.12, 0.34, 0.56, 0.72]) c.paint('wheel', c.dot(x, 0.8, c.h * 0.075));
		c.part('smoke', ['white', 'snow', 'silver', 'grey'], 3, 'sky');
		for (const [x, y, r] of [
			[0.57, 0.18, 0.06],
			[0.5, 0.12, 0.07],
			[0.4, 0.08, 0.08],
			[0.28, 0.08, 0.06]
		])
			c.paint('smoke', c.circ(x, y, r));
		return timed(time, c.use % 2 ? 'Train in the Hills' : 'Steam Train', c.use);
	}
};

const plane: Template = {
	id: 'plane',
	aspect: 1.4,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'dawn']);
		sky(c, time);
		sun(c, time, 0.85, 0.15, 0.08, 5);
		c.part('cloud', ['white', 'snow', 'cream', 'blush', 'lilac', 'ice', 'peach'], 3, 'sky');
		for (const [x, y, r] of [
			[0.15, 0.8, 0.14],
			[0.35, 0.86, 0.16],
			[0.6, 0.84, 0.15],
			[0.85, 0.82, 0.14],
			[0.12, 0.25, 0.08],
			[0.2, 0.28, 0.07]
		])
			c.paint('cloud', c.circ(x, y, r));
		c.paint('cloud', c.rect(0, 0.86, 1, 1));
		c.part('body', ['white', 'silver', 'snow', 'grey'], 1);
		c.paint('body', c.ell(0.5, 0.48, 0.36, 0.08));
		c.paint(
			'body',
			c.poly([
				[0.16, 0.48],
				[0.14, 0.26],
				[0.22, 0.26],
				[0.32, 0.44]
			])
		);
		c.part('wing', ['red', 'cobalt', 'navy', 'orange', 'teal'], 1);
		c.paint(
			'wing',
			c.poly([
				[0.42, 0.5],
				[0.6, 0.5],
				[0.44, 0.74],
				[0.36, 0.74]
			])
		);
		c.paint(
			'wing',
			c.poly([
				[0.46, 0.44],
				[0.56, 0.44],
				[0.48, 0.32],
				[0.42, 0.32]
			])
		);
		c.paint(
			'wing',
			c.poly([
				[0.15, 0.27],
				[0.21, 0.27],
				[0.27, 0.4],
				[0.18, 0.4]
			])
		);
		c.part('trail', ['white', 'snow', 'ice', 'cream'], 6, 'sky');
		c.paint('trail', c.rect(-0.1, 0.45, 0.13, 0.45 + 1.2 / c.h));
		c.paint('trail', c.rect(-0.1, 0.5, 0.13, 0.5 + 1.2 / c.h));
		c.part('tail', ['gold', 'yellow', 'orange', 'teal', 'red'], 5, 'wing');
		c.paint(
			'tail',
			c.poly([
				[0.15, 0.27],
				[0.21, 0.27],
				[0.27, 0.4],
				[0.18, 0.4]
			])
		);
		c.part('cloud2', ['lilac', 'lavender', 'silver', 'peach', 'sky'], 6, 'cloud');
		c.paintOver('cloud2', c.rect(0, 0.92, 1, 1), ['cloud']);
		c.part('stripe', ['cobalt', 'red', 'gold', 'teal'], 4, 'body');
		c.paintOver('stripe', c.rect(0, 0.52, 1, 0.52 + 1.4 / c.h), ['body']);
		c.part('window', ['azure', 'sky', 'navy', 'charcoal'], 3, 'body', 3);
		for (let x = 0.3; x < 0.76; x += 0.06)
			c.paint('window', c.rect(x, 0.45, x + 1.6 / c.w, 0.45 + 2 / c.h));
		c.part('nose', ['charcoal', 'navy', 'slate'], 6, 'body', 4);
		c.paint('nose', c.and(c.ell(0.5, 0.48, 0.36, 0.08), c.rect(0.82, 0, 1, 1)));
		if (c.chance(0.5)) c.mirror();
		return timed(time, c.use % 2 ? 'Above the Clouds' : 'Airplane', c.use);
	}
};

const submarine: Template = {
	id: 'submarine',
	aspect: 1.4,
	draw(c) {
		c.part('water', ['teal', 'blue', 'cobalt', 'turquoise'], 2);
		c.fill('water');
		c.part('deep', ['navy', 'indigo', 'night'], 3, 'water');
		c.paint('deep', c.below(c.wave(0.6, 0.03, 1, 0)));
		c.part('shine', ['aqua', 'sky', 'turquoise', 'ice'], 5, 'water');
		c.paint('shine', c.rect(0, 0, 1, 0.12));
		c.part('sand', ['sand', 'tan', 'beige'], 3, 'deep');
		c.paint('sand', c.below(c.wave(0.9, 0.02, 1.5, 0.3)));
		c.part('hull', ['yellow', 'orange', 'gold', 'red'], 1);
		c.paint('hull', c.ell(0.48, 0.5, 0.34, 0.16));
		c.paint('hull', c.rect(0.4, 0.26, 0.58, 0.4));
		c.part('scope', METAL.concat(['charcoal']), 4, 'hull', 4);
		c.paint('scope', c.rect(0.52, 0.12, 0.55, 0.28));
		c.paint('scope', c.rect(0.52, 0.12, 0.6, 0.15));
		c.part('port', ['charcoal', 'navy', 'slate', 'brown'], 3, 'hull');
		c.part('glass', ['aqua', 'sky', 'ice', 'lemon'], 3, 'port', 3);
		for (const x of [0.32, 0.48, 0.64]) {
			c.paint('port', c.dot(x, 0.5, c.h * 0.06));
			c.paint('glass', c.dot(x, 0.5, c.h * 0.035));
		}
		c.part('prop', ['silver', 'grey', 'charcoal', 'steel'], 5, 'water');
		c.paint('prop', c.rect(0.82, 0.46, 0.85, 0.54));
		c.paint('prop', c.ell(0.86, 0.5, 0.02, 0.1));
		c.part('bubble', ['white', 'ice', 'snow'], 5, 'water', 4);
		for (const [x, y] of [
			[0.92, 0.42],
			[0.95, 0.32],
			[0.91, 0.22]
		])
			c.paint('bubble', c.circ(x, y, 0.04));
		c.part('fish', ['coral', 'pink', 'lime', 'orange'], 6, 'water');
		for (const [x, y] of [
			[0.14, 0.2],
			[0.22, 0.14],
			[0.18, 0.8]
		]) {
			c.paint('fish', c.ell(x, y, 0.035, 0.03));
			c.paint(
				'fish',
				c.poly([
					[x + 0.03, y],
					[x + 0.06, y - 0.03],
					[x + 0.06, y + 0.03]
				])
			);
		}
		c.part('weed', GRASS, 7, 'sand');
		for (const x0 of [0.08, 0.7])
			c.paint('weed', (x, y) => y > 0.72 && Math.abs((x - x0 - 0.02 * Math.sin(y * 20)) * c.w) < 1);
		if (c.chance(0.5)) c.mirror();
		return c.cycle(['Submarine', 'Deep Sea Sub', 'Little Sub'], 9);
	}
};

const bus: Template = {
	id: 'bus',
	aspect: 1.5,
	draw(c) {
		const v = c.cycle([
			{ name: 'School Bus', body: ['yellow', 'gold'] },
			{ name: 'City Bus', body: ['red', 'crimson'] },
			{ name: 'Green Bus', body: ['leaf', 'green', 'teal'] }
		]);
		const time = c.cycle<Time>(['day', 'dawn', 'dusk'], 1);
		sky(c, time);
		sun(c, time, 0.9, 0.12, 0.06, 6);
		clouds(c, time, c.more(0, 2), 0.04, 0.14, 7);
		c.part('city', ['lavender', 'slate', 'steel', 'stone', 'lilac'], 4, 'sky');
		c.part('cwin', ['ice', 'lemon', 'white', 'sky'], 7, 'city', 4);
		for (const [x, top] of [
			[0.04, 0.3],
			[0.2, 0.18],
			[0.4, 0.34],
			[0.6, 0.22],
			[0.82, 0.3]
		])
			c.paint('city', c.rect(x, top, x + 0.14, 0.7));
		for (const [x, top] of [
			[0.04, 0.3],
			[0.2, 0.18],
			[0.4, 0.34],
			[0.6, 0.22],
			[0.82, 0.3]
		]) {
			for (let y = top + 0.04; y < 0.3; y += 0.08)
				c.paint('cwin', c.rect(x + 0.03, y, x + 0.03 + 2 / c.w, y + 2 / c.h));
		}
		c.part('walk', ['silver', 'beige', 'stone'], 3, 'road');
		c.paint('walk', c.rect(0, 0.66, 1, 0.74));
		c.part('road', ['charcoal', 'slate'], 2);
		c.paint('road', c.rect(0, 0.74, 1, 1));
		c.part('sign', ['red', 'crimson', 'cobalt'], 6, 'city', 4);
		c.part('pole', ['silver', 'grey', 'charcoal'], 7, 'sign', 4);
		c.paint('pole', c.rect(0.95, 0.4, 0.95 + 1 / c.w, 0.72));
		c.paint('sign', c.circ(0.955, 0.38, 0.045));
		c.part('body', v.body, 1);
		c.paint('body', c.rect(0.08, 0.32, 0.9, 0.78));
		c.paint('body', c.ell(0.88, 0.62, 0.04, 0.16));
		c.part('glass', ['ice', 'sky', 'azure', 'white'], 1, 'body', 4);
		for (let x = 0.12; x < 0.72; x += 0.12) c.paint('glass', c.rect(x, 0.38, x + 0.09, 0.52));
		c.paint('glass', c.rect(0.76, 0.38, 0.86, 0.72));
		c.part('stripe', DARK.concat(['navy']), 3, 'body');
		c.paint('stripe', c.rect(0.08, 0.58, 0.74, 0.58 + 1.4 / c.h));
		c.part('tire', DARK, 2);
		c.part('hub', METAL, 5, 'tire', 3);
		wheel(c, 0.24, 0.78, c.h * 0.09, 'tire', 'hub');
		wheel(c, 0.72, 0.78, c.h * 0.09, 'tire', 'hub');
		c.part('lamp', ['orange', 'red', 'lemon', 'white'], 6, 'body', 3);
		c.paint('lamp', c.rect(0.88, 0.66, 0.91, 0.72));
		if (c.chance(0.5)) c.mirror();
		return timed(time, v.name, c.use);
	}
};

const tugboat: Template = {
	id: 'tugboat',
	aspect: 1.4,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'dawn']);
		sky(c, time);
		sun(c, time, c.pick([0.15, 0.85]), 0.16, 0.08, 5);
		clouds(c, time, c.more(0, 2), 0.05, 0.16, 7);
		c.part('sea', WATER, 2);
		c.paint('sea', c.rect(0, 0.62, 1, 1));
		c.part('hull', ['red', 'crimson', 'navy', 'forest'], 1);
		c.paint(
			'hull',
			c.poly([
				[0.1, 0.56],
				[0.9, 0.56],
				[0.82, 0.76],
				[0.2, 0.76]
			])
		);
		c.part('cabin', ['white', 'cream', 'snow'], 1);
		c.paint('cabin', c.rect(0.34, 0.36, 0.66, 0.56));
		c.paint('cabin', c.rect(0.4, 0.26, 0.6, 0.36));
		c.part('glass', ['azure', 'sky', 'navy', 'charcoal'], 3, 'cabin', 4);
		for (const x of [0.38, 0.47, 0.56]) c.paint('glass', c.rect(x, 0.4, x + 0.06, 0.48));
		c.paint('glass', c.rect(0.44, 0.29, 0.56, 0.34));
		c.part('stack', ['black', 'charcoal', 'gold', 'orange'], 3, 'cabin');
		c.paint('stack', c.rect(0.68, 0.2, 0.76, 0.56));
		c.part('band', ['red', 'yellow', 'white', 'gold'], 5, 'stack');
		c.paintOver('band', c.rect(0, 0.26, 1, 0.3), ['stack']);
		c.part('smoke', ['grey', 'silver', 'stone', 'white'], 4, 'sky');
		for (const [x, y, r] of [
			[0.74, 0.12, 0.05],
			[0.8, 0.07, 0.06],
			[0.88, 0.05, 0.05]
		])
			c.paint('smoke', c.circ(x, y, r));
		c.part('tire', DARK, 5, 'hull', 4);
		for (const x of [0.28, 0.44, 0.6, 0.76]) c.paint('tire', c.dot(x, 0.66, c.h * 0.04));
		c.part('foam', ['white', 'snow', 'ice', 'aqua'], 6, 'sea');
		c.paint('foam', c.ell(0.5, 0.78, 0.36, 0.025));
		for (let k = 0; k < c.more(1, 3); k++)
			c.paint('foam', c.line(c.r(0, 0.6), 0.86 + k * 0.05, c.r(0.4, 1), 0.86 + k * 0.05, 1));
		if (c.chance(0.5)) c.mirror();
		return timed(time, c.use % 2 ? 'Harbor Tug' : 'Tugboat', c.use);
	}
};

const tractor: Template = {
	id: 'tractor',
	aspect: 1.35,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dawn', 'dusk']);
		sky(c, time);
		sun(c, time, 0.15, 0.15, 0.08, 5);
		clouds(c, time, c.more(1, 2), 0.04, 0.18, 7);
		hills(c, 'field', ['gold', 'sand', 'lime', 'leaf'], 2, 0.6, 0.02, 1);
		c.part('furrow', ['caramel', 'olive', 'amber', 'green'], 5, 'field');
		for (let y = 0.84; y < 1; y += 0.08) c.paint('furrow', c.rect(0, y, 1, y + 1.4 / c.h));
		c.part('body', ['red', 'leaf', 'green', 'orange', 'cobalt'], 1);
		c.paint('body', c.rect(0.3, 0.46, 0.78, 0.66));
		c.paint('body', c.rect(0.3, 0.26, 0.52, 0.48));
		c.part('glass', ['ice', 'sky', 'aqua', 'white'], 3, 'body');
		c.paint('glass', c.rect(0.33, 0.29, 0.49, 0.44));
		c.part('roof', DARK.concat(['slate']), 4, 'body');
		c.paint('roof', c.rect(0.28, 0.22, 0.54, 0.26));
		c.paint('roof', c.rect(0.68, 0.3, 0.71, 0.46));
		c.part('tire', DARK, 1);
		c.part('hub', ['gold', 'yellow', 'silver', 'white'], 3, 'tire');
		wheel(c, 0.36, 0.7, c.h * 0.2, 'tire', 'hub');
		wheel(c, 0.74, 0.76, c.h * 0.12, 'tire', 'hub');
		c.part('bale', ['gold', 'amber', 'sand', 'yellow'], 4, 'field');
		c.part('bale2', ['caramel', 'brown', 'rust'], 6, 'bale');
		for (const x of [0.9, 0.1]) {
			c.paint('bale', c.circ(x, 0.62, 0.08));
			c.paint('bale2', c.and(c.circ(x, 0.62, 0.08), c.not(c.circ(x, 0.62, 0.05))));
		}
		if (c.chance(0.5)) c.mirror();
		return timed(time, c.use % 2 ? 'Red Tractor' : 'Tractor', c.use);
	}
};

const icecream: Template = {
	id: 'icecream',
	aspect: 0.75,
	draw(c) {
		c.part('bg', ['sky', 'mint', 'blush', 'lemon', 'lilac', 'peach'], 2);
		c.fill('bg');
		c.part('bg2', ['white', 'snow', 'cream', 'ice'], 6, 'bg');
		for (let x = 0.06; x < 1; x += 0.28) c.paint('bg2', c.rect(x, 0, x + 0.12, 1));
		c.part('table', ['cobalt', 'teal', 'red', 'violet', 'navy'], 5, 'bg');
		c.paint('table', c.rect(0, 0.9, 1, 1));
		c.part('cone', ['tan', 'caramel', 'sand', 'amber'], 1);
		c.paint(
			'cone',
			c.poly([
				[0.28, 0.5],
				[0.72, 0.5],
				[0.5, 0.96]
			])
		);
		c.part('waffle', ['brown', 'rust', 'chocolate', 'caramel'], 4, 'cone');
		for (let k = -3; k <= 3; k++) {
			c.paintOver('waffle', c.line(0.5 + k * 0.1, 0.5, 0.5 + k * 0.1 + 0.25, 0.96, 1.1), ['cone']);
			c.paintOver('waffle', c.line(0.5 + k * 0.1, 0.5, 0.5 + k * 0.1 - 0.25, 0.96, 1.1), ['cone']);
		}
		const flavors = [
			['pink', 'rose', 'blush'],
			['chocolate', 'brown'],
			['mint', 'lime', 'aqua'],
			['cream', 'lemon', 'white']
		];
		const n = c.more(2, 3);
		for (let k = 0; k < n; k++) {
			const p = `scoop${k}`;
			c.part(p, flavors[(k + c.use) % 4], k === 0 ? 1 : 3 + k, 'scoop0');
			const y = 0.44 - k * 0.15;
			c.paint(p, c.circ(0.5, y, 0.2));
			c.paint(p, c.ell(0.5, y + 0.08, 0.26, 0.05));
		}
		c.part('wafer', ['gold', 'sand', 'yellow', 'beige'], 6, 'scoop0');
		const wy = 0.36 - (n - 1) * 0.15;
		c.paint(
			'wafer',
			c.poly([
				[0.62, wy],
				[0.7, wy - 0.12],
				[0.74, wy - 0.1],
				[0.66, wy + 0.02]
			])
		);
		c.part('sprinkle', ['cobalt', 'yellow', 'lime', 'orange'], 7, 'scoop0', 3);
		for (const [sx, sy] of [
			[0.4, 0.42],
			[0.56, 0.4],
			[0.46, 0.34],
			[0.62, 0.46]
		])
			c.paintOver('sprinkle', c.line(sx, sy, sx + 0.04, sy - 0.01, 1), ['scoop0']);
		c.part('cherry', ['red', 'crimson'], 3, 'bg');
		const top = 0.44 - (n - 1) * 0.15 - 0.2;
		c.paint('cherry', c.circ(0.52, top - 0.02, 0.06));
		c.paint('cherry', c.line(0.53, top - 0.04, 0.58, top - 0.12, 1));
		return n > 2
			? c.cycle(['Triple Scoop', 'Sundae Cone'], 9)
			: c.cycle(['Ice Cream Cone', 'Double Scoop'], 9);
	}
};

const cake: Template = {
	id: 'cake',
	aspect: 1,
	draw(c) {
		c.part('bg', WALLS, 2);
		c.fill('bg');
		c.part('bunting', ['red', 'cobalt', 'yellow', 'violet'], 6, 'bg');
		for (let x = 0.02; x < 1; x += 0.12)
			c.paint(
				'bunting',
				c.poly([
					[x, 0.02],
					[x + 0.08, 0.02],
					[x + 0.04, 0.1]
				])
			);
		c.part('tablecloth', ['cobalt', 'teal', 'red', 'violet'], 4, 'bg');
		c.paint('tablecloth', c.rect(0, 0.92, 1, 1));
		c.part('stand', ['white', 'silver', 'gold', 'snow'], 3, 'bg');
		c.paint('stand', c.rect(0.12, 0.84, 0.88, 0.88));
		c.paint('stand', c.rect(0.44, 0.88, 0.56, 0.98));
		c.part('sponge', ['tan', 'peach', 'sand', 'chocolate', 'caramel'], 1);
		c.paint('sponge', c.rect(0.18, 0.46, 0.82, 0.84));
		c.part('jam', ['red', 'pink', 'crimson', 'magenta'], 3, 'frost');
		c.paint('jam', c.rect(0.18, 0.64, 0.82, 0.64 + 1.6 / c.h));
		c.part('frost', ['white', 'blush', 'cream', 'lemon', 'mint'], 1);
		c.paint('frost', c.rect(0.16, 0.42, 0.84, 0.5));
		for (const x of [0.22, 0.36, 0.5, 0.64, 0.78]) c.paint('frost', c.ell(x, 0.5, 0.035, 0.06));
		c.part('berry', ['red', 'crimson', 'purple', 'plum'], 5, 'frost', 4);
		for (const bx of [0.3, 0.7]) c.paint('berry', c.circ(bx, 0.42, 0.04));
		const n = c.more(3, 5);
		c.part('candle', ['cobalt', 'pink', 'leaf', 'violet', 'azure'], 4, 'bg', 4);
		c.part('flame', ['orange', 'gold', 'yellow'], 3, 'bg', 3);
		for (let k = 0; k < n; k++) {
			const x = 0.26 + (k / (n - 1)) * 0.48;
			c.paint('candle', c.rect(x - 0.5 / c.w, 0.28, x + 1 / c.w, 0.42));
			c.paint('flame', c.ell(x + 0.25 / c.w, 0.24, 0.025, 0.04));
		}
		return c.cycle(['Birthday Cake', 'Party Cake', 'Layer Cake'], 9);
	}
};

const pizza: Template = {
	id: 'pizza',
	aspect: 1,
	draw(c) {
		c.part('cloth', ['red', 'cobalt', 'leaf', 'crimson'], 2);
		c.part('check', ['white', 'snow', 'cream'], 3, 'cloth');
		c.fill('cloth');
		const s = Math.max(3, Math.round(Math.min(c.w, c.h) / 8));
		c.paint('check', (x, y) => (Math.floor((x * c.w) / s) + Math.floor((y * c.h) / s)) % 2 === 0);
		c.part('plate', ['white', 'snow', 'silver', 'ice'], 4, 'cloth');
		c.paint('plate', c.ell(0.5, 0.52, 0.48, 0.46));
		c.part('crust', ['caramel', 'tan', 'amber'], 1);
		c.part('cheese', ['yellow', 'gold', 'lemon'], 1);
		const slice = c.poly([
			[0.14, 0.12],
			[0.9, 0.22],
			[0.42, 0.92]
		]);
		c.paint('crust', slice);
		c.paint(
			'cheese',
			c.poly([
				[0.2, 0.2],
				[0.84, 0.28],
				[0.43, 0.86]
			])
		);
		c.part('pep', ['crimson', 'red', 'maroon'], 3, 'cheese');
		for (const [x, y] of [
			[0.38, 0.32],
			[0.6, 0.36],
			[0.46, 0.56],
			[0.33, 0.24]
		].slice(0, c.more(2, 4)))
			c.paint('pep', c.circ(x, y, 0.07));
		c.part('shroom', ['beige', 'cream', 'tan', 'stone'], 5, 'cheese', 4);
		c.paint('shroom', c.and(c.circ(0.62, 0.3, 0.05), c.rect(0, 0, 1, 0.31)));
		c.paint('shroom', c.rect(0.61, 0.3, 0.63 + 0.5 / c.w, 0.35));
		c.part('pepper', ['lime', 'leaf', 'green'], 6, 'cheese', 4);
		c.paint('pepper', c.and(c.circ(0.36, 0.44, 0.05), c.not(c.circ(0.36, 0.44, 0.025))));
		c.part('basil', ['green', 'forest', 'leaf'], 5, 'cheese', 4);
		c.paint('basil', c.ell(0.62, 0.48, 0.04, 0.03));
		c.paint('basil', c.ell(0.5, 0.42, 0.03, 0.04));
		c.part('olive', ['black', 'charcoal', 'plum'], 6, 'cheese', 4);
		c.paint('olive', c.and(c.dot(0.42, 0.7, 1.6), c.not(c.dot(0.42, 0.7, 0.6))));
		if (c.chance(0.5)) c.mirror();
		return c.cycle(['Pizza Slice', 'Pepperoni Pizza', 'Pizza Night'], 9);
	}
};

const watermelon: Template = {
	id: 'watermelon',
	aspect: 1.25,
	draw(c) {
		c.part('bg', ['sky', 'lemon', 'blush', 'lilac', 'mint', 'cream'], 2);
		c.fill('bg');
		c.part('sun', ['yellow', 'gold', 'lemon'], 6, 'bg');
		c.paint('sun', c.circ(0.9, 0.12, 0.08));
		c.part('grass', GRASS, 5, 'bg');
		c.paint('grass', c.below(c.wave(0.62, 0.02, 1, 0.3)));
		c.part('blanket', ['cobalt', 'red', 'teal', 'orange'], 4, 'bg');
		c.part('blanket2', ['white', 'snow', 'yellow'], 6, 'blanket');
		c.paint('blanket', c.rect(0, 0.72, 1, 1));
		for (let x = 0; x < 1; x += 0.16) c.paint('blanket2', c.rect(x, 0.72, x + 0.08, 1));
		const R = 0.42;
		const cy = 0.3;
		c.part('rind', ['forest', 'green', 'pine'], 1);
		c.paint('rind', c.and(c.circ(0.5, cy, R), c.rect(0, cy, 1, 1)));
		c.part('pith', ['lime', 'mint', 'lemon'], 3, 'rind');
		c.paint('pith', c.and(c.circ(0.5, cy, R - 1.6 / Math.min(c.w, c.h)), c.rect(0, cy, 1, 1)));
		c.part('flesh', ['red', 'pink', 'coral'], 1);
		c.paint('flesh', c.and(c.circ(0.5, cy, R - 3.2 / Math.min(c.w, c.h)), c.rect(0, cy, 1, 1)));
		c.part('seed', DARK.concat(['chocolate']), 3, 'flesh', 3);
		for (const [x, y] of [
			[0.36, 0.42],
			[0.5, 0.48],
			[0.64, 0.42],
			[0.43, 0.56],
			[0.57, 0.56],
			[0.28, 0.36],
			[0.72, 0.36]
		]) {
			c.paintOver('seed', c.ell(x, y, 0.012 + 0.6 / c.w, 0.03), ['flesh']);
		}
		c.part('stripe', ['olive', 'leaf', 'pine'], 7, 'rind');
		return c.cycle(['Watermelon', 'Summer Watermelon', 'Picnic Melon'], 9);
	}
};

const burger: Template = {
	id: 'burger',
	aspect: 1,
	draw(c) {
		c.part('bg', ['sky', 'mint', 'lemon', 'blush', 'lilac', 'teal'], 2);
		c.fill('bg');
		c.part('plate', ['white', 'snow', 'silver'], 3, 'bg');
		c.paint('plate', c.ell(0.5, 0.88, 0.46, 0.07));
		c.part('bun', ['caramel', 'amber', 'tan', 'orange'], 1);
		c.paint('bun', c.and(c.ell(0.5, 0.42, 0.38, 0.28), c.rect(0, 0, 1, 0.42)));
		c.paint('bun', c.rect(0.14, 0.76, 0.86, 0.86));
		c.part('seed', ['cream', 'white', 'lemon'], 5, 'bun', 3);
		for (const [x, y] of [
			[0.36, 0.24],
			[0.5, 0.2],
			[0.64, 0.25],
			[0.43, 0.32],
			[0.58, 0.33]
		])
			c.paint('seed', c.ell(x, y, 0.025, 0.02 + 0.5 / c.h));
		c.part('lettuce', ['leaf', 'lime', 'green'], 1);
		c.paint(
			'lettuce',
			(x, y) => x > 0.08 && x < 0.92 && y > 0.42 && y < 0.5 + 0.02 * Math.sin(x * 40)
		);
		c.part('tomato', ['red', 'crimson', 'coral'], 3, 'patty');
		c.paint('tomato', c.rect(0.14, 0.5, 0.86, 0.56));
		c.part('cheese', ['yellow', 'gold', 'lemon'], 3, 'patty');
		c.paint(
			'cheese',
			c.poly([
				[0.1, 0.56],
				[0.9, 0.56],
				[0.86, 0.62],
				[0.74, 0.68],
				[0.66, 0.62],
				[0.2, 0.62]
			])
		);
		c.part('patty', ['chocolate', 'brown', 'maroon'], 1);
		c.paint('patty', c.rect(0.12, 0.62, 0.88, 0.76));
		c.paint('patty', c.ell(0.5, 0.69, 0.4, 0.07));
		c.part('box', ['red', 'crimson', 'cobalt'], 5, 'bg');
		c.part('fry', ['yellow', 'gold', 'lemon'], 6, 'box');
		const fx = c.pick([0.08, 0.92]);
		for (let k = -2; k <= 2; k++)
			c.paint(
				'fry',
				c.rect(fx + k * 0.022 - 0.008, 0.52 + Math.abs(k) * 0.03, fx + k * 0.022 + 0.01, 0.7)
			);
		c.paint(
			'box',
			c.poly([
				[fx - 0.08, 0.64],
				[fx + 0.08, 0.64],
				[fx + 0.06, 0.86],
				[fx - 0.06, 0.86]
			])
		);
		c.part('flag', ['red', 'cobalt', 'white'], 7, 'bg', 4);
		if (c.t > 0.3) {
			c.paint('flag', c.rect(0.5, 0.02, 0.5 + 1 / c.w, 0.16));
			c.paint(
				'flag',
				c.poly([
					[0.52, 0.02],
					[0.66, 0.05],
					[0.52, 0.08]
				])
			);
		}
		return c.cycle(['Cheeseburger', 'Burger and Fries', 'Lunch Special'], 9);
	}
};

const cupcake: Template = {
	id: 'cupcake',
	aspect: 0.85,
	draw(c) {
		const v = c.cycle([
			{ name: 'Strawberry Cupcake', frost: ['pink', 'rose', 'blush'] },
			{ name: 'Chocolate Cupcake', frost: ['chocolate', 'brown'] },
			{ name: 'Mint Cupcake', frost: ['mint', 'aqua', 'lime'] }
		]);
		c.part('bg', ['lemon', 'sky', 'lilac', 'peach', 'mint', 'blush'], 2);
		c.fill('bg');
		c.part('dot', ['white', 'snow', 'cream'], 6, 'bg', 4);
		for (let y = 0.08; y < 1; y += 0.22)
			for (let x = 0.08 + ((y * 3) % 0.2); x < 1; x += 0.22) c.paint('dot', c.circ(x, y, 0.03));
		c.part('table', [...WOOD, 'slate', 'teal'], 4, 'bg');
		c.paint('table', c.rect(0, 0.92, 1, 1));
		c.part('liner', ['cobalt', 'teal', 'violet', 'red', 'gold'], 1);
		c.part('pleat', ['white', 'azure', 'lilac', 'orange', 'yellow'], 3, 'liner');
		const liner = c.poly([
			[0.22, 0.55],
			[0.78, 0.55],
			[0.7, 0.92],
			[0.3, 0.92]
		]);
		c.paint('liner', liner);
		for (let k = -3; k <= 3; k += 2)
			c.paintOver('pleat', c.and(liner, c.line(0.5 + k * 0.06, 0.55, 0.5 + k * 0.045, 0.92, 1.4)), [
				'liner'
			]);
		c.part('frost', v.frost, 1);
		for (const [y, rx] of [
			[0.52, 0.32],
			[0.42, 0.26],
			[0.33, 0.19],
			[0.25, 0.11]
		])
			c.paint('frost', c.ell(0.5, y, rx, 0.07));
		c.part('swirl', ['white', 'cream', 'snow', 'peach'], 4, 'frost');
		for (const y of [0.475, 0.38, 0.29])
			c.paintOver('swirl', c.line(0.3 + (0.52 - y), y, 0.7 - (0.52 - y) * 0.7, y + 0.02, 1), [
				'frost'
			]);
		c.part('sprinkle', ['yellow', 'cobalt', 'lime', 'orange'], 6, 'frost', 3);
		for (const [sx, sy] of [
			[0.32, 0.5],
			[0.62, 0.48],
			[0.42, 0.4],
			[0.58, 0.32]
		])
			c.paintOver('sprinkle', c.line(sx, sy, sx + 0.05, sy - 0.015, 1), ['frost']);
		c.part('cherry', ['red', 'crimson'], 3, 'bg');
		c.paint('cherry', c.circ(0.5, 0.14, 0.07));
		c.paint('cherry', c.line(0.52, 0.1, 0.58, 0.02, 1));
		return v.name;
	}
};

const donut: Template = {
	id: 'donut',
	aspect: 1,
	draw(c) {
		const v = c.cycle([
			{ name: 'Pink Donut', icing: ['pink', 'rose'] },
			{ name: 'Chocolate Donut', icing: ['chocolate', 'maroon'] },
			{ name: 'Sprinkle Donut', icing: ['lilac', 'white', 'lavender'] }
		]);
		c.part('bg', ['teal', 'sky', 'mint', 'lemon', 'peach', 'azure'], 2);
		c.fill('bg');
		c.part('table', [...WOOD, 'slate'], 5, 'bg');
		c.paint('table', c.rect(0, 0.9, 1, 1));
		c.part('mug', ['red', 'cobalt', 'gold', 'leaf'], 6, 'bg');
		c.part('coffee', ['chocolate', 'brown', 'charcoal'], 7, 'mug');
		const mx = c.pick([0.06, 0.94]);
		c.paint('mug', c.circ(mx, 0.9, 0.12));
		c.paint('coffee', c.circ(mx, 0.9, 0.08));
		c.part('plate', ['white', 'snow', 'cream', 'silver'], 4, 'bg');
		c.paint('plate', c.circ(0.5, 0.52, 0.47));
		c.part('dough', ['tan', 'caramel', 'amber', 'sand'], 1);
		c.paint('dough', c.circ(0.5, 0.5, 0.38));
		c.part('icing', v.icing, 1);
		c.paint('icing', (x, y) => {
			const a = Math.atan2(y - 0.5, x - 0.5);
			return c.circ(0.5, 0.5, 0.33 + 0.025 * Math.sin(a * 7))(x, y);
		});
		c.paint('bg', c.circ(0.5, 0.5, 0.11));
		c.paint('dough', c.and(c.circ(0.5, 0.5, 0.15), c.not(c.circ(0.5, 0.5, 0.11))));
		const bits = [
			['yellow', 'lemon'],
			['cobalt', 'azure'],
			['leaf', 'lime'],
			['red', 'orange']
		];
		const kinds = c.more(1, 4);
		for (let k = 0; k < 10; k++) {
			const a = (k / 10) * 2 * Math.PI + 0.3;
			const r = k % 2 ? 0.24 : 0.2;
			const x = 0.5 + Math.cos(a) * r;
			const y = 0.5 + Math.sin(a) * r;
			const p = `bit${k % kinds}`;
			c.part(p, bits[k % kinds], 3 + (k % kinds), 'icing', 4);
			c.paintOver(
				p,
				c.line(x - 0.03, y - 0.02 * ((k % 3) - 1), x + 0.03, y + 0.02 * ((k % 3) - 1), 1.3),
				['icing']
			);
		}
		return v.name;
	}
};

const planet: Template = {
	id: 'planet',
	aspect: 1.2,
	draw(c) {
		c.part('space', ['night', 'black', 'navy', 'plum'], 2);
		c.fill('space');
		c.part('nebula', ['indigo', 'purple', 'teal', 'maroon'], 3, 'space');
		c.paint('nebula', (x, y) => Math.abs(y - 0.8 + 0.5 * x - 0.1 * Math.sin(x * 8)) < 0.08);
		const cx = 0.48;
		const cy = 0.5;
		const ringBack = c.and(
			c.ell(cx, cy, 0.44, 0.13),
			c.not(c.ell(cx, cy, 0.32, 0.08)),
			c.rect(0, 0, 1, cy)
		);
		const ringFront = c.and(
			c.ell(cx, cy, 0.44, 0.13),
			c.not(c.ell(cx, cy, 0.32, 0.08)),
			c.rect(0, cy, 1, 1)
		);
		c.part('ring', ['sand', 'beige', 'peach', 'lilac', 'ice'], 1);
		c.paint('ring', ringBack);
		c.part('planet', ['orange', 'coral', 'amber', 'teal', 'violet', 'azure'], 1);
		c.paint('planet', c.circ(cx, cy, 0.27));
		c.part('band', ['rust', 'maroon', 'gold', 'cobalt', 'purple'], 3, 'planet');
		for (const dy of [-0.14, 0.02, 0.14])
			c.paintOver('band', c.rect(0, cy + dy, 1, cy + dy + 0.045), ['planet']);
		c.paint('ring', ringFront);
		c.part('spotp', ['cream', 'peach', 'white', 'lemon'], 6, 'planet', 4);
		c.paint('spotp', c.ell(cx + 0.08, cy + 0.08, 0.05, 0.035));
		c.part('comet', ['white', 'snow', 'aqua'], 5, 'space', 4);
		c.part('tail', ['azure', 'turquoise', 'lilac', 'sky'], 7, 'comet');
		c.paint('tail', c.line(0.62, 0.92, 0.84, 0.8, 1.6));
		c.paint('comet', c.circ(0.6, 0.93, 0.035));
		c.part('moon', ['silver', 'grey', 'white', 'snow'], 4, 'space');
		c.paint('moon', c.circ(0.88, 0.18, 0.07));
		c.part('moon2', ['lime', 'pink', 'gold', 'aqua'], 6, 'moon');
		if (c.t > 0.3) c.paint('moon2', c.circ(0.12, 0.82, 0.05));
		stars(c, c.more(3, 7), 0.03, 0.03, 0.97, 0.97, 6, 'space');
		if (c.chance(0.5)) c.mirror();
		return c.cycle(['Ringed Planet', 'Planet and Moons', 'Gas Giant'], 9);
	}
};

const ufo: Template = {
	id: 'ufo',
	aspect: 1.2,
	draw(c) {
		sky(c, 'night');
		sun(c, 'night', 0.85, 0.12, 0.07, 5);
		stars(c, c.more(2, 6), 0, 0, 1, 0.45);
		hills(c, 'hill', ['forest', 'green', 'olive', 'teal'], 2, 0.78, 0.04, 0.8);
		c.part('beam', ['lemon', 'lime', 'mint', 'cream'], 3, 'sky');
		c.paint(
			'beam',
			c.poly([
				[0.42, 0.42],
				[0.58, 0.42],
				[0.74, 0.92],
				[0.26, 0.92]
			])
		);
		c.part('saucer', ['silver', 'grey', 'steel', 'white'], 1);
		c.paint('saucer', c.ell(0.5, 0.38, 0.34, 0.08));
		c.part('dome', ['aqua', 'turquoise', 'sky', 'lime'], 1);
		c.paint('dome', c.and(c.ell(0.5, 0.33, 0.14, 0.14), c.rect(0, 0, 1, 0.33)));
		c.part('light', ['yellow', 'red', 'orange', 'pink'], 3, 'saucer', 3);
		for (const x of [0.28, 0.4, 0.5, 0.6, 0.72]) c.paint('light', c.dot(x, 0.4, 1.1));
		c.part('alien', ['lime', 'leaf', 'green'], 6, 'dome', 4);
		c.paint('alien', c.circ(0.5, 0.28, 0.05));
		c.part('cow', ['white', 'snow', 'cream'], 5, 'beam');
		c.part('spot', DARK, 7, 'cow', 3);
		if (c.t > 0.3) {
			c.paint('cow', c.ell(0.5, 0.74, 0.08, 0.05));
			c.paint('cow', c.ell(0.6, 0.71, 0.03, 0.03));
			for (const x of [0.45, 0.55]) c.paint('cow', c.rect(x - 0.01, 0.76, x + 0.01, 0.82));
			c.paint('spot', c.dot(0.48, 0.73, 1.2));
		}
		return c.t > 0.3 ? c.cycle(['UFO over the Farm', 'Night Visitors'], 9) : 'Flying Saucer';
	}
};

const astronaut: Template = {
	id: 'astronaut',
	aspect: 0.85,
	draw(c) {
		c.part('space', ['night', 'black', 'navy', 'plum'], 2);
		c.fill('space');
		c.part('earth', ['azure', 'blue', 'teal'], 4, 'space');
		c.part('land', ['leaf', 'green', 'lime'], 5, 'earth');
		c.paint('earth', c.circ(0.14, 0.86, 0.26));
		c.paintOver('land', c.or(c.ell(0.1, 0.78, 0.08, 0.05), c.ell(0.24, 0.92, 0.07, 0.06)), [
			'earth'
		]);
		c.part('suit', ['white', 'snow', 'silver'], 1);
		c.paint('suit', c.circ(0.5, 0.26, 0.2));
		c.paint('suit', c.rect(0.34, 0.4, 0.66, 0.7));
		c.paint('suit', c.line(0.36, 0.44, 0.2, 0.58, 4));
		c.paint('suit', c.line(0.64, 0.44, 0.82, 0.32, 4));
		c.paint('suit', c.rect(0.36, 0.68, 0.48, 0.9));
		c.paint('suit', c.rect(0.52, 0.68, 0.64, 0.9));
		c.part('visor', ['gold', 'amber', 'navy', 'cobalt'], 1);
		c.paint('visor', c.ell(0.5, 0.26, 0.13, 0.09));
		c.part('glint', ['white', 'lemon', 'ice'], 6, 'visor', 3);
		c.paint('glint', c.ell(0.45, 0.23, 0.03, 0.025));
		c.part('pack', ['grey', 'stone', 'steel', 'silver'], 3, 'suit');
		c.paint('pack', c.rect(0.28, 0.42, 0.34, 0.66));
		c.paint('pack', c.rect(0.66, 0.42, 0.72, 0.66));
		c.part('patch', ['red', 'orange', 'cobalt'], 4, 'suit', 4);
		c.paint('patch', c.rect(0.42, 0.48, 0.5, 0.54));
		c.part('boot', ['charcoal', 'slate', 'stone', 'grey'], 5, 'suit');
		c.paint('boot', c.rect(0.35, 0.86, 0.49, 0.92));
		c.paint('boot', c.rect(0.51, 0.86, 0.65, 0.92));
		stars(c, c.more(3, 6), 0.03, 0.03, 0.97, 0.97, 6, 'space');
		if (c.chance(0.5)) c.mirror();
		return c.cycle(['Astronaut', 'Spacewalk', 'Space Explorer'], 9);
	}
};

const kite: Template = {
	id: 'kite',
	aspect: 0.85,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dawn', 'dusk']);
		sky(c, time);
		sun(c, time, 0.15, 0.12, 0.07, 6);
		clouds(c, time, c.more(1, 3), 0.1, 0.5, 5);
		hills(c, 'grass', GRASS, 2, 0.84, 0.03, 0.8);
		const quads = [
			['red', 'crimson'],
			['yellow', 'gold'],
			['cobalt', 'blue'],
			['leaf', 'lime', 'green']
		];
		const cx = 0.58;
		const cy = 0.32;
		const k = c.more(2, 4);
		const tri = [
			[
				[cx, cy - 0.24],
				[cx + 0.2, cy],
				[cx, cy]
			],
			[
				[cx + 0.2, cy],
				[cx, cy + 0.3],
				[cx, cy]
			],
			[
				[cx, cy + 0.3],
				[cx - 0.2, cy],
				[cx, cy]
			],
			[
				[cx - 0.2, cy],
				[cx, cy - 0.24],
				[cx, cy]
			]
		] as [number, number][][];
		tri.forEach((pts, q) => {
			const p = `quad${q % k}`;
			c.part(p, quads[q % k], q % k === 0 ? 1 : 2 + (q % k), 'quad0');
			c.paint(p, c.poly(pts));
		});
		c.part('string', ['white', 'charcoal', 'brown', 'snow'], 3, 'sky', 4);
		c.paint('string', c.line(cx, cy + 0.3, 0.2, 0.98, 1));
		c.part('bow', ['pink', 'orange', 'violet', 'red'], 4, 'string', 4);
		for (const t of [0.25, 0.5, 0.75]) {
			const x = cx + (0.2 - cx) * t;
			const y = cy + 0.3 + (0.98 - cy - 0.3) * t;
			c.paint(
				'bow',
				c.poly([
					[x - 0.04, y - 0.02],
					[x + 0.04, y + 0.02],
					[x + 0.04, y - 0.02],
					[x - 0.04, y + 0.02]
				])
			);
		}
		c.part('spar', ['brown', 'chocolate', 'charcoal'], 6, 'quad0', 4);
		c.paint('spar', c.line(cx, cy - 0.24, cx, cy + 0.3, 1));
		c.paint('spar', c.line(cx - 0.2, cy, cx + 0.2, cy, 1));
		return timed(time, c.use % 2 ? 'Kite Day' : 'Kite', c.use);
	}
};

const guitar: Template = {
	id: 'guitar',
	aspect: 0.75,
	draw(c) {
		c.part('wall', WALLS, 2);
		c.fill('wall');
		c.part('rug', ['maroon', 'teal', 'navy', 'rust', 'plum'], 5, 'wall');
		c.paint('rug', c.rect(0, 0.9, 1, 1));
		c.part('frame', ['gold', 'brown', 'white', 'charcoal'], 5, 'wall');
		c.part('art', ['sky', 'teal', 'blush', 'lime', 'navy'], 6, 'frame');
		const fx = c.pick([0.08, 0.72]);
		c.paint('frame', c.rect(fx, 0.08, fx + 0.2, 0.3));
		c.paint('art', c.rect(fx + 0.04, 0.11, fx + 0.16, 0.27));
		c.part('strap', ['red', 'cobalt', 'leaf', 'violet'], 4, 'wall');
		c.paint('strap', c.line(0.54, 0.08, 0.86, 0.6, 1.6));
		c.paint('strap', c.line(0.86, 0.6, 0.76, 0.86, 1.6));
		c.part('body', ['caramel', 'amber', 'red', 'tan', 'orange'], 1);
		c.paint('body', c.circ(0.5, 0.72, 0.3));
		c.paint('body', c.circ(0.5, 0.46, 0.22));
		c.part('edge', ['chocolate', 'maroon', 'black'], 4, 'body');
		c.paint(
			'edge',
			c.and(
				c.or(c.circ(0.5, 0.72, 0.3), c.circ(0.5, 0.46, 0.22)),
				c.not(c.or(c.circ(0.5, 0.72, 0.3 - 1.2 / c.w), c.circ(0.5, 0.46, 0.22 - 1.2 / c.w)))
			)
		);
		c.part('hole', DARK, 1);
		c.paint('hole', c.circ(0.5, 0.55, 0.1));
		c.part('neck', ['chocolate', 'brown', 'maroon'], 1);
		c.paint('neck', c.rect(0.46, 0.06, 0.54, 0.5));
		c.paint('neck', c.rect(0.43, 0.02, 0.57, 0.1));
		c.part('bridge', ['chocolate', 'black', 'charcoal'], 3, 'body');
		c.paint('bridge', c.rect(0.4, 0.74, 0.6, 0.78));
		c.part('peg', ['silver', 'white', 'cream', 'gold'], 6, 'neck', 3);
		for (const y of [0.03, 0.07]) {
			c.paint('peg', c.rect(0.4, y, 0.43, y + 1 / c.h));
			c.paint('peg', c.rect(0.57, y, 0.6, y + 1 / c.h));
		}
		c.part('pick', ['lime', 'pink', 'yellow', 'aqua'], 7, 'body', 3);
		c.paint(
			'pick',
			c.poly([
				[0.62, 0.66],
				[0.68, 0.66],
				[0.65, 0.71]
			])
		);
		c.part('fret', ['silver', 'gold', 'white', 'cream'], 5, 'neck');
		for (let y = 0.14; y < 0.46; y += 0.07)
			c.paintOver('fret', c.rect(0, y, 1, y + 1 / c.h), ['neck']);
		return c.cycle(['Guitar', 'Acoustic Guitar', 'Old Guitar'], 9);
	}
};

const gem: Template = {
	id: 'gem',
	aspect: 1,
	draw(c) {
		const v = c.cycle([
			{
				name: 'Sapphire',
				tones: [
					['ice', 'aqua'],
					['azure', 'sky'],
					['cobalt', 'blue'],
					['navy', 'indigo']
				]
			},
			{
				name: 'Ruby',
				tones: [
					['blush', 'peach'],
					['coral', 'pink'],
					['red', 'crimson'],
					['maroon', 'plum']
				]
			},
			{
				name: 'Emerald',
				tones: [
					['mint', 'lime'],
					['leaf', 'lime'],
					['green', 'teal'],
					['pine', 'forest']
				]
			},
			{
				name: 'Amethyst',
				tones: [
					['lilac', 'blush'],
					['orchid', 'lavender'],
					['violet', 'magenta'],
					['purple', 'plum']
				]
			}
		]);
		c.part('bg', ['night', 'charcoal', 'cream', 'beige', 'black', 'slate'], 2);
		c.fill('bg');
		c.part('cushion', ['crimson', 'navy', 'purple', 'teal', 'forest', 'maroon'], 3, 'bg');
		c.paint('cushion', c.ell(0.5, 1.02, 0.6, 0.18));
		c.part('tassel', ['gold', 'yellow', 'amber'], 6, 'bg', 4);
		c.paint('tassel', c.ell(0.06, 0.9, 0.03, 0.06));
		c.paint('tassel', c.ell(0.94, 0.9, 0.03, 0.06));
		c.part('ray', ['white', 'cream', 'lemon', 'silver'], 7, 'bg');
		for (const a of [-0.9, -0.5, 0.5, 0.9])
			c.paintOver('ray', c.line(0.5, 0.5, 0.5 + Math.sin(a) * 0.7, 0.5 - Math.cos(a) * 0.7, 1.4), [
				'bg'
			]);
		const tone = (k: number, pri: number, orElse?: string) => {
			c.part(`tone${k}`, v.tones[k], pri, orElse);
			return `tone${k}`;
		};
		const t0 = tone(1, 1);
		const t1 = tone(2, 1);
		const t2 = tone(0, 3, t0);
		const t3 = tone(3, 3, t1);
		const top = 0.18;
		const mid = 0.4;
		const L = 0.1;
		const R = 0.9;
		const xs = [L, 0.3, 0.5, 0.7, R];
		const crown = (i: number) =>
			c.poly([
				[xs[i], mid],
				[xs[i + 1], mid],
				[0.5 + (xs[i + 1] - 0.5) * 0.6, top],
				[0.5 + (xs[i] - 0.5) * 0.6, top]
			]);
		[t2, t0, t1, t3].forEach((p, i) => c.paint(p, crown(i)));
		const tip: [number, number] = [0.5, 0.92];
		const pav = (i: number) => c.poly([[xs[i], mid], [xs[i + 1], mid], tip]);
		[t0, t1, t3, t1].forEach((p, i) => c.paint(p, pav(i)));
		c.paint(
			t2,
			c.poly([
				[0.38, top],
				[0.62, top],
				[0.5, 0.3]
			])
		);
		c.part('spark', ['white', 'snow', 'lemon'], 4, 'bg', 4);
		for (const [x, y] of [
			[0.84, 0.14],
			[0.12, 0.7],
			[0.88, 0.62]
		].slice(0, c.more(1, 3))) {
			c.paint('spark', c.shape(['rect', Math.floor(x * c.w) - 2, Math.floor(y * c.h), 5, 1]));
			c.paint('spark', c.shape(['rect', Math.floor(x * c.w), Math.floor(y * c.h) - 2, 1, 5]));
		}
		return v.name;
	}
};

const lanterns: Template = {
	id: 'lanterns',
	aspect: 1.25,
	draw(c) {
		const time = c.cycle<Time>(['night', 'dusk', 'night']);
		sky(c, time);
		sun(c, time, c.pick([0.15, 0.85]), 0.6, 0.08, 5);
		if (time === 'night') stars(c, c.more(1, 4), 0, 0.4, 1, 0.7);
		glow(c, time, 0.5, 0.8, 3);
		c.part('roof', ['charcoal', 'black', 'slate', 'plum'], 3, 'sky');
		c.paint(
			'roof',
			c.poly([
				[0, 0.86],
				[0.1, 0.74],
				[0.4, 0.74],
				[0.5, 0.86],
				[0.6, 0.78],
				[0.92, 0.78],
				[1, 0.86],
				[1, 1],
				[0, 1]
			])
		);
		c.part('cord', ['white', 'cream', 'gold', 'silver'], 4, 'sky', 4);
		c.paint('cord', (x, y) => Math.abs((y - (0.08 + 0.1 * Math.sin(x * Math.PI))) * c.h) < 0.6);
		const cols = [
			['red', 'crimson'],
			['orange', 'amber'],
			['yellow', 'gold'],
			['pink', 'magenta']
		];
		c.part('cap', ['gold', 'chocolate', 'black', 'brown'], 3, 'lamp0', 3);
		c.part('tassel', ['gold', 'yellow', 'red', 'orange'], 6, 'sky', 4);
		c.part('tree', ['pine', 'forest', 'black', 'charcoal'], 5, 'roof');
		c.paint('tree', c.circ(0.05, 0.72, 0.12));
		c.paint('tree', c.circ(0.96, 0.74, 0.1));
		const n = c.more(3, 5);
		for (let k = 0; k < n; k++) {
			const x = (k + 0.5) / n;
			const y = 0.08 + 0.1 * Math.sin(x * Math.PI) + 0.14;
			const p = `lamp${k % 4}`;
			c.part(p, cols[k % 4], k % 4 === 0 ? 1 : 3 + (k % 4), 'lamp0');
			c.paint(p, c.ell(x, y, 0.38 / n, 0.12 * (3 / n) ** 0.4));
			c.paint('tassel', c.rect(x - 0.4 / c.w, y + 0.13, x + 0.6 / c.w, y + 0.2));
			c.paint('cap', c.rect(x - 0.03, y - 0.13, x + 0.03, y - 0.1));
			c.paint('cap', c.rect(x - 0.03, y + 0.1, x + 0.03, y + 0.13));
			c.paint('cord', c.rect(x - 0.4 / c.w, y - 0.15, x + 0.6 / c.w, y - 0.12));
		}
		return timed(time, c.use % 2 ? 'Lantern Festival' : 'Paper Lanterns', c.use);
	}
};

const gift: Template = {
	id: 'gift',
	aspect: 1,
	draw(c) {
		c.part('bg', ['mint', 'sky', 'blush', 'lemon', 'lilac', 'teal'], 2);
		c.fill('bg');
		c.part('floor', [...WOOD, 'slate'], 5, 'bg');
		c.paint('floor', c.rect(0, 0.88, 1, 1));
		c.part('box', ['red', 'cobalt', 'leaf', 'violet', 'magenta'], 1);
		c.part('ribbon', ['gold', 'yellow', 'white', 'silver'], 1);
		c.paint('box', c.rect(0.2, 0.42, 0.8, 0.9));
		c.part('lid', ['crimson', 'navy', 'green', 'purple', 'maroon'], 3, 'box');
		c.paint('lid', c.rect(0.16, 0.34, 0.84, 0.44));
		c.part('dot', ['white', 'cream', 'pink', 'lemon'], 5, 'box', 4);
		for (let y = 0.52; y < 0.88; y += 0.12)
			for (let x = 0.26; x < 0.8; x += 0.12)
				c.paintOver('dot', c.circ(x + ((y * 10) % 2) * 0.03, y, 0.03), ['box']);
		c.paint('ribbon', c.rect(0.46, 0.34, 0.54, 0.9));
		c.paint('ribbon', c.and(c.rect(0.2, 0.6, 0.8, 0.66), c.not(c.rect(0, 0, 1, 0.34))));
		c.paint('ribbon', c.ell(0.38, 0.27, 0.11, 0.07));
		c.paint('ribbon', c.ell(0.62, 0.27, 0.11, 0.07));
		c.part('knot', ['orange', 'amber', 'caramel', 'gold'], 6, 'ribbon', 4);
		c.paint('knot', c.ell(0.5, 0.31, 0.04, 0.04));
		c.part('box2', ['teal', 'orange', 'pink', 'lime'], 4, 'bg');
		c.part('ribbon2', ['white', 'snow', 'cream'], 6, 'box2');
		if (c.t > 0.35) {
			c.paint('box2', c.rect(0.82, 0.66, 0.98, 0.9));
			c.paint('ribbon2', c.rect(0.88, 0.66, 0.92, 0.9));
			c.paint('box2', c.rect(0.02, 0.72, 0.18, 0.9));
			c.paint('ribbon2', c.rect(0.02, 0.79, 0.18, 0.83));
		}
		return c.t > 0.35 ? c.cycle(['Presents', 'Birthday Presents', 'Wrapped Gifts'], 9) : 'Gift Box';
	}
};

export const THINGS: Template[] = [
	fruit,
	vase,
	cactus,
	candles,
	books,
	car,
	train,
	plane,
	submarine,
	bus,
	tugboat,
	tractor,
	icecream,
	cake,
	pizza,
	watermelon,
	burger,
	cupcake,
	donut,
	planet,
	ufo,
	astronaut,
	kite,
	guitar,
	gem,
	lanterns,
	gift
];
