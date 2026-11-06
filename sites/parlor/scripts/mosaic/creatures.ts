/* Mosaic picture templates: animals and plants. */
import {
	clouds,
	DARK_GRASS,
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

const EYE = ['black', 'charcoal', 'chocolate', 'navy'];
const LIGHT_BG = ['mint', 'sky', 'lemon', 'blush', 'ice', 'lilac', 'cream', 'peach', 'aqua'];

/** Pupils and the like: black dots, min 3 cells. */
function eyes(c: Canvas, pts: [number, number][], r: number, pri: number, orElse: string) {
	c.part('eye', EYE, pri, orElse, 3);
	for (const [x, y] of pts) c.paint('eye', c.dot(x, y, r));
}

const cat: Template = {
	id: 'cat',
	aspect: 0.85,
	draw(c) {
		const coat = c.cycle([
			{
				name: 'Ginger Cat',
				body: ['orange', 'amber', 'apricot'],
				belly: ['cream', 'white', 'peach'],
				stripe: ['rust', 'caramel', 'brown']
			},
			{
				name: 'Grey Cat',
				body: ['grey', 'silver', 'steel'],
				belly: ['white', 'snow', 'cream'],
				stripe: ['slate', 'charcoal', 'stone']
			},
			{
				name: 'Black Cat',
				body: ['charcoal', 'black'],
				belly: ['white', 'snow', 'silver'],
				stripe: ['slate', 'stone']
			},
			{
				name: 'Tabby Cat',
				body: ['tan', 'caramel', 'sand'],
				belly: ['cream', 'white'],
				stripe: ['brown', 'chocolate', 'rust']
			}
		]);
		const night = c.chance(0.5);
		c.part('wall', ['sage', 'mint', 'lilac', 'blush', 'teal', 'lavender', 'beige', 'sky'], 2);
		c.fill('wall');
		c.part('window', night ? ['night', 'navy', 'indigo'] : ['sky', 'azure', 'ice'], 5, 'wall');
		c.part('frame', ['white', 'snow', 'cream', 'brown'], 6, 'wall');
		const wx = c.chance(0.5) ? 0.06 : 0.6;
		c.paint('frame', c.rect(wx, 0.06, wx + 0.34, 0.44));
		c.paint('window', c.rect(wx + 0.04, 0.09, wx + 0.3, 0.41));
		c.paint('frame', c.rect(wx + 0.16, 0.06, wx + 0.18, 0.44));
		if (night) {
			c.part('moon', ['cream', 'lemon', 'yellow'], 7, 'window');
			c.paint('moon', c.and(c.circ(wx + 0.25, 0.18, 0.06), c.rect(wx + 0.18, 0, 1, 1)));
		}
		c.part('floor', [...WOOD, 'tan', 'stone', 'slate'], 3, 'wall');
		c.paint('floor', c.rect(0, 0.84, 1, 1));
		c.part('cushion', ['red', 'crimson', 'cobalt', 'violet', 'teal', 'pink'], 4, 'floor');
		c.paint('cushion', c.ell(0.5, 0.88, 0.42, 0.08));

		c.part('body', coat.body, 1);
		c.paint('body', c.ell(0.5, 0.66, 0.27, 0.22));
		c.paint('body', c.circ(0.5, 0.36, 0.2));
		c.paint(
			'body',
			c.poly([
				[0.3, 0.36],
				[0.31, 0.12],
				[0.46, 0.24]
			])
		);
		c.paint(
			'body',
			c.poly([
				[0.7, 0.36],
				[0.69, 0.12],
				[0.54, 0.24]
			])
		);
		c.paint('body', c.line(0.72, 0.82, 0.88, 0.7, 3));
		c.paint('body', c.line(0.88, 0.7, 0.86, 0.5, 3));
		c.part('inear', ['pink', 'rose', 'blush', 'salmon'], 6, 'body');
		c.paint(
			'inear',
			c.poly([
				[0.33, 0.3],
				[0.335, 0.17],
				[0.42, 0.25]
			])
		);
		c.paint(
			'inear',
			c.poly([
				[0.67, 0.3],
				[0.665, 0.17],
				[0.58, 0.25]
			])
		);
		c.part('belly', coat.belly, 3, 'body');
		c.paint('belly', c.ell(0.5, 0.72, 0.13, 0.15));
		if (c.t > 0.3 && (coat.name === 'Ginger Cat' || coat.name === 'Tabby Cat')) {
			c.part('stripe', coat.stripe, 4, 'body');
			for (const y of [0.54, 0.62, 0.7]) {
				c.paintOver('stripe', c.line(0.23, y, 0.31, y + 0.04, 1.3), ['body']);
				c.paintOver('stripe', c.line(0.77, y, 0.69, y + 0.04, 1.3), ['body']);
			}
			for (const x of [0.44, 0.5, 0.56])
				c.paintOver('stripe', c.line(x, 0.18, x, 0.25, 1.2), ['body']);
		}
		c.part('iris', ['lime', 'yellow', 'gold', 'leaf', 'turquoise'], 3, 'body', 3);
		c.paint('iris', c.ell(0.41, 0.34, 0.05, 0.03));
		c.paint('iris', c.ell(0.59, 0.34, 0.05, 0.03));
		c.part('nose', ['pink', 'rose', 'salmon', 'coral'], 5, 'belly', 3);
		c.paint(
			'nose',
			c.poly([
				[0.46, 0.4],
				[0.54, 0.4],
				[0.5, 0.45]
			])
		);
		if (c.chance(0.5)) c.mirror();
		return night ? `${coat.name} at Night` : coat.name;
	}
};

const fox: Template = {
	id: 'fox',
	aspect: 1,
	draw(c) {
		const v = c.cycle([
			{ name: 'Red Fox', bg: ['sage', 'mint', 'leaf', 'lime'], ground: DARK_GRASS, trees: WOOD },
			{
				name: 'Fox in the Snow',
				bg: ['ice', 'sky', 'silver', 'azure'],
				ground: ['snow', 'white'],
				trees: ['slate', 'charcoal', 'stone']
			},
			{
				name: 'Autumn Fox',
				bg: ['gold', 'yellow', 'lemon', 'sand'],
				ground: ['rust', 'brown', 'caramel'],
				trees: ['chocolate', 'brown']
			},
			{
				name: 'Night Fox',
				bg: ['night', 'navy', 'indigo'],
				ground: ['forest', 'pine', 'plum'],
				trees: ['slate', 'purple']
			}
		]);
		c.part('bg', v.bg, 2);
		c.fill('bg');
		c.part('trunk', v.trees, 6, 'bg');
		for (const x of [0.08, 0.92]) c.paint('trunk', c.rect(x - 0.045, 0, x + 0.045, 1));
		if (v.name === 'Night Fox') {
			c.part('moon', ['cream', 'lemon', 'white'], 5, 'bg');
			c.paint('moon', c.circ(0.85, 0.12, 0.08));
		}
		hills(c, 'ground', v.ground, 4, 0.82, 0.02, 1, 'bg');
		c.part(
			'canopy',
			v.name === 'Fox in the Snow'
				? ['white', 'snow', 'silver']
				: ['forest', 'pine', 'olive', 'green', 'rust'],
			5,
			'bg'
		);
		c.paint('canopy', c.ell(0.02, 0.02, 0.2, 0.12));
		c.paint('canopy', c.ell(0.98, 0.04, 0.18, 0.1));
		c.part('fern', ['leaf', 'lime', 'olive', 'sage', 'teal'], 6, 'ground');
		for (const x of [0.08, 0.92])
			c.paint(
				'fern',
				c.poly([
					[x - 0.08, 1],
					[x, 0.72],
					[x + 0.08, 1]
				])
			);
		c.part('flower', ['yellow', 'pink', 'white', 'violet', 'red'], 7, 'ground', 4);
		for (const x of [0.2, 0.8]) c.paint('flower', c.dot(x, 0.92, 1.3));
		c.part('fur', ['orange', 'amber', 'rust', 'apricot'], 1);
		c.paint('fur', c.ell(0.5, 0.36, 0.32, 0.14));
		c.paint(
			'fur',
			c.poly([
				[0.18, 0.34],
				[0.82, 0.34],
				[0.62, 0.74],
				[0.5, 0.86],
				[0.38, 0.74]
			])
		);
		c.paint(
			'fur',
			c.poly([
				[0.19, 0.36],
				[0.22, 0.04],
				[0.44, 0.25]
			])
		);
		c.paint(
			'fur',
			c.poly([
				[0.81, 0.36],
				[0.78, 0.04],
				[0.56, 0.25]
			])
		);
		c.part('inear', ['chocolate', 'black', 'charcoal', 'maroon'], 4, 'fur');
		c.paint(
			'inear',
			c.poly([
				[0.24, 0.3],
				[0.245, 0.11],
				[0.38, 0.24]
			])
		);
		c.paint(
			'inear',
			c.poly([
				[0.76, 0.3],
				[0.755, 0.11],
				[0.62, 0.24]
			])
		);
		c.part('cheek', ['white', 'snow', 'cream'], 1, 'fur');
		c.paint(
			'cheek',
			c.poly([
				[0.17, 0.42],
				[0.36, 0.52],
				[0.5, 0.6],
				[0.64, 0.52],
				[0.83, 0.42],
				[0.62, 0.74],
				[0.5, 0.87],
				[0.38, 0.74]
			])
		);
		eyes(c, [], 0, 3, 'fur');
		c.paint('eye', c.ell(0.37, 0.43, 0.055, 0.028));
		c.paint('eye', c.ell(0.63, 0.43, 0.055, 0.028));
		c.paint('eye', c.ell(0.5, 0.84, 0.05, 0.035));
		return v.name;
	}
};

const owl: Template = {
	id: 'owl',
	aspect: 0.8,
	draw(c) {
		const time = c.cycle<Time>(['night', 'dusk', 'night', 'dawn']);
		const snowy = c.use === 2;
		sky(c, time);
		sun(c, time, c.pick([0.18, 0.82]), 0.12, 0.1, 4);
		if (time === 'night') stars(c, c.more(2, 6), 0, 0, 1, 0.5);
		c.part('branch', WOOD, 2);
		c.paint('branch', c.line(-0.1, 0.88, 1.1, 0.82, 3.5));
		c.part('leaf', GRASS, 5, 'branch');
		c.paint('leaf', c.ell(0.1, 0.8, 0.09, 0.05));
		c.paint('leaf', c.ell(0.93, 0.76, 0.08, 0.05));
		c.part('leaf2', ['orange', 'rust', 'gold', 'red'], 6, 'leaf');
		c.paint('leaf2', c.ell(0.06, 0.9, 0.07, 0.04));
		c.paint('leaf2', c.ell(0.96, 0.86, 0.06, 0.04));
		c.part('cloud', ['slate', 'steel', 'lilac', 'grey'], 7, 'sky');
		c.paint('cloud', c.ell(0.15, 0.3, 0.14, 0.04));
		c.paint('cloud', c.ell(0.88, 0.22, 0.12, 0.035));
		c.part(
			'body',
			snowy ? ['white', 'snow', 'cream'] : ['brown', 'caramel', 'tan', 'stone', 'chocolate'],
			1
		);
		c.paint('body', c.ell(0.5, 0.57, 0.3, 0.3));
		c.paint(
			'body',
			c.poly([
				[0.22, 0.38],
				[0.25, 0.14],
				[0.42, 0.3]
			])
		);
		c.paint(
			'body',
			c.poly([
				[0.78, 0.38],
				[0.75, 0.14],
				[0.58, 0.3]
			])
		);
		c.part(
			'wing',
			snowy ? ['silver', 'grey', 'ice'] : ['chocolate', 'brown', 'rust', 'slate'],
			4,
			'body'
		);
		c.paint('wing', c.ell(0.24, 0.64, 0.08, 0.19));
		c.paint('wing', c.ell(0.76, 0.64, 0.08, 0.19));
		c.part(
			'belly',
			snowy ? ['silver', 'ice', 'grey'] : ['beige', 'cream', 'sand', 'peach'],
			3,
			'body'
		);
		c.paint('belly', c.ell(0.5, 0.71, 0.16, 0.15));
		c.part('face', ['cream', 'white', 'beige', 'sand'], 3, 'body');
		c.paint('face', c.circ(0.37, 0.42, 0.14));
		c.paint('face', c.circ(0.63, 0.42, 0.14));
		c.part('iris', ['yellow', 'gold', 'orange', 'lemon'], 1, 'face');
		c.paint('iris', c.circ(0.37, 0.42, 0.085));
		c.paint('iris', c.circ(0.63, 0.42, 0.085));
		eyes(
			c,
			[
				[0.37, 0.42],
				[0.63, 0.42]
			],
			1.3,
			2,
			'iris'
		);
		c.part('beak', ['orange', 'amber', 'gold', 'tan'], 5, 'face', 3);
		c.paint(
			'beak',
			c.poly([
				[0.45, 0.5],
				[0.55, 0.5],
				[0.5, 0.59]
			])
		);
		c.paint('beak', c.ell(0.42, 0.86, 0.05, 0.025));
		c.paint('beak', c.ell(0.58, 0.86, 0.05, 0.025));
		return timed(time, snowy ? 'Snowy Owl' : 'Owl', c.use);
	}
};

const penguin: Template = {
	id: 'penguin',
	aspect: 0.85,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'dawn']);
		sky(c, time);
		sun(c, time, c.pick([0.2, 0.8]), 0.14, 0.09, 4);
		clouds(c, time, c.more(1, 2), 0.08, 0.22, 6);
		c.part('sea', WATER, 4, 'sky');
		c.paint('sea', c.rect(0, 0.5, 1, 1));
		c.part('berg', ['ice', 'snow', 'silver', 'white', 'aqua'], 5, 'sky');
		const bx = c.pick([0.15, 0.85]);
		c.paint(
			'berg',
			c.poly([
				[bx - 0.2, 0.5],
				[bx - 0.08, 0.3],
				[bx + 0.02, 0.36],
				[bx + 0.1, 0.26],
				[bx + 0.2, 0.5]
			])
		);
		hills(c, 'ice', ['white', 'snow', 'ice', 'silver'], 2, 0.74, 0.02, 1.2);
		c.part('shadow', ['lilac', 'lavender', 'sky', 'steel'], 6, 'ice');
		c.paint('shadow', c.ell(0.55, 0.92, 0.26, 0.04));
		c.part('crack', ['azure', 'teal', 'steel', 'cobalt'], 7, 'ice', 4);
		c.paint('crack', c.line(0.05, 0.84, 0.25, 0.8, 1));
		c.paint('crack', c.line(0.75, 0.96, 0.95, 0.86, 1));
		c.part('body', ['black', 'charcoal', 'navy'], 1);
		c.paint('body', c.ell(0.5, 0.57, 0.23, 0.32));
		c.paint('body', c.circ(0.5, 0.26, 0.16));
		c.paint(
			'body',
			c.poly([
				[0.28, 0.42],
				[0.2, 0.72],
				[0.3, 0.68]
			])
		);
		c.paint(
			'body',
			c.poly([
				[0.72, 0.42],
				[0.8, 0.72],
				[0.7, 0.68]
			])
		);
		c.part('belly', ['white', 'snow', 'cream'], 1, 'body');
		c.paint('belly', c.ell(0.5, 0.62, 0.15, 0.26));
		c.paint('belly', c.ell(0.5, 0.31, 0.11, 0.07));
		c.part('beak', ['orange', 'gold', 'amber', 'yellow'], 3, 'body', 3);
		c.paint(
			'beak',
			c.poly([
				[0.46, 0.33],
				[0.54, 0.33],
				[0.5, 0.4]
			])
		);
		c.paint('beak', c.ell(0.39, 0.4, 0.04, 0.04));
		c.paint('beak', c.ell(0.42, 0.9, 0.07, 0.03));
		c.paint('beak', c.ell(0.58, 0.9, 0.07, 0.03));
		c.part('pupil', ['black', 'charcoal', 'navy', 'slate'], 4, 'belly', 3);
		c.paint('pupil', c.dot(0.44, 0.29, 1.1));
		c.paint('pupil', c.dot(0.56, 0.29, 1.1));
		if (c.t > 0.35) {
			c.part('chick', ['grey', 'silver', 'stone'], 5, 'ice');
			const x = c.pick([0.14, 0.86]);
			c.paint('chick', c.ell(x, 0.85, 0.08, 0.09));
			c.paint('chick', c.circ(x, 0.73, 0.06));
		}
		return timed(time, c.use === 1 ? 'Emperor Penguin' : 'Penguin', c.use);
	}
};

const frog: Template = {
	id: 'frog',
	aspect: 1.2,
	draw(c) {
		const v = c.cycle([
			{ name: 'Frog on a Lily Pad', body: ['lime', 'leaf'], eye: ['yellow', 'gold', 'lemon'] },
			{ name: 'Tree Frog', body: ['leaf', 'lime', 'green'], eye: ['red', 'orange', 'coral'] },
			{ name: 'Pond Frog', body: ['olive', 'sage', 'leaf'], eye: ['gold', 'yellow', 'amber'] }
		]);
		c.part('water', ['azure', 'blue', 'teal', 'turquoise', 'navy'], 2);
		c.fill('water');
		c.part('ripple', ['sky', 'aqua', 'ice', 'cobalt'], 7, 'water');
		for (let k = 0; k < c.more(1, 4); k++) {
			const x = c.r(0.1, 0.9);
			const y = c.r(0.08, 0.3);
			c.paint('ripple', c.and(c.oval(x, y, 0.16, 0.06), c.not(c.oval(x, y, 0.12, 0.035))));
		}
		c.part('pad', ['forest', 'green', 'olive', 'pine'], 2);
		c.paint(
			'pad',
			c.and(
				c.oval(0.5, 0.74, 0.62, 0.3),
				c.not(
					c.poly([
						[0.5, 0.74],
						[0.68, 1.1],
						[0.84, 1.1]
					])
				)
			)
		);
		c.paint('pad', c.circ(0.12, 0.2, 0.12));
		c.part('vein', ['olive', 'leaf', 'lime', 'forest'], 7, 'pad');
		c.paint('vein', c.and(c.line(0.5, 0.74, 0.18, 0.74, 1.2), c.oval(0.5, 0.74, 0.55, 0.26)));
		c.part('frog', v.body, 1);
		c.paint('frog', c.oval(0.5, 0.57, 0.24, 0.2));
		c.paint('frog', c.oval(0.5, 0.42, 0.21, 0.15));
		c.paint('frog', c.circ(0.4, 0.3, 0.1));
		c.paint('frog', c.circ(0.6, 0.3, 0.1));
		c.paint('frog', c.oval(0.32, 0.68, 0.13, 0.08));
		c.paint('frog', c.oval(0.68, 0.68, 0.13, 0.08));
		c.paint('frog', c.oval(0.3, 0.79, 0.1, 0.04));
		c.paint('frog', c.oval(0.7, 0.79, 0.1, 0.04));
		c.part('belly', ['lemon', 'cream', 'yellow', 'mint'], 4, 'frog');
		c.paint('belly', c.oval(0.5, 0.62, 0.13, 0.13));
		c.part('eyew', v.eye, 3, 'frog', 3);
		c.paint('eyew', c.circ(0.4, 0.29, 0.065));
		c.paint('eyew', c.circ(0.6, 0.29, 0.065));
		eyes(
			c,
			[
				[0.4, 0.29],
				[0.6, 0.29]
			],
			1.1,
			3,
			'eyew'
		);
		c.part('mouth', ['forest', 'pine', 'black'], 7, 'frog', 4);
		c.paint('mouth', c.line(0.42, 0.47, 0.58, 0.47, 1.1));
		c.part('lotus', ['pink', 'rose', 'white', 'magenta', 'blush'], 4, 'water');
		const lx = c.pick([0.86, 0.14]);
		c.paint('lotus', c.oval(lx, 0.48, 0.09, 0.06));
		c.paint(
			'lotus',
			c.poly([
				[lx - 0.08, 0.46],
				[lx - 0.04, 0.34],
				[lx, 0.44],
				[lx + 0.04, 0.34],
				[lx + 0.08, 0.46]
			])
		);
		c.part('reed', ['olive', 'sage', 'lime', 'green'], 6, 'water');
		for (const x of [0.03, 0.06]) c.paint('reed', c.line(x, 1, x + 0.02, 0.35, 1.5));
		return v.name;
	}
};

const butterfly: Template = {
	id: 'butterfly',
	aspect: 1.15,
	draw(c) {
		const v = c.cycle([
			{
				name: 'Monarch Butterfly',
				wing: ['orange', 'amber'],
				edge: ['black', 'charcoal'],
				spot: ['white', 'snow']
			},
			{
				name: 'Blue Butterfly',
				wing: ['azure', 'blue', 'cobalt'],
				edge: ['black', 'navy', 'night'],
				spot: ['white', 'aqua']
			},
			{
				name: 'Lemon Butterfly',
				wing: ['yellow', 'lemon', 'gold'],
				edge: ['black', 'charcoal', 'chocolate'],
				spot: ['orange', 'white']
			},
			{
				name: 'Pink Butterfly',
				wing: ['pink', 'rose', 'orchid'],
				edge: ['plum', 'purple', 'black'],
				spot: ['white', 'lemon']
			}
		]);
		c.part('bg', ['mint', 'sky', 'blush', 'lilac', 'lemon', 'ice', 'sage'], 2);
		c.fill('bg');
		c.part('cloud', ['white', 'snow', 'cream'], 7, 'bg');
		c.paint('cloud', c.ell(0.12, 0.08, 0.12, 0.04));
		c.paint('cloud', c.ell(0.86, 0.1, 0.1, 0.035));
		c.part('grass', GRASS, 4, 'bg');
		c.paint('grass', c.below(c.wave(0.92, 0.02, 2, 0)));
		c.part('stem', GRASS, 5, 'bg');
		c.part('bloom', ['red', 'violet', 'pink', 'orange', 'white', 'coral'], 5, 'bg');
		for (const x of [0.12, 0.88]) {
			c.paint('stem', c.line(x, 1, x + 0.02, 0.78, 1.6));
			c.paint('bloom', c.circ(x + 0.02, 0.75, 0.08));
		}
		const wings = (k: number, part: string) => {
			const s = (cells: number) => cells / c.w;
			c.paint(part, c.ell(0.29, 0.34, 0.22 - s(k), 0.26 - k / c.h));
			c.paint(part, c.ell(0.71, 0.34, 0.22 - s(k), 0.26 - k / c.h));
			c.paint(part, c.ell(0.35, 0.68, 0.15 - s(k), 0.17 - k / c.h));
			c.paint(part, c.ell(0.65, 0.68, 0.15 - s(k), 0.17 - k / c.h));
		};
		c.part('edge', v.edge, 1);
		wings(0, 'edge');
		c.part('wing', v.wing, 1, 'edge');
		wings(1.6, 'wing');
		c.part('inner', ['lemon', 'peach', 'ice', 'sky', 'cream', 'lilac'], 4, 'wing');
		c.paint('inner', c.ell(0.38, 0.4, 0.07, 0.1));
		c.paint('inner', c.ell(0.62, 0.4, 0.07, 0.1));
		c.part('spot', v.spot, 3, 'edge', 3);
		for (const [x, y] of [
			[0.12, 0.3],
			[0.16, 0.18],
			[0.27, 0.11],
			[0.24, 0.8],
			[0.32, 0.86]
		]) {
			c.paintOver('spot', c.dot(x, y, 1.1), ['edge', 'wing']);
			c.paintOver('spot', c.dot(1 - x, y, 1.1), ['edge', 'wing']);
		}
		c.part('body', ['chocolate', 'charcoal', 'black', 'plum'], 2, undefined, 4);
		c.paint('body', c.ell(0.5, 0.52, 0.03, 0.3));
		c.paint('body', c.circ(0.5, 0.22, 0.05));
		c.paint('body', c.line(0.49, 0.2, 0.42, 0.04, 1));
		c.paint('body', c.line(0.51, 0.2, 0.58, 0.04, 1));
		return v.name;
	}
};

const parrot: Template = {
	id: 'parrot',
	aspect: 0.8,
	draw(c) {
		const v = c.cycle([
			{
				name: 'Scarlet Parrot',
				body: ['red', 'crimson'],
				wing: ['blue', 'cobalt', 'azure'],
				band: ['yellow', 'gold']
			},
			{
				name: 'Green Parrot',
				body: ['leaf', 'lime', 'green'],
				wing: ['blue', 'cobalt', 'turquoise'],
				band: ['red', 'orange']
			},
			{
				name: 'Blue Parrot',
				body: ['azure', 'blue', 'cobalt'],
				wing: ['navy', 'indigo', 'teal'],
				band: ['gold', 'yellow', 'lemon']
			}
		]);
		c.part('bg', ['mint', 'sage', 'ice', 'lemon', 'blush', 'sky'], 2);
		c.fill('bg');
		c.part('leaf', DARK_GRASS.concat(['teal']), 4, 'bg');
		for (const [x, y, s] of [
			[0.05, 0.2, 1],
			[0.95, 0.45, -1],
			[0.1, 0.62, 1]
		]) {
			c.paint(
				'leaf',
				c.poly([
					[x, y],
					[x + s * 0.26, y - 0.08],
					[x + s * 0.42, y + 0.02],
					[x + s * 0.2, y + 0.08]
				])
			);
		}
		c.part('branch', WOOD, 2);
		c.paint('branch', c.line(-0.1, 0.8, 1.1, 0.72, 3.5));
		c.part('body', v.body, 1);
		c.paint('body', c.circ(0.52, 0.24, 0.17));
		c.paint('body', c.ell(0.54, 0.5, 0.2, 0.22));
		c.paint(
			'body',
			c.poly([
				[0.46, 0.66],
				[0.62, 0.66],
				[0.58, 1],
				[0.5, 1]
			])
		);
		c.part('wing', v.wing, 1, 'body');
		c.paint('wing', c.ell(0.62, 0.53, 0.13, 0.19));
		c.paint(
			'wing',
			c.poly([
				[0.55, 0.66],
				[0.68, 0.66],
				[0.58, 0.96]
			])
		);
		c.part('band', v.band, 3, 'wing');
		c.paintOver('band', c.rect(0, 0.44, 1, 0.52), ['wing']);
		c.part('beak', ['charcoal', 'grey', 'silver', 'cream', 'black'], 3, 'body', 3);
		c.paint(
			'beak',
			c.poly([
				[0.38, 0.17],
				[0.27, 0.24],
				[0.3, 0.36],
				[0.4, 0.31]
			])
		);
		c.part('face', ['white', 'snow', 'cream'], 5, 'body', 4);
		c.paint('face', c.ell(0.47, 0.22, 0.07, 0.05));
		eyes(c, [[0.48, 0.22]], 1, 4, 'face');
		c.part('feet', ['grey', 'charcoal', 'silver', 'stone'], 6, 'branch', 3);
		c.paint('feet', c.ell(0.47, 0.75, 0.05, 0.03));
		c.paint('feet', c.ell(0.6, 0.73, 0.05, 0.03));
		if (c.chance(0.5)) c.mirror();
		return v.name;
	}
};

const snail: Template = {
	id: 'snail',
	aspect: 1.3,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dawn', 'dusk']);
		sky(c, time);
		sun(c, time, c.pick([0.12, 0.88]), 0.16, 0.1, 5);
		clouds(c, time, c.more(1, 2), 0.06, 0.2, 6);
		hills(c, 'grass', GRASS, 2, 0.8, 0.02, 1);
		c.part('shell', ['orange', 'amber', 'caramel', 'gold', 'pink', 'apricot'], 1);
		c.part('band', ['brown', 'rust', 'chocolate', 'maroon'], 3, 'shell');
		const cx = 0.58;
		const cy = 0.46;
		const m = Math.min(c.w, c.h);
		c.paint('shell', c.circ(cx, cy, 0.34));
		const pitch = Math.max(3.6, m * 0.12);
		c.paintOver(
			'band',
			(x, y) => {
				const dx = (x - cx) * c.w;
				const dy = (y - cy) * c.h;
				const r = Math.hypot(dx, dy);
				const th = Math.atan2(dy, dx) / (2 * Math.PI);
				const s = (((r / pitch - th) % 1) + 1) % 1;
				return s < 0.4 && r > 1;
			},
			['shell']
		);
		c.part('body', ['tan', 'sand', 'beige', 'sage', 'grey', 'peach'], 1);
		c.paint(
			'body',
			c.poly([
				[0.12, 0.84],
				[0.95, 0.84],
				[0.9, 0.76],
				[0.3, 0.74],
				[0.25, 0.6],
				[0.14, 0.58]
			])
		);
		c.paint('body', c.oval(0.19, 0.62, 0.09, 0.13));
		c.paint('body', c.line(0.16, 0.56, 0.1, 0.34, 1.5));
		c.paint('body', c.line(0.22, 0.56, 0.24, 0.34, 1.5));
		eyes(
			c,
			[
				[0.1, 0.33],
				[0.24, 0.33]
			],
			1.2,
			5,
			'body'
		);
		c.part('cap', ['red', 'crimson', 'violet', 'coral'], 5, 'sky');
		c.part('stalk', ['white', 'cream', 'snow', 'beige'], 6, 'grass');
		const mx = 0.88;
		c.paint('stalk', c.rect(mx - 0.025, 0.68, mx + 0.025, 0.86));
		c.paint('cap', c.and(c.oval(mx, 0.7, 0.1, 0.08), c.rect(0, 0, 1, 0.7)));
		return timed(time, c.use === 1 ? 'Garden Snail' : 'Snail', c.use);
	}
};

const ladybug: Template = {
	id: 'ladybug',
	aspect: 1,
	draw(c) {
		const v = c.cycle([
			{ name: 'Ladybug', shell: ['red', 'crimson'] },
			{ name: 'Yellow Ladybug', shell: ['yellow', 'gold'] },
			{ name: 'Orange Ladybug', shell: ['orange', 'amber'] }
		]);
		c.part('bg', LIGHT_BG, 2);
		c.fill('bg');
		c.part('leaf', ['green', 'leaf', 'lime', 'olive'], 2);
		c.paint(
			'leaf',
			c.poly([
				[0.02, 0.98],
				[0.1, 0.4],
				[0.4, 0.12],
				[0.98, 0.04],
				[0.9, 0.5],
				[0.6, 0.88]
			])
		);
		c.part('vein', ['lime', 'forest', 'mint', 'pine', 'olive'], 5, 'leaf');
		c.paint('vein', c.line(0.05, 0.95, 0.94, 0.08, 1.4));
		c.part('dew', ['ice', 'white', 'aqua'], 6, 'leaf');
		if (c.t > 0.3) c.paint('dew', c.circ(0.78, 0.66, 0.05));
		c.part('petal', ['white', 'snow', 'lilac', 'pink'], 5, 'bg');
		c.part('center', ['yellow', 'gold', 'orange'], 6, 'petal', 4);
		for (let k = 0; k < 6; k++) {
			const a = (k / 6) * 2 * Math.PI;
			c.paint('petal', c.circ(0.06 + Math.cos(a) * 0.08, 0.08 + Math.sin(a) * 0.08, 0.06));
		}
		c.paint('center', c.circ(0.06, 0.08, 0.05));
		const x = 0.5;
		const y = 0.52;
		c.part('head', ['black', 'charcoal'], 1, undefined, 4);
		for (const k of [-1, 1]) {
			for (const dy of [-0.14, 0.02, 0.16])
				c.paint('head', c.line(x, y + dy, x + k * 0.38, y + dy + 0.06, 1.2));
		}
		c.paint('head', c.circ(x, y - 0.27, 0.15));
		c.part('shell', v.shell, 1);
		c.paint('shell', c.circ(x, y, 0.3));
		c.paintOver('head', c.rect(x - 1 / c.w, y - 0.3, x + 1 / c.w, y + 0.3), ['shell']);
		for (const [dx, dy] of [
			[-0.16, -0.12],
			[0.16, -0.12],
			[-0.2, 0.08],
			[0.2, 0.08],
			[-0.1, 0.2],
			[0.1, 0.2]
		]) {
			c.paintOver('head', c.circ(x + dx, y + dy, 0.065), ['shell']);
		}
		c.part('eyew', ['white', 'snow', 'cream'], 4, 'head', 3);
		c.paint('eyew', c.dot(x - 0.07, y - 0.33, 1));
		c.paint('eyew', c.dot(x + 0.07, y - 0.33, 1));
		if (c.chance(0.5)) c.mirror();
		return v.name;
	}
};

const duck: Template = {
	id: 'duck',
	aspect: 1.25,
	draw(c) {
		const v = c.cycle([
			{
				name: 'Mallard',
				head: ['forest', 'green', 'teal'],
				body: ['silver', 'beige', 'grey'],
				ring: ['white', 'snow']
			},
			{ name: 'White Duck', head: ['white', 'snow'], body: ['white', 'snow'], ring: ['cream'] },
			{
				name: 'Duckling',
				head: ['yellow', 'lemon', 'gold'],
				body: ['yellow', 'lemon', 'gold'],
				ring: ['gold']
			}
		]);
		const time = c.cycle<Time>(['day', 'dusk', 'dawn'], 1);
		sky(c, time);
		sun(c, time, 0.85, 0.15, 0.08, 5);
		clouds(c, time, c.more(1, 2), 0.06, 0.2, 7);
		hills(c, 'shore', GRASS, 4, 0.42, 0.03, 1.5, 'sky');
		c.part('water', WATER, 2);
		c.paint('water', c.rect(0, 0.52, 1, 1));
		c.part('ripple', ['sky', 'aqua', 'ice', 'cobalt', 'azure'], 6, 'water');
		for (let k = 0; k < c.more(3, 7); k++) {
			const y = 0.6 + k * 0.06;
			const x = c.r(0.05, 0.75);
			c.paint('ripple', c.line(x, y, x + 0.18, y, 1));
		}
		c.part('body', v.body, 1);
		c.paint('body', c.ell(0.48, 0.66, 0.25, 0.12));
		c.paint(
			'body',
			c.poly([
				[0.22, 0.62],
				[0.12, 0.52],
				[0.3, 0.6]
			])
		);
		c.part('head', v.head, 1, 'body');
		c.paint('head', c.circ(0.66, 0.4, 0.12));
		c.paint('head', c.rect(0.62, 0.42, 0.71, 0.58));
		c.part('wing', ['brown', 'stone', 'caramel', 'tan', 'gold', 'cream'], 3, 'body');
		c.paint('wing', c.ell(0.44, 0.63, 0.15, 0.06));
		if (v.name === 'Mallard') {
			c.part('ring', v.ring, 5, 'head');
			c.paint('ring', c.rect(0.62, 0.53, 0.71, 0.56));
			c.part('chest', ['rust', 'brown', 'chocolate', 'maroon'], 4, 'body');
			c.paint('chest', c.and(c.ell(0.66, 0.64, 0.08, 0.08), c.ell(0.48, 0.66, 0.25, 0.12)));
		}
		c.part('beak', ['orange', 'amber', 'gold', 'yellow'], 2, 'head', 3);
		c.paint('beak', c.ell(0.79, 0.43, 0.06, 0.03));
		eyes(c, [[0.68, 0.37]], 1, 4, 'head');
		c.part('reed', ['olive', 'sage', 'green', 'lime'], 5, 'water');
		c.part('cattail', ['brown', 'chocolate', 'rust'], 7, 'reed');
		for (const x of [0.04, 0.08, 0.95]) {
			c.paint('reed', c.line(x, 1, x, 0.38, 1.2));
			c.paint('cattail', c.ell(x, 0.4, 0.015, 0.06));
		}
		if (c.chance(0.5)) c.mirror();
		return timed(time, v.name, c.use);
	}
};

const whale: Template = {
	id: 'whale',
	aspect: 1.45,
	draw(c) {
		const v = c.cycle([
			{ name: 'Blue Whale', body: ['steel', 'slate', 'blue'], belly: ['ice', 'silver', 'sky'] },
			{ name: 'Orca', body: ['black', 'charcoal'], belly: ['white', 'snow'] },
			{
				name: 'Humpback Whale',
				body: ['slate', 'navy', 'steel'],
				belly: ['silver', 'white', 'grey']
			}
		]);
		const time = c.cycle<Time>(['day', 'dusk', 'dawn'], 1);
		sky(c, time);
		sun(c, time, c.pick([0.15, 0.6]), 0.12, 0.07, 5);
		clouds(c, time, c.more(1, 3), 0.05, 0.15, 6);
		c.part('sea', ['azure', 'blue', 'turquoise', 'teal', 'cobalt'], 2);
		c.paint('sea', c.below(c.wave(0.3, 0.012, 3, 0)));
		c.part('deep', ['navy', 'cobalt', 'indigo', 'night'], 5, 'sea');
		c.paint('deep', c.below(c.wave(0.8, 0.03, 1, c.r(0, 1))));
		c.part('body', v.body, 1);
		c.paint('body', c.ell(0.42, 0.6, 0.32, 0.17));
		c.paint(
			'body',
			c.poly([
				[0.68, 0.52],
				[0.86, 0.36],
				[0.94, 0.4],
				[0.84, 0.56],
				[0.94, 0.72],
				[0.86, 0.76],
				[0.68, 0.66]
			])
		);
		c.paint(
			'body',
			c.poly([
				[0.36, 0.72],
				[0.46, 0.92],
				[0.5, 0.88],
				[0.46, 0.72]
			])
		);
		c.part('belly', v.belly, 3, 'body');
		c.paint('belly', c.and(c.ell(0.38, 0.73, 0.26, 0.08), c.ell(0.42, 0.6, 0.32, 0.17)));
		if (v.name === 'Orca') c.paint('belly', c.ell(0.24, 0.53, 0.06, 0.03));
		c.part('spout', ['white', 'snow', 'ice', 'aqua'], 3, 'sky');
		c.paint('spout', c.line(0.24, 0.42, 0.24, 0.2, 2));
		c.paint('spout', c.circ(0.19, 0.17, 0.06));
		c.paint('spout', c.circ(0.29, 0.17, 0.06));
		eyes(c, [[0.18, 0.6]], 1.1, 4, 'body');
		if (c.t > 0.3) {
			c.part('fish', ['orange', 'yellow', 'coral', 'gold'], 6, 'sea');
			for (let k = 0; k < c.more(1, 4); k++) {
				const x = 0.62 + k * 0.08;
				const y = 0.86 + (k % 2) * 0.05;
				c.paint('fish', c.ell(x, y, 0.025, 0.025));
				c.paint(
					'fish',
					c.poly([
						[x + 0.02, y],
						[x + 0.045, y - 0.03],
						[x + 0.045, y + 0.03]
					])
				);
			}
		}
		if (c.chance(0.5)) c.mirror();
		return v.name;
	}
};

const fish: Template = {
	id: 'fish',
	aspect: 1.3,
	draw(c) {
		const v = c.cycle([
			{
				name: 'Goldfish',
				body: ['orange', 'amber'],
				stripe: ['gold', 'yellow', 'peach'],
				fin: ['peach', 'apricot', 'white']
			},
			{
				name: 'Angelfish',
				body: ['yellow', 'gold', 'lemon'],
				stripe: ['navy', 'cobalt', 'black'],
				fin: ['azure', 'blue']
			},
			{
				name: 'Blue Tang',
				body: ['cobalt', 'blue'],
				stripe: ['navy', 'black'],
				fin: ['yellow', 'gold']
			},
			{
				name: 'Pink Fish',
				body: ['pink', 'rose'],
				stripe: ['white', 'lemon'],
				fin: ['violet', 'purple']
			}
		]);
		c.part('water', ['aqua', 'turquoise', 'sky', 'azure', 'teal'], 2);
		c.fill('water');
		c.part('deep', ['teal', 'blue', 'cobalt', 'navy'], 5, 'water');
		c.paint('deep', c.below(c.wave(0.65, 0.03, 1, c.r(0, 1))));
		c.part('sand', ['sand', 'beige', 'tan', 'cream'], 4, 'water');
		c.paint('sand', c.below(c.wave(0.88, 0.03, 1.5, c.r(0, 1))));
		c.part('weed', GRASS, 4, 'water');
		for (const x0 of [0.08, 0.92, 0.82]) {
			const top = c.r(0.35, 0.55);
			c.paint(
				'weed',
				(x, y) => y > top && y < 0.95 && Math.abs((x - x0 - 0.025 * Math.sin(y * 18)) * c.w) < 1.1
			);
		}
		c.part('body', v.body, 1);
		c.paint('body', c.ell(0.46, 0.46, 0.28, 0.24));
		c.part('fin', v.fin, 1, 'body');
		c.paint(
			'fin',
			c.poly([
				[0.7, 0.46],
				[0.9, 0.24],
				[0.88, 0.68]
			])
		);
		c.paint(
			'fin',
			c.poly([
				[0.32, 0.26],
				[0.5, 0.12],
				[0.62, 0.28]
			])
		);
		c.paint(
			'fin',
			c.poly([
				[0.38, 0.66],
				[0.5, 0.8],
				[0.58, 0.66]
			])
		);
		c.part('stripe', v.stripe, 3, 'body');
		for (const x of [0.32, 0.52]) c.paintOver('stripe', c.rect(x - 0.04, 0, x + 0.04, 1), ['body']);
		c.part('edge', ['black', 'charcoal', 'navy', 'chocolate'], 6, 'body');
		for (const x of [0.32, 0.52]) {
			c.paintOver('edge', c.rect(x - 0.04 - 1 / c.w, 0, x - 0.04, 1), ['body']);
			c.paintOver('edge', c.rect(x + 0.04, 0, x + 0.04 + 1 / c.w, 1), ['body']);
		}
		c.part('eyew', ['white', 'snow', 'cream'], 4, 'body', 3);
		c.paint('eyew', c.dot(0.24, 0.4, 1.7));
		eyes(c, [[0.235, 0.4]], 0.9, 3, 'body');
		c.part('bubble', ['white', 'ice', 'snow'], 6, 'water', 4);
		for (const [x, y] of [
			[0.12, 0.3],
			[0.1, 0.15],
			[0.16, 0.06]
		])
			c.paint('bubble', c.circ(x, y, 0.045));
		if (c.chance(0.5)) c.mirror();
		return v.name;
	}
};

const jellyfish: Template = {
	id: 'jellyfish',
	aspect: 0.8,
	draw(c) {
		const v = c.cycle([
			{ name: 'Jellyfish', bell: ['pink', 'orchid', 'rose'] },
			{ name: 'Moon Jelly', bell: ['lilac', 'lavender', 'blush'] },
			{ name: 'Glowing Jellyfish', bell: ['peach', 'apricot', 'lemon', 'orange'] }
		]);
		c.part('water', ['azure', 'blue', 'turquoise', 'teal'], 2);
		c.fill('water');
		c.part('deep', ['navy', 'cobalt', 'indigo'], 3, 'water');
		c.paint('deep', c.below(c.wave(0.5, 0.03, 1, c.r(0, 1))));
		c.part('abyss', ['night', 'black', 'plum'], 6, 'deep');
		c.paint('abyss', c.below(c.wave(0.82, 0.03, 1.3, c.r(0, 1))));
		c.part('ray', ['sky', 'aqua', 'ice'], 7, 'water');
		for (const x of [0.15, 0.55])
			c.paintOver(
				'ray',
				c.poly([
					[x, 0],
					[x + 0.12, 0],
					[x + 0.32, 0.5],
					[x + 0.24, 0.5]
				]),
				['water']
			);
		const jelly = (x: number, y: number, s: number, bell: string, tent: string) => {
			c.paint(bell, c.and(c.ell(x, y, 0.3 * s, 0.22 * s), c.rect(0, 0, 1, y + 0.02 * s)));
			const n = s < 1 ? 3 : 5;
			for (let k = 0; k < n; k++) {
				const tx = x - 0.22 * s + (k * 0.44 * s) / (n - 1);
				const ph = k * 1.7;
				const len = (0.42 + 0.12 * ((k * 3) % 2)) * s;
				c.paint(
					tent,
					(px, py) =>
						py > y &&
						py < y + len &&
						Math.abs(
							(px - tx - 0.03 * s * Math.sin(((py - y) / len) * 2 * Math.PI * 1.2 + ph)) * c.w
						) < 0.85
				);
			}
		};
		c.part('bell', v.bell, 1);
		c.part('tent', ['lilac', 'peach', 'blush', 'pink', 'white', 'lemon'], 3, 'bell');
		jelly(0.5, 0.36, 1, 'bell', 'tent');
		c.part('inner', ['white', 'blush', 'cream', 'magenta', 'lemon'], 4, 'bell');
		c.paint('inner', c.and(c.ell(0.5, 0.36, 0.15, 0.11), c.rect(0, 0, 1, 0.38)));
		c.part('rim', ['magenta', 'violet', 'coral', 'purple'], 5, 'bell');
		c.paintOver('rim', c.rect(0, 0.36, 1, 0.36 + 1.5 / c.h), ['bell']);
		if (c.t > 0.3) {
			c.part('fish', ['orange', 'yellow', 'gold', 'coral'], 6, 'deep');
			for (let k = 0; k < c.more(2, 5); k++) {
				const x = 0.12 + (k % 3) * 0.1;
				const y = 0.7 + Math.floor(k / 3) * 0.08 + (k % 2) * 0.03;
				c.paint('fish', c.ell(x, y, 0.035, 0.02));
				c.paint(
					'fish',
					c.poly([
						[x + 0.025, y],
						[x + 0.06, y - 0.025],
						[x + 0.06, y + 0.025]
					])
				);
			}
		}
		c.part('bubble', ['white', 'ice', 'snow'], 6, 'water', 4);
		for (const [x, y] of [
			[0.86, 0.2],
			[0.82, 0.32],
			[0.88, 0.42]
		])
			c.paint('bubble', c.circ(x, y, 0.04));
		if (c.chance(0.5)) c.mirror();
		return v.name;
	}
};

const turtle: Template = {
	id: 'turtle',
	aspect: 1.3,
	draw(c) {
		const v = c.cycle([
			{
				name: 'Sea Turtle',
				shell: ['olive', 'brown', 'forest'],
				plate: ['caramel', 'tan', 'sand'],
				skin: ['sage', 'lime', 'mint']
			},
			{
				name: 'Green Turtle',
				shell: ['forest', 'green', 'pine'],
				plate: ['leaf', 'lime', 'sage'],
				skin: ['sand', 'beige', 'tan']
			},
			{
				name: 'Golden Turtle',
				shell: ['chocolate', 'brown', 'rust'],
				plate: ['gold', 'amber', 'yellow'],
				skin: ['tan', 'sand', 'peach']
			}
		]);
		c.part('water', ['turquoise', 'azure', 'teal', 'aqua', 'blue'], 2);
		c.fill('water');
		c.part('ray', ['aqua', 'sky', 'mint', 'ice'], 6, 'water');
		for (const x of [0.05, 0.4, 0.75])
			c.paint(
				'ray',
				c.poly([
					[x, 0],
					[x + 0.1, 0],
					[x + 0.25, 1],
					[x + 0.17, 1]
				])
			);
		c.part('skin', v.skin, 2);
		c.paint('skin', c.oval(0.79, 0.5, 0.12, 0.1));
		c.paint(
			'skin',
			c.poly([
				[0.58, 0.32],
				[0.7, 0.04],
				[0.78, 0.08],
				[0.68, 0.36]
			])
		);
		c.paint(
			'skin',
			c.poly([
				[0.58, 0.68],
				[0.7, 0.96],
				[0.78, 0.92],
				[0.68, 0.64]
			])
		);
		c.paint('skin', c.oval(0.26, 0.26, 0.08, 0.06));
		c.paint('skin', c.oval(0.26, 0.74, 0.08, 0.06));
		c.paint(
			'skin',
			c.poly([
				[0.2, 0.47],
				[0.1, 0.5],
				[0.2, 0.53]
			])
		);
		c.part('shell', v.shell, 1);
		c.paint('shell', c.ell(0.46, 0.5, 0.26, 0.33));
		c.part('plate', v.plate, 1, 'shell');
		const plates = (x: number, y: number, rx: number, ry: number) =>
			c.paintOver('plate', c.ell(x, y, rx, ry), ['shell']);
		plates(0.46, 0.5, 0.08, 0.1);
		for (const dx of [-0.14, 0.14])
			for (const dy of [-0.16, 0.16]) plates(0.46 + dx, 0.5 + dy, 0.06, 0.08);
		plates(0.26, 0.5, 0.04, 0.09);
		plates(0.66, 0.5, 0.04, 0.09);
		eyes(c, [[0.83, 0.46]], 1, 4, 'skin');
		c.part('deep', ['blue', 'cobalt', 'navy', 'teal'], 5, 'water');
		c.paintOver('deep', c.below(c.wave(0.82, 0.03, 1, 0.6)), ['water', 'ray']);
		c.part('sand', ['sand', 'beige', 'cream', 'tan'], 5, 'water');
		c.paint('sand', c.below(c.wave(0.94, 0.02, 1, 0.2)));
		c.part('rock', ['slate', 'stone', 'grey', 'plum'], 7, 'sand');
		c.paint('rock', c.ell(0.9, 0.95, 0.08, 0.07));
		c.part('bubble', ['white', 'ice', 'snow'], 6, 'water', 4);
		for (const [bx, by] of [
			[0.94, 0.3],
			[0.9, 0.18],
			[0.95, 0.08]
		])
			c.paint('bubble', c.circ(bx, by, 0.035));
		c.part('fish', ['orange', 'yellow', 'coral', 'gold'], 7, 'water');
		if (c.t > 0.3) {
			for (const [x, y] of [
				[0.1, 0.12],
				[0.16, 0.18],
				[0.1, 0.86]
			]) {
				c.paint('fish', c.ell(x, y, 0.025, 0.025));
				c.paint(
					'fish',
					c.poly([
						[x + 0.02, y],
						[x + 0.045, y - 0.03],
						[x + 0.045, y + 0.03]
					])
				);
			}
		}
		if (c.chance(0.5)) c.mirror();
		return v.name;
	}
};

const elephant: Template = {
	id: 'elephant',
	aspect: 1.3,
	draw(c) {
		const time = c.cycle<Time>(['dusk', 'day', 'dawn']);
		sky(c, time);
		sun(c, time, 0.58, 0.16, 0.1, 3);
		clouds(c, time, c.more(0, 2), 0.06, 0.16, 7);
		hills(c, 'far', ['lavender', 'lilac', 'rose', 'sage', 'steel'], 5, 0.64, 0.04, 1.2, 'sky');
		hills(c, 'grass', ['sand', 'gold', 'tan', 'olive', 'caramel'], 2, 0.78, 0.015, 1);
		c.part('tuft', ['olive', 'amber', 'rust', 'leaf'], 6, 'grass');
		for (const gx of [0.1, 0.45, 0.9])
			c.paint(
				'tuft',
				c.poly([
					[gx - 0.05, 0.98],
					[gx - 0.02, 0.88],
					[gx, 0.95],
					[gx + 0.02, 0.86],
					[gx + 0.05, 0.98]
				])
			);
		c.part('bird', ['charcoal', 'black', 'chocolate'], 7, 'sky', 4);
		for (const [bx, by] of [
			[0.42, 0.12],
			[0.5, 0.18]
		]) {
			c.paint('bird', c.line(bx - 0.03, by - 0.02, bx, by, 1));
			c.paint('bird', c.line(bx, by, bx + 0.03, by - 0.02, 1));
		}
		c.part('tree', ['olive', 'forest', 'green', 'pine', 'chocolate'], 4, 'sky');
		const tx = c.pick([0.82, 0.88]);
		c.paint('tree', c.line(tx, 0.8, tx + 0.02, 0.42, 2));
		c.paint('tree', c.ell(tx, 0.4, 0.14, 0.06));
		c.part('ele', ['grey', 'silver', 'stone', 'slate'], 1);
		c.paint('ele', c.ell(0.5, 0.5, 0.24, 0.2));
		c.paint('ele', c.circ(0.26, 0.42, 0.15));
		for (const x of [0.33, 0.43, 0.58, 0.67])
			c.paint('ele', c.rect(x - 0.035, 0.5, x + 0.035, 0.86));
		c.paint('ele', c.line(0.17, 0.48, 0.13, 0.78, 3));
		c.paint('ele', c.line(0.13, 0.78, 0.17, 0.82, 2));
		c.paint('ele', c.line(0.73, 0.45, 0.78, 0.62, 1.2));
		if (c.t > 0.35) {
			c.paint('ele', c.ell(0.82, 0.74, 0.08, 0.07));
			c.paint('ele', c.circ(0.75, 0.7, 0.06));
			for (const x of [0.79, 0.85]) c.paint('ele', c.rect(x - 0.015, 0.74, x + 0.015, 0.86));
		}
		c.part('ear', ['slate', 'stone', 'silver', 'rose', 'grey'], 3, 'ele');
		c.paint('ear', c.ell(0.34, 0.42, 0.07, 0.15));
		c.part('tusk', ['white', 'cream', 'snow'], 4, 'ele', 3);
		c.paint('tusk', c.line(0.2, 0.56, 0.11, 0.6, 1.4));
		eyes(c, [[0.23, 0.38]], 1, 5, 'ele');
		if (c.chance(0.5)) c.mirror();
		return timed(time, 'Elephant', c.use);
	}
};

const giraffe: Template = {
	id: 'giraffe',
	aspect: 0.8,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'dawn']);
		sky(c, time);
		sun(c, time, 0.22, 0.14, 0.08, 4);
		clouds(c, time, c.more(0, 2), 0.06, 0.2, 7);
		hills(c, 'grass', ['olive', 'sand', 'gold', 'leaf', 'tan'], 2, 0.86, 0.01, 1);
		c.part('tree', ['forest', 'olive', 'green', 'pine'], 4, 'sky');
		c.paint('tree', c.line(0.12, 0.88, 0.12, 0.5, 2));
		c.paint('tree', c.ell(0.12, 0.48, 0.16, 0.05));
		c.part('coat', ['gold', 'yellow', 'sand', 'apricot'], 1);
		c.paint('coat', c.ell(0.45, 0.6, 0.2, 0.09));
		c.paint(
			'coat',
			c.poly([
				[0.52, 0.6],
				[0.62, 0.6],
				[0.7, 0.2],
				[0.62, 0.2]
			])
		);
		c.paint('coat', c.ell(0.7, 0.17, 0.1, 0.045));
		for (const x of [0.3, 0.38, 0.52, 0.6])
			c.paint('coat', c.rect(x - 0.025, 0.6, x + 0.025, 0.92));
		c.paint('coat', c.line(0.26, 0.58, 0.22, 0.72, 1));
		c.part('patch', ['brown', 'caramel', 'rust', 'chocolate'], 1, 'coat', 4);
		const gap = Math.max(4.2, c.w * 0.14);
		for (let y = 0; y < c.h; y += gap * 0.85) {
			for (let x = ((y / gap) % 2) * gap * 0.5; x < c.w; x += gap) {
				c.paintOver('patch', c.dot((x + 0.5) / c.w, (y + 0.5) / c.h, gap * 0.32), ['coat']);
			}
		}
		c.part('horn', ['chocolate', 'brown', 'black'], 5, 'sky', 3);
		c.paint('horn', c.line(0.66, 0.12, 0.65, 0.06, 1.2));
		c.paint('horn', c.line(0.72, 0.12, 0.73, 0.06, 1.2));
		eyes(c, [[0.69, 0.16]], 0.9, 4, 'coat');
		if (c.chance(0.5)) c.mirror();
		return timed(time, 'Giraffe', c.use);
	}
};

const sheep: Template = {
	id: 'sheep',
	aspect: 1.3,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dawn', 'dusk']);
		sky(c, time);
		sun(c, time, c.pick([0.15, 0.85]), 0.15, 0.09, 4);
		clouds(c, time, c.more(1, 3), 0.05, 0.2, 5);
		hills(c, 'far', ['forest', 'olive', 'sage', 'teal'], 4, 0.44, 0.05, 1.2, 'grass');
		hills(c, 'grass', ['leaf', 'green', 'lime'], 2, 0.6, 0.03, 0.8);
		c.part('crown', ['forest', 'pine', 'olive', 'teal'], 6, 'far');
		c.part('trunk', WOOD, 7, 'crown');
		const tx = c.pick([0.2, 0.8]);
		c.paint('trunk', c.rect(tx - 0.012, 0.32, tx + 0.012, 0.46));
		c.paint('crown', c.circ(tx, 0.3, 0.08));
		c.part('path', ['sand', 'tan', 'beige', 'stone'], 6, 'grass');
		c.paint(
			'path',
			c.poly([
				[0.62, 0.62],
				[0.68, 0.62],
				[0.9, 1],
				[0.72, 1]
			])
		);
		c.part('fence', ['white', 'brown', 'caramel', 'cream'], 5, 'grass');
		for (const y of [0.5, 0.58]) c.paint('fence', c.rect(0, y, 1, y + 1 / c.h));
		for (let x = 0.04; x < 1; x += 0.16) c.paint('fence', c.rect(x, 0.46, x + 1.5 / c.w, 0.64));
		const one = (x: number, y: number, s: number) => {
			c.paint('wool', c.ell(x, y, 0.2 * s, 0.14 * s));
			for (const [dx, dy] of [
				[-0.14, -0.08],
				[0, -0.12],
				[0.13, -0.08],
				[-0.16, 0.05],
				[0.16, 0.05]
			]) {
				c.paint('wool', c.circ(x + dx * s, y + dy * s, 0.09 * s));
			}
			for (const dx of [-0.1, -0.04, 0.06, 0.12])
				c.paint('face', c.rect(x + dx * s - 0.015, y + 0.1 * s, x + dx * s + 0.015, y + 0.24 * s));
			c.paint('face', c.ell(x - 0.22 * s, y - 0.02 * s, 0.065 * s, 0.09 * s));
			c.paint('face', c.ell(x - 0.27 * s, y - 0.09 * s, 0.04 * s, 0.025 * s));
		};
		c.part('wool', ['white', 'snow', 'cream'], 1);
		c.part('face', ['black', 'charcoal', 'chocolate'], 1);
		one(0.5, 0.64, 1);
		if (c.t > 0.3) one(0.82, 0.8, 0.6);
		c.part('flower', ['yellow', 'pink', 'white', 'red', 'violet'], 6, 'grass', 4);
		for (let k = 0; k < c.more(2, 6); k++)
			c.paint('flower', c.circ(c.r(0.05, 0.95), c.r(0.88, 0.97), 0.035));
		if (c.chance(0.5)) c.mirror();
		return timed(time, c.t > 0.3 ? 'Sheep and Lamb' : 'Sheep', c.use);
	}
};

const bee: Template = {
	id: 'bee',
	aspect: 1.2,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dawn', 'day']);
		sky(c, time);
		clouds(c, time, c.more(1, 2), 0.05, 0.14, 6);
		c.part('stem', GRASS, 3, 'sky');
		c.part('petal', ['pink', 'red', 'violet', 'orange', 'white', 'coral'], 2);
		c.part('center', ['gold', 'brown', 'orange', 'chocolate'], 4, 'petal');
		const flower = (x: number, y: number, r: number) => {
			c.paint('stem', c.line(x, y, x, 1, 2));
			for (let k = 0; k < 6; k++) {
				const a = (k / 6) * 2 * Math.PI;
				c.paint(
					'petal',
					c.circ(x + Math.cos(a) * r * 0.75 * (c.h / c.w), y + Math.sin(a) * r * 0.75, r * 0.45)
				);
			}
			c.paint('center', c.circ(x, y, r * 0.45));
		};
		hills(c, 'grass', GRASS, 2, 0.76, 0.02, 1.5);
		flower(0.15, 0.74, 0.15);
		flower(0.86, 0.8, 0.12);
		if (c.t > 0.3) flower(0.5, 0.92, 0.09);
		c.part('leaf', ['forest', 'green', 'olive', 'pine'], 5, 'stem');
		c.paint('leaf', c.ell(0.22, 0.92, 0.07, 0.03));
		c.part('wing', ['white', 'ice', 'snow', 'sky'], 2);
		c.paint('wing', c.ell(0.5, 0.17, 0.12, 0.15));
		c.paint('wing', c.ell(0.67, 0.2, 0.1, 0.13));
		c.part('bee', ['yellow', 'gold', 'amber'], 1);
		c.paint('bee', c.ell(0.58, 0.44, 0.24, 0.17));
		c.paint(
			'bee',
			c.poly([
				[0.8, 0.4],
				[0.92, 0.45],
				[0.8, 0.5]
			])
		);
		c.part('stripe', ['black', 'charcoal', 'chocolate'], 1, 'bee');
		for (const x of [0.52, 0.66])
			c.paintOver('stripe', c.rect(x - 0.035, 0, x + 0.035, 1), ['bee']);
		c.paint('stripe', c.circ(0.33, 0.44, 0.13));
		c.paint('stripe', c.line(0.3, 0.34, 0.25, 0.16, 1.2));
		c.paint('stripe', c.line(0.36, 0.33, 0.4, 0.16, 1.2));
		c.part('eyew', ['white', 'snow', 'cream'], 5, 'stripe', 3);
		c.paint('eyew', c.dot(0.3, 0.41, 1.2));
		if (c.chance(0.5)) c.mirror();
		return timed(time, c.use === 1 ? 'Busy Bee' : 'Bumblebee', c.use);
	}
};

const octopus: Template = {
	id: 'octopus',
	aspect: 1.1,
	draw(c) {
		const v = c.cycle([
			{ name: 'Octopus', body: ['coral', 'orange', 'red'] },
			{ name: 'Purple Octopus', body: ['violet', 'purple', 'orchid'] },
			{ name: 'Pink Octopus', body: ['pink', 'rose'] }
		]);
		c.part('water', ['turquoise', 'azure', 'teal', 'blue', 'aqua'], 2);
		c.fill('water');
		c.part('sand', ['sand', 'beige', 'tan', 'cream'], 3, 'water');
		c.paint('sand', c.below(c.wave(0.86, 0.025, 1.2, c.r(0, 1))));
		c.part('rock', ['slate', 'stone', 'grey', 'steel'], 5, 'sand');
		c.paint('rock', c.ell(0.1, 0.9, 0.12, 0.1));
		c.paint('rock', c.ell(0.92, 0.88, 0.1, 0.12));
		c.part('body', v.body, 1);
		c.paint('body', c.ell(0.5, 0.3, 0.22, 0.22));
		c.paint('body', c.rect(0.33, 0.3, 0.67, 0.5));
		for (let k = 0; k < 6; k++) {
			const x0 = 0.32 + k * 0.072;
			const side = (k - 2.5) / 2.5;
			c.paint('body', (x, y) => {
				if (y < 0.46 || y > 0.86) return false;
				const t = (y - 0.46) / 0.4;
				const cx = x0 + side * 0.22 * t + 0.03 * Math.sin(t * 7 + k);
				return Math.abs((x - cx) * c.w) < Math.max(1, 1.8 * (1 - t * 0.5));
			});
		}
		c.part('spot', ['peach', 'blush', 'salmon', 'lilac', 'magenta', 'maroon'], 4, 'body', 4);
		for (const [x, y] of [
			[0.42, 0.18],
			[0.58, 0.16],
			[0.5, 0.1],
			[0.6, 0.27]
		])
			c.paintOver('spot', c.circ(x, y, 0.035), ['body']);
		c.part('eyew', ['white', 'snow', 'cream'], 3, 'body', 3);
		c.paint('eyew', c.circ(0.42, 0.35, 0.06));
		c.paint('eyew', c.circ(0.58, 0.35, 0.06));
		eyes(
			c,
			[
				[0.42, 0.36],
				[0.58, 0.36]
			],
			1,
			3,
			'eyew'
		);
		c.part('bubble', ['white', 'ice', 'snow'], 6, 'water', 4);
		for (const [x, y] of [
			[0.78, 0.2],
			[0.82, 0.1],
			[0.75, 0.04]
		])
			c.paint('bubble', c.circ(x, y, 0.04));
		c.part('weed', GRASS, 5, 'water');
		c.paint(
			'weed',
			(x, y) => y > 0.4 && Math.abs((x - 0.88 - 0.02 * Math.sin(y * 20)) * c.w) < 1.1
		);
		return v.name;
	}
};

// ---------- plants ----------

const sunflower: Template = {
	id: 'sunflower',
	aspect: 0.8,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'dawn']);
		sky(c, time);
		clouds(c, time, c.more(1, 2), 0.04, 0.12, 6);
		sun(c, time, 0.86, 0.12, 0.07, 6);
		hills(c, 'far', ['sage', 'olive', 'teal', 'lavender'], 5, 0.58, 0.04, 1.2, 'sky');
		c.part('fence', ['caramel', 'tan', 'brown', 'white', 'beige'], 4, 'sky');
		for (let x = 0; x < 1; x += 0.12)
			c.paint(
				'fence',
				c.poly([
					[x + 0.01, 1],
					[x + 0.01, 0.6],
					[x + 0.05, 0.56],
					[x + 0.09, 0.6],
					[x + 0.09, 1]
				])
			);
		c.paint('fence', c.rect(0, 0.68, 1, 0.68 + 1.3 / c.h));
		hills(c, 'grass', GRASS, 3, 0.9, 0.01, 1);
		c.part('stem', ['green', 'leaf', 'forest'], 2);
		c.part('petal', ['yellow', 'gold', 'lemon'], 1);
		c.part('seed', ['brown', 'chocolate', 'rust'], 1, 'petal');
		c.part('ring', ['amber', 'orange', 'caramel', 'maroon'], 5, 'seed');
		const flower = (x: number, y: number, r: number) => {
			c.paint('stem', c.line(x, y, x - 0.03, 1, 2.5));
			c.paint('stem', c.oval(x - 0.1, y + r * 2.4, 0.12 * r * 4, 0.05 * r * 4));
			c.paint('stem', c.oval(x + 0.06, y + r * 3, 0.1 * r * 4, 0.045 * r * 4));
			for (let k = 0; k < 12; k++) {
				const a = (k / 12) * 2 * Math.PI;
				const m = Math.min(c.w, c.h);
				c.paint(
					'petal',
					c.circ(
						x + (Math.cos(a) * r * 0.82 * m) / c.w,
						y + (Math.sin(a) * r * 0.82 * m) / c.h,
						r * 0.3
					)
				);
			}
			c.paint('seed', c.circ(x, y, r * 0.55));
			c.paintOver('ring', c.and(c.circ(x, y, r * 0.55), c.not(c.circ(x, y, r * 0.4))), ['seed']);
		};
		flower(0.48, 0.3, 0.27);
		if (c.t > 0.35) flower(0.84, 0.62, 0.13);
		if (c.chance(0.5)) c.mirror();
		return timed(time, c.t > 0.35 ? 'Sunflowers' : 'Sunflower', c.use);
	}
};

const mushrooms: Template = {
	id: 'mushrooms',
	aspect: 1.1,
	draw(c) {
		const v = c.cycle([
			{ name: 'Toadstools', cap: ['red', 'crimson'], bg: ['sage', 'mint', 'olive', 'teal'] },
			{
				name: 'Night Mushrooms',
				cap: ['violet', 'orchid', 'magenta'],
				bg: ['night', 'navy', 'indigo', 'plum']
			},
			{
				name: 'Forest Mushrooms',
				cap: ['orange', 'amber', 'caramel'],
				bg: ['mint', 'lime', 'sage']
			}
		]);
		c.part('bg', v.bg, 2);
		c.fill('bg');
		c.part('trunk', ['chocolate', 'brown', 'pine', 'forest', 'slate'], 5, 'bg');
		for (const x of [0.1, 0.4, 0.78]) c.paint('trunk', c.rect(x, 0, x + 0.08, 0.7));
		hills(c, 'moss', ['green', 'forest', 'leaf', 'olive', 'pine'], 2, 0.72, 0.02, 1.2);
		c.part('canopy', ['forest', 'pine', 'olive', 'teal'], 5, 'bg');
		c.paint('canopy', c.ell(0.2, 0, 0.35, 0.12));
		c.paint('canopy', c.ell(0.85, 0, 0.3, 0.1));
		c.part('stone', ['slate', 'stone', 'grey', 'steel'], 6, 'moss');
		c.paint('stone', c.ell(0.62, 0.92, 0.07, 0.05));
		c.part('leaf', ['rust', 'amber', 'gold', 'caramel'], 7, 'moss');
		for (const [lx, ly] of [
			[0.25, 0.94],
			[0.55, 0.82]
		])
			c.paint('leaf', c.ell(lx, ly, 0.04, 0.025));
		c.part('stalk', ['cream', 'white', 'beige', 'sand'], 1);
		c.part('cap', v.cap, 1);
		c.part('dot', ['white', 'snow', 'cream', 'lemon'], 3, 'cap', 4);
		const shroom = (x: number, y: number, s: number) => {
			c.paint('stalk', c.rect(x - 0.06 * s, y, x + 0.06 * s, y + 0.38 * s));
			c.paint('stalk', c.ell(x, y + 0.38 * s, 0.09 * s, 0.04 * s));
			c.paint(
				'cap',
				c.and(c.ell(x, y + 0.02 * s, 0.26 * s, 0.24 * s), c.rect(0, 0, 1, y + 0.02 * s))
			);
			for (const [dx, dy] of [
				[-0.12, -0.08],
				[0.02, -0.16],
				[0.13, -0.06]
			]) {
				c.paintOver('dot', c.circ(x + dx * s, y + dy * s, 0.05 * s), ['cap']);
			}
		};
		shroom(0.42, 0.48, 1.2);
		shroom(0.8, 0.68, 0.7);
		if (c.t > 0.4) shroom(0.12, 0.78, 0.5);
		c.part('gill', ['tan', 'peach', 'beige', 'blush'], 5, 'stalk');
		c.paintOver('gill', c.rect(0.1, 0.49, 0.74, 0.49 + 1 / c.h), ['stalk', 'bg']);
		c.part('fern', ['lime', 'leaf', 'mint', 'sage'], 6, 'moss');
		for (const x of [0.06, 0.6, 0.94])
			c.paint(
				'fern',
				c.poly([
					[x - 0.05, 1],
					[x, 0.78],
					[x + 0.05, 1]
				])
			);
		return v.name;
	}
};

const appletree: Template = {
	id: 'appletree',
	aspect: 1,
	draw(c) {
		const v = c.cycle([
			{ name: 'Apple Tree', fruit: ['red', 'crimson'] },
			{ name: 'Lemon Tree', fruit: ['yellow', 'lemon'] },
			{ name: 'Orange Tree', fruit: ['orange', 'amber'] },
			{ name: 'Cherry Tree', fruit: ['crimson', 'maroon', 'red'] }
		]);
		const time = c.cycle<Time>(['day', 'dawn', 'dusk'], 1);
		sky(c, time);
		sun(c, time, c.pick([0.12, 0.88]), 0.12, 0.08, 5);
		clouds(c, time, c.more(0, 2), 0.05, 0.15, 6);
		hills(c, 'far', ['sage', 'olive', 'teal', 'forest'], 5, 0.62, 0.05, 1, 'grass');
		hills(c, 'grass', ['leaf', 'green', 'lime'], 2, 0.78, 0.02, 1);
		c.part('trunk', WOOD, 2);
		c.paint('trunk', c.rect(0.45, 0.45, 0.55, 0.86));
		c.paint('trunk', c.line(0.5, 0.6, 0.36, 0.42, 2));
		c.paint('trunk', c.line(0.5, 0.58, 0.64, 0.42, 2));
		c.part('crown', ['forest', 'green', 'pine', 'olive'], 1);
		for (const [x, y, r] of [
			[0.5, 0.28, 0.22],
			[0.32, 0.38, 0.16],
			[0.68, 0.38, 0.16],
			[0.4, 0.2, 0.14],
			[0.6, 0.2, 0.14]
		])
			c.paint('crown', c.circ(x, y, r));
		c.part('fruit', v.fruit, 1, 'crown', 4);
		const n = c.more(5, 10);
		const spots: [number, number][] = [];
		for (let k = 0; k < 400 && spots.length < n; k++) {
			const x = c.r(0.22, 0.78);
			const y = c.r(0.1, 0.5);
			if (
				c.at(x, y) !== 'crown' ||
				spots.some(([a, b]) => Math.hypot((a - x) * c.w, (b - y) * c.h) < 5)
			)
				continue;
			spots.push([x, y]);
			c.paint('fruit', c.dot(x, y, 1.4));
		}
		c.part('basket', ['caramel', 'tan', 'gold', 'rust'], 4, 'grass');
		const bx = c.pick([0.22, 0.78]);
		c.paint('basket', c.and(c.ell(bx, 0.84, 0.1, 0.08), c.rect(0, 0.84, 1, 1)));
		c.paint('fruit', c.dot(bx - 0.04, 0.83, 1.3));
		c.paint('fruit', c.dot(bx + 0.04, 0.83, 1.3));
		return timed(time, v.name, c.use);
	}
};

const tulips: Template = {
	id: 'tulips',
	aspect: 1.2,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dawn', 'dusk']);
		sky(c, time);
		sun(c, time, c.pick([0.12, 0.88]), 0.14, 0.08, 6);
		c.part('soil', ['chocolate', 'brown', 'rust'], 3, 'grass');
		c.part('grass', GRASS, 2);
		c.paint('grass', c.rect(0, 0.82, 1, 1));
		c.paint('soil', c.rect(0, 0.9, 1, 1));
		c.part('stem', ['green', 'forest', 'leaf'], 2);
		const colors = [
			['red', 'crimson'],
			['yellow', 'gold'],
			['pink', 'rose', 'magenta'],
			['violet', 'purple', 'lavender'],
			['orange', 'amber'],
			['white', 'cream']
		];
		const n = c.more(3, 6);
		for (let k = 0; k < n; k++) {
			const x = (k + 0.5) / n;
			const y = 0.35 + ((k * 7) % 3) * 0.08;
			const s = 0.11 * (3 / n) ** 0.4;
			const head = `tulip${k}`;
			c.part(head, colors[k % colors.length], k < 2 ? 1 : 3 + k, k < 2 ? 'stem' : `tulip${k % 2}`);
			c.paint('stem', c.line(x, y, x, 0.95, 1.8));
			c.paint(
				'stem',
				c.poly([
					[x, 0.92],
					[x - s * 1.2, 0.62],
					[x - s * 0.3, 0.8]
				])
			);
			c.paint(head, c.oval(x, y, s * 1.4, s * 1.5));
			c.paint(
				head,
				c.poly([
					[x - s * 0.9, y],
					[x - s * 0.8, y - s * 1.9],
					[x - s * 0.2, y - s * 0.7],
					[x, y - s * 2],
					[x + s * 0.2, y - s * 0.7],
					[x + s * 0.8, y - s * 1.9],
					[x + s * 0.9, y]
				])
			);
		}
		return timed(time, c.cycle(['Tulips', 'Tulip Garden', 'Tulip Bed'], 9), c.use);
	}
};

export const CREATURES: Template[] = [
	cat,
	fox,
	owl,
	penguin,
	frog,
	butterfly,
	parrot,
	snail,
	ladybug,
	duck,
	whale,
	fish,
	jellyfish,
	turtle,
	elephant,
	giraffe,
	sheep,
	bee,
	octopus,
	sunflower,
	mushrooms,
	appletree,
	tulips
];
