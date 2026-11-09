/* Mosaic picture templates: landscapes, weather, seascapes, towns and buildings. */
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

const ROOF = ['crimson', 'slate', 'brown', 'maroon', 'charcoal', 'rust', 'navy', 'teal'];
const WALL = ['cream', 'white', 'beige', 'peach', 'sand', 'blush', 'mint', 'ice', 'lemon'];
const LIT = ['yellow', 'gold', 'lemon', 'amber'];
const SNOW = ['white', 'snow', 'cream'];

/** A pine: three stacked triangles and a trunk. */
function pine(
	c: Canvas,
	x: number,
	base: number,
	hgt: number,
	wid: number,
	part: string,
	trunk?: string
) {
	if (trunk)
		c.paint(trunk, c.rect(x - 0.012 - 0.5 / c.w, base - hgt * 0.15, x + 0.012 + 0.5 / c.w, base));
	for (let k = 0; k < 3; k++) {
		const top = base - hgt + k * hgt * 0.25;
		const bot = top + hgt * 0.45;
		const half = wid * (0.55 + k * 0.22);
		c.paint(
			part,
			c.poly([
				[x, top],
				[x + half, bot],
				[x - half, bot]
			])
		);
	}
}

/** A house front: wall, triangle roof, door and windows. */
function house(
	c: Canvas,
	x0: number,
	x1: number,
	top: number,
	base: number,
	parts: { wall: string; roof: string; window?: string; door?: string }
) {
	const mid = (x0 + x1) / 2;
	const roofH = (x1 - x0) * 0.55 * (c.w / c.h);
	c.paint(parts.wall, c.rect(x0, top, x1, base));
	c.paint(
		parts.roof,
		c.poly([
			[x0 - 0.02, top + 0.005],
			[mid, top - roofH],
			[x1 + 0.02, top + 0.005]
		])
	);
	if (parts.door)
		c.paint(parts.door, c.rect(mid - 1.2 / c.w, base - 4 / c.h, mid + 1.2 / c.w, base));
	if (parts.window) {
		const wy = top + (base - top) * 0.22;
		const ww = 2 / c.w;
		const wh = Math.max(2, (base - top) * c.h * 0.22) / c.h;
		for (const wx of [x0 + (x1 - x0) * 0.24, x1 - (x1 - x0) * 0.24]) {
			c.paint(parts.window, c.rect(wx - ww / 2, wy, wx + ww / 2, wy + wh));
		}
	}
}

const farm: Template = {
	id: 'farm',
	aspect: 1.3,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'dawn', 'day']);
		const harvest = c.use % 2 === 1;
		sky(c, time);
		sun(c, time, c.pick([0.75, 0.88]), 0.16, 0.09, 5);
		clouds(c, time, c.more(1, 3), 0.05, 0.2, 6);
		hills(c, 'far', ['sage', 'olive', 'teal', 'forest'], 5, 0.5, 0.05, 1.2, 'grass');
		hills(c, 'grass', ['leaf', 'green', 'lime'], 2, 0.66, 0.02, 0.8);
		c.part('field', harvest ? ['gold', 'yellow', 'sand'] : ['lime', 'leaf', 'olive'], 4, 'grass');
		c.part(
			'row',
			harvest ? ['amber', 'caramel', 'orange'] : ['forest', 'green', 'pine'],
			6,
			'field'
		);
		const rows = c.more(3, 5);
		for (let k = 0; k < rows; k++) {
			const y = 0.8 + (k * 0.2) / rows;
			c.paint('field', c.rect(0, y, 1, y + 0.11 / rows));
			c.paint('row', c.rect(0, y + 0.11 / rows, 1, y + 0.22 / rows));
		}
		c.part('barn', ['red', 'crimson', 'rust'], 1);
		c.part('roof', ['charcoal', 'slate', 'maroon', 'stone'], 3, 'barn');
		c.part('trim', ['white', 'snow', 'cream'], 3, 'barn', 4);
		c.paint('barn', c.rect(0.14, 0.44, 0.46, 0.8));
		c.paint(
			'roof',
			c.poly([
				[0.12, 0.46],
				[0.18, 0.3],
				[0.3, 0.22],
				[0.42, 0.3],
				[0.48, 0.46]
			])
		);
		c.paint('trim', c.rect(0.24, 0.6, 0.36, 0.8));
		c.paint('barn', c.rect(0.24 + 1.2 / c.w, 0.6 + 1.2 / c.h, 0.36 - 1.2 / c.w, 0.8));
		c.paint('trim', c.line(0.245, 0.62, 0.355, 0.8, 1.1));
		c.paint('trim', c.line(0.355, 0.62, 0.245, 0.8, 1.1));
		c.paint('trim', c.rect(0.27, 0.36, 0.33, 0.44));
		c.part('silo', ['silver', 'grey', 'stone', 'steel'], 4, 'sky');
		c.paint('silo', c.rect(0.48, 0.3, 0.56, 0.8));
		c.part('dome', ['slate', 'charcoal', 'steel', 'teal'], 6, 'silo');
		c.paint('dome', c.and(c.ell(0.52, 0.3, 0.04, 0.06), c.rect(0, 0, 1, 0.3)));
		c.part('crown', DARK_GRASS, 5, 'grass');
		c.part('trunk', WOOD, 7, 'crown');
		c.paint('trunk', c.rect(0.83, 0.46, 0.86, 0.7));
		c.paint('crown', c.circ(0.845, 0.4, 0.12));
		if (c.chance(0.5)) c.mirror();
		return timed(time, harvest ? 'Harvest Farm' : 'Red Barn', c.use);
	}
};

const pines: Template = {
	id: 'pines',
	aspect: 1.25,
	draw(c) {
		const time = c.cycle<Time>(['night', 'day', 'dusk', 'dawn']);
		sky(c, time);
		sun(c, time, c.pick([0.2, 0.8]), 0.14, 0.08, 4);
		if (time === 'night') stars(c, c.more(2, 6), 0, 0, 1, 0.35);
		c.part('mtn', ['lavender', 'slate', 'steel', 'stone', 'indigo'], 4, 'sky');
		c.part('cap', ['white', 'snow', 'ice'], 6, 'mtn');
		for (const [x, top, half] of [
			[0.25, 0.22, 0.3],
			[0.7, 0.28, 0.32]
		]) {
			c.paint(
				'mtn',
				c.poly([
					[x - half, 0.65],
					[x, top],
					[x + half, 0.65]
				])
			);
			c.paint(
				'cap',
				c.poly([
					[x - half * 0.3, top + 0.12],
					[x, top],
					[x + half * 0.3, top + 0.12],
					[x + 0.03, top + 0.09],
					[x - 0.02, top + 0.13]
				])
			);
		}
		hills(c, 'snow', SNOW, 2, 0.66, 0.025, 1);
		c.part('pine', ['pine', 'forest', 'green', 'teal'], 1);
		c.part('trunk', WOOD, 6, 'pine');
		const n = c.more(3, 6);
		for (let k = 0; k < n; k++) {
			const x = 0.06 + (k / (n - 1)) * 0.88 + c.r(-0.02, 0.02);
			if (x > 0.4 && x < 0.66) continue;
			const hgt = c.r(0.34, 0.5);
			pine(c, x, 0.86 + c.r(-0.04, 0.06), hgt, 0.09, 'pine', 'trunk');
		}
		c.part('cabin', ['brown', 'rust', 'caramel', 'crimson'], 3, 'snow');
		c.part('lit', LIT, 4, 'cabin', 4);
		c.part('smoke', ['grey', 'silver', 'stone', 'white'], 7, 'sky');
		house(c, 0.43, 0.63, 0.6, 0.78, { wall: 'cabin', roof: 'snow', window: 'lit', door: 'lit' });
		c.paint('cabin', c.rect(0.57, 0.42, 0.6, 0.55));
		c.paint('smoke', c.circ(0.6, 0.36, 0.035));
		c.paint('smoke', c.circ(0.63, 0.3, 0.045));
		c.paint('smoke', c.circ(0.67, 0.23, 0.055));
		return timed(time, c.use % 2 ? 'Winter Cabin' : 'Snowy Pines', c.use);
	}
};

const autumn: Template = {
	id: 'autumn',
	aspect: 1.25,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'dawn']);
		sky(c, time);
		sun(c, time, 0.5, 0.18, 0.08, 6);
		clouds(c, time, c.more(1, 2), 0.05, 0.18, 7);
		hills(c, 'far', ['sage', 'olive', 'teal', 'lavender'], 5, 0.5, 0.04, 1, 'grass');
		hills(c, 'grass', ['olive', 'leaf', 'green', 'sage'], 2, 0.62, 0.02, 1);
		c.part('path', ['tan', 'sand', 'beige', 'stone'], 3, 'grass');
		c.paint(
			'path',
			c.poly([
				[0.46, 0.62],
				[0.54, 0.62],
				[0.78, 1],
				[0.3, 1]
			])
		);
		c.part('trunk', ['chocolate', 'brown', 'charcoal'], 2);
		const crowns = [
			['orange', 'amber', 'apricot'],
			['red', 'crimson', 'rust'],
			['yellow', 'gold', 'lemon']
		];
		const n = c.more(3, 6);
		for (let k = 0; k < n; k++) {
			const left = k % 2 === 0;
			const j = Math.floor(k / 2);
			const x = left ? 0.13 + j * 0.12 : 0.87 - j * 0.12;
			const y = 0.42 + j * 0.02;
			const r = 0.17 - j * 0.03;
			const part = `crown${k % 3}`;
			c.part(part, crowns[k % 3], k % 3 === 0 ? 1 : 3 + (k % 3), 'crown0');
			c.paint('trunk', c.rect(x - 0.02, y, x + 0.02, y + 0.36 - j * 0.03));
			c.paint(part, c.circ(x, y, r));
			c.paint(part, c.circ(x + 0.06, y + 0.05, r * 0.7));
		}
		c.part('leaves', ['rust', 'amber', 'caramel', 'red'], 6, 'grass');
		for (const x of [0.2, 0.8]) c.paint('leaves', c.ell(x, 0.93, 0.08, 0.04));
		if (c.chance(0.5)) c.mirror();
		return timed(time, c.use % 2 ? 'Autumn Woods' : 'Autumn Lane', c.use);
	}
};

const volcano: Template = {
	id: 'volcano',
	aspect: 1.2,
	draw(c) {
		const time = c.cycle<Time>(['night', 'dusk', 'day']);
		sky(c, time);
		if (time === 'night') stars(c, c.more(2, 5), 0, 0, 1, 0.4);
		glow(c, time, 0.45, 0.62, 5);
		c.part('smoke', ['grey', 'silver', 'stone', 'slate'], 3, 'sky');
		for (const [x, y, r] of [
			[0.5, 0.18, 0.1],
			[0.42, 0.1, 0.08],
			[0.6, 0.08, 0.09],
			[0.52, 0.04, 0.07]
		])
			c.paint('smoke', c.circ(x, y, r));
		c.part('rock', ['chocolate', 'brown', 'charcoal', 'slate', 'plum'], 1);
		c.paint(
			'rock',
			c.poly([
				[0.02, 0.86],
				[0.4, 0.3],
				[0.6, 0.3],
				[0.98, 0.86]
			])
		);
		c.part('lava', ['red', 'orange', 'crimson'], 1);
		c.paint('lava', c.rect(0.41, 0.27, 0.59, 0.32));
		for (const [x1, y1] of [
			[0.32, 0.7],
			[0.56, 0.8],
			[0.72, 0.6]
		]) {
			c.paint('lava', c.line(0.5, 0.3, x1, y1, 2.2));
		}
		c.part('hot', ['yellow', 'gold', 'lemon', 'orange'], 4, 'lava');
		c.paint('hot', c.rect(0.44, 0.26, 0.56, 0.3));
		c.paint('hot', c.line(0.5, 0.3, 0.46, 0.45, 1.1));
		c.part('sea', WATER, 2);
		c.paint('sea', c.rect(0, 0.84, 1, 1));
		c.part('foam', ['white', 'snow', 'ice', 'aqua'], 6, 'sea');
		for (let k = 0; k < c.more(2, 4); k++)
			c.paint('foam', c.line(c.r(0.05, 0.7), 0.9 + k * 0.025, c.r(0.75, 0.95), 0.9 + k * 0.025, 1));
		c.part('palm', ['green', 'forest', 'leaf'], 5, 'rock');
		const px = c.pick([0.1, 0.9]);
		c.paint('palm', c.line(px, 0.86, px + 0.02, 0.62, 1.4));
		for (const dx of [-0.08, 0.08, -0.05, 0.05])
			c.paint('palm', c.line(px + 0.02, 0.62, px + 0.02 + dx, 0.62 + Math.abs(dx) * 0.6, 1.4));
		return timed(time, c.use % 2 ? 'Island Volcano' : 'Volcano', c.use);
	}
};

const waterfall: Template = {
	id: 'waterfall',
	aspect: 0.85,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dawn', 'dusk']);
		sky(c, time);
		sun(c, time, 0.5, 0.1, 0.06, 6);
		clouds(c, time, c.more(0, 2), 0.04, 0.12, 7);
		c.part('cliff', ['stone', 'slate', 'brown', 'grey', 'steel'], 1);
		c.paint(
			'cliff',
			c.poly([
				[0, 0.24],
				[0.2, 0.22],
				[0.38, 0.26],
				[0.4, 0.8],
				[0, 0.8]
			])
		);
		c.paint(
			'cliff',
			c.poly([
				[1, 0.2],
				[0.8, 0.2],
				[0.62, 0.26],
				[0.6, 0.8],
				[1, 0.8]
			])
		);
		c.part('moss', ['green', 'leaf', 'forest', 'olive'], 3, 'cliff');
		c.paint(
			'moss',
			c.poly([
				[0, 0.18],
				[0.2, 0.16],
				[0.4, 0.24],
				[0.38, 0.3],
				[0.2, 0.28],
				[0, 0.3]
			])
		);
		c.paint(
			'moss',
			c.poly([
				[1, 0.15],
				[0.8, 0.14],
				[0.6, 0.24],
				[0.62, 0.3],
				[0.8, 0.27],
				[1, 0.28]
			])
		);
		c.part('shade', ['charcoal', 'chocolate', 'slate', 'plum'], 5, 'cliff');
		for (const [x0, x1, y] of [
			[0, 0.3, 0.48],
			[0.68, 1, 0.42],
			[0.04, 0.36, 0.66],
			[0.64, 0.96, 0.6]
		])
			c.paintOver('shade', c.line(x0, y, x1, y + 0.03, 1.3), ['cliff']);
		c.part('falls', ['white', 'snow', 'ice'], 1);
		c.paint('falls', c.rect(0.38, 0.24, 0.62, 0.84));
		c.part('stream', ['aqua', 'sky', 'turquoise', 'azure'], 4, 'falls');
		for (const x of [0.44, 0.52, 0.58])
			c.paint('stream', c.rect(x, 0.3 + ((x * 7) % 0.1), x + 1.2 / c.w, 0.76));
		c.part('pool', WATER, 2);
		c.paint('pool', c.below(c.wave(0.8, 0.01, 1, 0)));
		c.part('foam', ['white', 'snow', 'ice'], 3, 'pool');
		c.paint('foam', c.ell(0.5, 0.82, 0.22, 0.05));
		c.part('rock', ['charcoal', 'slate', 'stone', 'brown'], 6, 'pool');
		c.paint('rock', c.ell(0.12, 0.95, 0.12, 0.06));
		c.paint('rock', c.ell(0.85, 0.92, 0.1, 0.05));
		c.part('tree', DARK_GRASS, 4, 'moss');
		for (const x of [0.08, 0.92]) pine(c, x, 0.2, 0.18, 0.06, 'tree');
		return timed(time, c.use % 2 ? 'Hidden Falls' : 'Waterfall', c.use);
	}
};

const storm: Template = {
	id: 'storm',
	aspect: 1.25,
	draw(c) {
		c.part('sky', ['slate', 'navy', 'indigo', 'charcoal', 'plum'], 2);
		c.fill('sky');
		c.part('cloud', ['grey', 'silver', 'stone', 'steel'], 1);
		for (const [x, y, r] of [
			[0.3, 0.2, 0.16],
			[0.5, 0.14, 0.2],
			[0.72, 0.2, 0.16],
			[0.15, 0.28, 0.1],
			[0.88, 0.28, 0.1]
		])
			c.paint('cloud', c.circ(x, y, r));
		c.paint('cloud', c.rect(0.08, 0.2, 0.94, 0.36));
		c.part('dark', ['charcoal', 'slate', 'stone', 'steel', 'black'], 4, 'cloud');
		c.paintOver('dark', c.rect(0, 0.3, 1, 0.37), ['cloud']);
		c.part('rain', ['sky', 'ice', 'azure', 'aqua'], 3, 'sky', 5);
		const n = c.more(5, 9);
		for (let k = 0; k < n; k++) {
			const x = 0.06 + (k / n) * 0.9;
			const y = 0.42 + ((k * 3) % 4) * 0.04;
			c.paintOver('rain', c.line(x, y, x - 0.05, y + 0.18, 1), ['sky']);
		}
		c.part('bolt', ['yellow', 'lemon', 'gold'], 1);
		const bx = c.pick([0.4, 0.6]);
		c.paint(
			'bolt',
			c.poly([
				[bx, 0.32],
				[bx + 0.08, 0.32],
				[bx + 0.03, 0.5],
				[bx + 0.1, 0.5],
				[bx - 0.04, 0.82],
				[bx, 0.58],
				[bx - 0.06, 0.58]
			])
		);
		hills(c, 'ground', ['forest', 'pine', 'olive', 'green'], 2, 0.8, 0.02, 1);
		c.part('house', ['charcoal', 'black', 'chocolate', 'maroon'], 5, 'ground');
		c.part('window', LIT, 6, 'house', 4);
		const hx = bx < 0.5 ? 0.78 : 0.12;
		house(c, hx - 0.08, hx + 0.08, 0.7, 0.86, { wall: 'house', roof: 'house', window: 'window' });
		c.part('puddle', ['steel', 'azure', 'teal', 'blue'], 7, 'ground');
		c.paint('puddle', c.ell(0.5, 0.93, 0.14, 0.03));
		return c.cycle(['Thunderstorm', 'Summer Storm', 'Lightning'], 9);
	}
};

const snowman: Template = {
	id: 'snowman',
	aspect: 0.85,
	draw(c) {
		const time = c.cycle<Time>(['day', 'night', 'dusk']);
		sky(c, time);
		sun(c, time, c.pick([0.18, 0.82]), 0.12, 0.08, 5);
		if (time === 'night') stars(c, c.more(2, 5), 0, 0, 1, 0.45);
		c.part('tree', DARK_GRASS, 4, 'sky');
		pine(c, 0.12, 0.74, 0.34, 0.08, 'tree');
		pine(c, 0.88, 0.72, 0.26, 0.07, 'tree');
		hills(c, 'ground', ['ice', 'lilac', 'silver', 'sky', 'lavender'], 2, 0.72, 0.02, 1);
		c.part('fence', WOOD, 6, 'ground');
		for (let x = 0.03; x < 1; x += 0.1)
			if (x < 0.26 || x > 0.74) c.paint('fence', c.rect(x, 0.7, x + 1.4 / c.w, 0.82));
		c.paint('fence', c.and(c.rect(0, 0.74, 1, 0.74 + 1 / c.h), c.not(c.rect(0.27, 0, 0.73, 1))));
		c.part('sled', ['red', 'crimson', 'cobalt', 'orange'], 7, 'ground');
		c.paint('sled', c.rect(0.74, 0.9, 0.95, 0.93));
		c.paint('sled', c.line(0.95, 0.93, 0.98, 0.89, 1));
		c.part('snow', ['white', 'snow'], 1);
		c.paint('snow', c.circ(0.5, 0.74, 0.22));
		c.paint('snow', c.circ(0.5, 0.48, 0.16));
		c.paint('snow', c.circ(0.5, 0.28, 0.12));
		c.part('coal', ['black', 'charcoal'], 3, 'snow', 3);
		c.paint('coal', c.rect(0.38, 0.16, 0.62, 0.19));
		c.paint('coal', c.rect(0.42, 0.04, 0.58, 0.17));
		for (const [x, y] of [
			[0.45, 0.26],
			[0.55, 0.26],
			[0.5, 0.45],
			[0.5, 0.53],
			[0.5, 0.68]
		])
			c.paint('coal', c.dot(x, y, 1));
		c.part('band', ['red', 'crimson', 'violet', 'cobalt'], 6, 'coal');
		c.paint('band', c.rect(0.42, 0.13, 0.58, 0.16));
		c.part('scarf', ['red', 'crimson', 'cobalt', 'leaf', 'violet', 'orange'], 3, 'snow');
		c.paint('scarf', c.rect(0.39, 0.36, 0.61, 0.4));
		c.paint('scarf', c.rect(0.53, 0.36, 0.58, 0.5));
		c.part('nose', ['orange', 'amber', 'apricot'], 4, 'snow', 3);
		c.paint(
			'nose',
			c.poly([
				[0.5, 0.29],
				[0.6, 0.31],
				[0.5, 0.32]
			])
		);
		c.part('stick', WOOD, 5, 'sky', 4);
		c.paint('stick', c.line(0.36, 0.47, 0.18, 0.36, 1.2));
		c.paint('stick', c.line(0.64, 0.47, 0.82, 0.36, 1.2));
		return timed(time, 'Snowman', c.use);
	}
};

const island: Template = {
	id: 'island',
	aspect: 1.3,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'dawn']);
		sky(c, time);
		glow(c, time, 0.42, 0.55, 6);
		sun(c, time, c.pick([0.2, 0.75]), 0.32, 0.12, 4);
		clouds(c, time, c.more(1, 2), 0.06, 0.18, 7);
		c.part('sea', ['blue', 'cobalt', 'azure', 'navy'], 2);
		c.paint('sea', c.rect(0, 0.55, 1, 1));
		c.part('shallow', ['turquoise', 'aqua', 'teal'], 3, 'sea');
		c.paint('shallow', c.ell(0.55, 0.8, 0.4, 0.16));
		c.part('sand', ['sand', 'beige', 'cream', 'gold'], 1);
		c.paint('sand', c.and(c.ell(0.55, 0.8, 0.3, 0.12), c.rect(0, 0, 1, 0.84)));
		c.paint('sand', c.ell(0.55, 0.8, 0.28, 0.06));
		c.part('trunk', ['brown', 'caramel', 'rust', 'chocolate'], 1);
		c.paint(
			'trunk',
			(x, y) =>
				y > 0.3 && y < 0.78 && Math.abs((x - 0.5 - 0.06 * ((0.78 - y) / 0.48) ** 2) * c.w) < 1.2
		);
		c.part('frond', ['green', 'leaf', 'forest'], 1);
		const tx = 0.56;
		const ty = 0.3;
		for (const [dx, dy] of [
			[-0.18, 0.08],
			[-0.12, -0.08],
			[0.14, -0.08],
			[0.2, 0.08],
			[0.02, -0.12],
			[-0.2, 0.18],
			[0.22, 0.18]
		]) {
			c.paint('frond', c.line(tx, ty, tx + dx, ty + dy, 2.2));
		}
		c.part('nut', ['chocolate', 'brown', 'rust'], 5, 'frond', 3);
		c.paint('nut', c.dot(tx - 0.02, ty + 0.04, 1.2));
		c.paint('nut', c.dot(tx + 0.02, ty + 0.05, 1.2));
		c.part('foam', ['white', 'snow', 'ice'], 5, 'sea');
		for (let k = 0; k < c.more(2, 5); k++) {
			const x = c.r(0.02, 0.8);
			c.paint('foam', c.line(x, 0.62 + k * 0.08, x + 0.12, 0.62 + k * 0.08, 1));
		}
		if (c.chance(0.5)) c.mirror();
		return timed(time, c.use % 2 ? 'Palm Island' : 'Desert Island', c.use);
	}
};

const canyon: Template = {
	id: 'canyon',
	aspect: 1.25,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'dawn']);
		sky(c, time);
		sun(c, time, c.pick([0.5, 0.25]), 0.15, 0.08, 4);
		clouds(c, time, c.more(0, 2), 0.05, 0.15, 7);
		c.part('far', ['lavender', 'lilac', 'rose', 'peach', 'salmon'], 4, 'sky');
		c.paint(
			'far',
			c.poly([
				[0.2, 0.7],
				[0.36, 0.5],
				[0.42, 0.46],
				[0.5, 0.46],
				[0.52, 0.52],
				[0.58, 0.52],
				[0.62, 0.58],
				[0.8, 0.7]
			])
		);
		c.part('floor', ['sand', 'tan', 'beige', 'peach'], 2);
		c.paint('floor', c.below(c.wave(0.68, 0.01, 1, 0)));
		c.part('rock', ['rust', 'orange', 'amber', 'red'], 1);
		c.part('band', ['tan', 'sand', 'apricot', 'peach', 'beige'], 3, 'rock');
		c.part('band2', ['maroon', 'brown', 'chocolate', 'crimson'], 5, 'rock');
		const left = c.poly([
			[-0.1, 0.3],
			[0.24, 0.3],
			[0.28, 0.4],
			[0.3, 0.62],
			[0.36, 1.1],
			[-0.1, 1.1]
		]);
		const right = c.poly([
			[1.1, 0.38],
			[0.78, 0.38],
			[0.74, 0.46],
			[0.72, 0.66],
			[0.66, 1.1],
			[1.1, 1.1]
		]);
		c.paint('rock', left);
		c.paint('rock', right);
		const h = 1 / c.h;
		for (const y of [0.42, 0.62, 0.82]) c.paintOver('band', c.rect(0, y, 1, y + 2.5 * h), ['rock']);
		for (const y of [0.5, 0.72, 0.92]) c.paintOver('band2', c.rect(0, y, 1, y + 2 * h), ['rock']);
		c.part('river', WATER, 2);
		c.paint(
			'river',
			(x, y) => y > 0.7 && Math.abs(x - 0.5 - 0.06 * Math.sin(y * 14)) < 0.02 + (y - 0.7) * 0.3
		);
		c.part('bird', ['charcoal', 'black', 'chocolate'], 7, 'sky', 4);
		c.paint('bird', c.line(0.7, 0.2, 0.74, 0.23, 1));
		c.paint('bird', c.line(0.74, 0.23, 0.78, 0.2, 1));
		return timed(time, c.use % 2 ? 'Red Canyon' : 'Canyon', c.use);
	}
};

const windmill: Template = {
	id: 'windmill',
	aspect: 0.95,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dawn', 'dusk']);
		sky(c, time);
		sun(c, time, 0.15, 0.14, 0.07, 6);
		clouds(c, time, c.more(1, 3), 0.05, 0.25, 5);
		glow(c, time, 0.44, 0.7, 3);
		hills(c, 'grass', GRASS, 2, 0.66, 0.01, 1);
		const rowColors = [
			['red', 'crimson'],
			['yellow', 'gold'],
			['pink', 'magenta', 'rose'],
			['violet', 'purple'],
			['orange', 'amber'],
			['white', 'snow']
		];
		const rows = c.more(2, 6);
		const bands = rows + 1;
		let y = 0.7;
		for (let k = 0; k < bands; k++) {
			const p = `row${k % rows}`;
			if (k < rows) c.part(p, rowColors[k], k === 0 ? 1 : 3 + k, k === 0 ? 'grass' : `row${k % 2}`);
			const hgt = (0.3 / bands) * (0.6 + (0.8 * k) / bands);
			c.paint(p, c.rect(0, y, 1, y + hgt));
			y += hgt + 1.2 / c.h;
		}
		c.part('tower', ['brown', 'slate', 'rust', 'stone', 'chocolate'], 1);
		c.paint(
			'tower',
			c.poly([
				[0.42, 0.74],
				[0.45, 0.34],
				[0.55, 0.34],
				[0.58, 0.74]
			])
		);
		c.part('cap', ['charcoal', 'maroon', 'navy', 'black'], 4, 'tower');
		c.paint('cap', c.and(c.ell(0.5, 0.34, 0.07, 0.07), c.rect(0, 0, 1, 0.35)));
		c.part('door', ['charcoal', 'black', 'maroon', 'navy', 'red'], 5, 'tower', 4);
		c.paint('door', c.rect(0.475, 0.64, 0.525, 0.74));
		c.part('sail', ['white', 'cream', 'snow', 'beige'], 1);
		const a0 = c.r(0, Math.PI / 2);
		for (let k = 0; k < 4; k++) {
			const a = a0 + (k * Math.PI) / 2;
			const ex = 0.5 + Math.cos(a) * 0.32 * (c.h / c.w);
			const ey = 0.32 + Math.sin(a) * 0.32;
			c.paint('sail', c.line(0.5, 0.32, ex, ey, 3.2));
		}
		c.part('hub', ['brown', 'chocolate', 'charcoal'], 6, 'sail', 3);
		c.paint('hub', c.dot(0.5, 0.32, 1.3));
		return timed(time, rows > 3 ? 'Windmill and Tulips' : 'Windmill', c.use);
	}
};

const aurora: Template = {
	id: 'aurora',
	aspect: 1.3,
	draw(c) {
		c.part('sky', ['night', 'navy', 'black', 'plum'], 2);
		c.fill('sky');
		const bands = [
			['lime', 'leaf', 'mint'],
			['turquoise', 'aqua', 'teal'],
			['violet', 'orchid', 'magenta', 'pink']
		];
		const n = c.more(1, 3);
		for (let k = 0; k < n; k++) {
			const p = `aurora${k}`;
			c.part(p, bands[(k + c.use) % 3], k === 0 ? 1 : 3 + k, 'sky');
			const base = 0.18 + k * 0.1;
			const ph = c.r(0, 6);
			c.paint(p, (x, y) => {
				const mid = base + 0.07 * Math.sin(x * 6 + ph);
				return Math.abs(y - mid) < 0.035 + 0.02 * Math.sin(x * 9 + ph);
			});
		}
		stars(c, c.more(2, 6), 0, 0, 1, 0.55);
		hills(c, 'snow', ['white', 'snow', 'ice', 'silver'], 2, 0.62, 0.05, 0.9);
		c.part('lake', ['indigo', 'navy', 'cobalt', 'steel'], 4, 'snow');
		c.paint('lake', c.ell(0.5, 0.86, 0.32, 0.07));
		c.part('pine', ['pine', 'forest', 'black', 'charcoal'], 3, 'snow');
		for (const x of [0.06, 0.14, 0.86, 0.94]) pine(c, x, 0.82, c.r(0.28, 0.4), 0.06, 'pine');
		c.part('cabin', ['brown', 'rust', 'maroon'], 6, 'snow');
		c.part('lit', LIT, 7, 'cabin', 4);
		if (c.t > 0.4)
			house(c, 0.62, 0.74, 0.62, 0.72, { wall: 'cabin', roof: 'cabin', window: 'lit' });
		if (c.chance(0.5)) c.mirror();
		return c.cycle(['Aurora', 'Aurora over the Lake', 'Polar Night'], 9);
	}
};

const beach: Template = {
	id: 'beach',
	aspect: 1.3,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'day']);
		sky(c, time);
		sun(c, time, c.pick([0.15, 0.85]), 0.14, 0.08, 5);
		clouds(c, time, c.more(1, 2), 0.05, 0.2, 6);
		c.part('sea', ['blue', 'azure', 'turquoise', 'cobalt'], 2);
		c.paint('sea', c.rect(0, 0.4, 1, 1));
		c.part('foam', ['white', 'snow', 'ice', 'aqua'], 4, 'sea');
		c.paint('foam', c.below(c.wave(0.58, 0.02, 3, 0)));
		c.part('sand', ['sand', 'beige', 'gold', 'cream'], 1);
		c.paint('sand', c.below(c.wave(0.62, 0.02, 3, 0)));
		c.part('pole', ['white', 'charcoal', 'brown', 'silver'], 5, 'sand', 4);
		c.paint('pole', c.line(0.42, 0.3, 0.46, 0.9, 1.3));
		c.part('canopy', ['red', 'orange', 'cobalt', 'magenta', 'teal'], 1);
		c.part('stripe', ['white', 'yellow', 'lemon', 'snow'], 3, 'canopy');
		const cx = 0.42;
		const cy = 0.32;
		const shape = c.and(c.ell(cx, cy, 0.24, 0.16), c.rect(0, 0, 1, cy));
		c.paint('canopy', shape);
		for (const k of [-2, 0, 2])
			c.paintOver(
				'stripe',
				c.and(
					shape,
					c.poly([
						[cx, cy + 0.02],
						[cx + (k - 0.5) * 0.12, cy - 0.3],
						[cx + (k + 0.5) * 0.12, cy - 0.3]
					])
				),
				['canopy']
			);
		c.part('towel', ['pink', 'violet', 'lime', 'red', 'cobalt', 'orange'], 4, 'sand');
		c.paint(
			'towel',
			c.poly([
				[0.55, 0.72],
				[0.86, 0.7],
				[0.9, 0.84],
				[0.58, 0.86]
			])
		);
		c.part('towel2', ['white', 'yellow', 'snow', 'lemon'], 6, 'towel');
		c.paintOver('towel2', c.rect(0, 0.76, 1, 0.79), ['towel']);
		c.part('ball', ['red', 'yellow', 'cobalt', 'orange'], 7, 'sand');
		c.paint('ball', c.circ(0.18, 0.84, 0.06));
		if (c.chance(0.5)) c.mirror();
		return timed(time, c.use % 2 ? 'Seaside' : 'Beach Day', c.use);
	}
};

const wave: Template = {
	id: 'wave',
	aspect: 1.3,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'dawn']);
		sky(c, time);
		sun(c, time, 0.82, 0.18, 0.09, 4);
		clouds(c, time, c.more(0, 2), 0.05, 0.15, 7);
		c.part('sea', ['blue', 'cobalt', 'azure'], 2);
		c.paint('sea', c.rect(0, 0.62, 1, 1));
		c.part('isle', ['olive', 'forest', 'lavender', 'sage'], 5, 'sky');
		c.paint('isle', c.and(c.ell(0.85, 0.62, 0.12, 0.08), c.rect(0, 0, 1, 0.62)));
		c.part('gull', ['white', 'charcoal', 'snow'], 7, 'sky', 4);
		for (const [gx, gy] of [
			[0.62, 0.12],
			[0.7, 0.2]
		]) {
			c.paint('gull', c.line(gx - 0.03, gy - 0.02, gx, gy, 1));
			c.paint('gull', c.line(gx, gy, gx + 0.03, gy - 0.02, 1));
		}
		c.part('wave', ['navy', 'cobalt', 'blue', 'teal'], 1);
		c.part('mid', ['turquoise', 'teal', 'azure', 'aqua'], 3, 'wave');
		c.part('tube', ['aqua', 'ice', 'mint', 'sky'], 4, 'mid');
		c.part('foam', ['white', 'snow'], 1);
		const m = Math.min(c.w, c.h);
		const cx = 0.36;
		const cy = 0.44;
		const R = 0.27;
		/** Angle around the curl's center, in degrees: 0 right, 90 down. */
		const ang = (x: number, y: number) =>
			(Math.atan2((y - cy) * c.h, (x - cx) * c.w) * 180) / Math.PI;
		const rad = (x: number, y: number) => Math.hypot((x - cx) * c.w, (y - cy) * c.h) / m;
		c.paint(
			'wave',
			c.poly([
				[cx, cy - R * (m / c.h)],
				[1.05, 0.5],
				[1.05, 0.8],
				[0.05, 0.8]
			])
		);
		c.paint('wave', c.circ(cx, cy, R));
		c.paintOver('mid', (x, y) => rad(x, y) < R * 0.68 || (x > cx && y > cy + 0.08 && y < 0.72), [
			'wave'
		]);
		c.paint(
			'tube',
			(x, y) =>
				rad(x, y) < R * 0.42 ||
				(x < cx && y > cy && ang(x, y) > 95 && ang(x, y) < 150 && rad(x, y) < R * 0.9)
		);
		c.paint('foam', (x, y) => {
			const a = ang(x, y);
			const r = rad(x, y);
			return r > R * 0.78 && r < R * 1.02 && (a < -20 || a > 150);
		});
		c.paint('foam', c.circ(cx - R * 0.72 * (m / c.w), cy + 0.04, 0.05));
		c.part('sand', ['sand', 'beige', 'gold', 'tan'], 3, 'sea');
		c.paint('sand', c.below(c.wave(0.9, 0.02, 1, 0.2)));
		c.part('board', ['red', 'orange', 'yellow', 'pink'], 6, 'mid', 4);
		if (c.t > 0.3) c.paint('board', c.line(0.62, 0.5, 0.72, 0.46, 1.6));
		if (c.chance(0.5)) c.mirror();
		return timed(time, c.cycle(['Wave', 'Big Wave', 'Curling Wave'], 9), c.use);
	}
};

const village: Template = {
	id: 'village',
	aspect: 1.35,
	draw(c) {
		const time = c.cycle<Time>(['night', 'dusk', 'night']);
		const snowy = c.use === 2;
		sky(c, time);
		sun(c, time, c.pick([0.15, 0.85]), 0.14, 0.08, 3);
		if (time === 'night') stars(c, c.more(2, 6), 0, 0, 1, 0.35);
		glow(c, time, 0.3, 0.6, 3);
		hills(
			c,
			'hill',
			snowy ? SNOW : ['forest', 'pine', 'olive', 'teal', 'indigo'],
			2,
			0.55,
			0.06,
			0.8
		);
		c.part('lit', LIT, 1, undefined, 4);
		const n = c.more(3, 5);
		for (let k = 0; k < n; k++) {
			const wall = `wall${k % 3}`;
			const roof = `roof${k % 2}`;
			c.part(wall, WALL, k === 0 ? 1 : 3 + (k % 3), 'wall0');
			c.part(roof, snowy ? SNOW.concat(['silver']) : ROOF, k === 0 ? 1 : 4, 'roof0');
			const x0 = 0.04 + (k / n) * 0.92;
			const x1 = x0 + (0.92 / n) * 0.8;
			const top = 0.5 + ((k * 5) % 3) * 0.04;
			house(c, x0, x1, top, 0.86, { wall, roof, window: 'lit', door: roof });
		}
		c.part('tree', ['pine', 'forest', 'black', 'teal'], 6, 'hill');
		for (const x of [0.02, 0.98]) pine(c, x, 0.7, 0.22, 0.05, 'tree');
		c.part('road', ['stone', 'sand', 'tan', 'slate'], 5, 'hill');
		c.paint('road', c.rect(0, 0.88, 1, 1));
		return snowy ? 'Snowy Village' : timed(time, 'Village', c.use);
	}
};

const tent: Template = {
	id: 'tent',
	aspect: 1.25,
	draw(c) {
		const time = c.cycle<Time>(['night', 'dusk', 'night']);
		sky(c, time);
		sun(c, time, c.pick([0.2, 0.8]), 0.13, 0.07, 4);
		if (time === 'night') stars(c, c.more(2, 6), 0, 0, 1, 0.4);
		c.part('mtn', ['slate', 'indigo', 'purple', 'steel', 'lavender'], 4, 'sky');
		c.paint(
			'mtn',
			c.poly([
				[0.1, 0.68],
				[0.36, 0.34],
				[0.56, 0.52],
				[0.7, 0.4],
				[0.96, 0.68]
			])
		);
		c.part('pine', ['pine', 'forest', 'black', 'teal'], 3, 'sky');
		for (const x of [0.06, 0.92]) pine(c, x, 0.72, c.r(0.4, 0.5), 0.09, 'pine');
		c.part('lake', ['cobalt', 'blue', 'navy', 'teal'], 5, 'ground');
		hills(c, 'ground', ['forest', 'olive', 'green', 'pine'], 2, 0.66, 0.015, 1);
		c.part('tent', ['orange', 'red', 'yellow', 'gold'], 1);
		c.paint(
			'tent',
			c.poly([
				[0.16, 0.84],
				[0.38, 0.4],
				[0.6, 0.84]
			])
		);
		c.part('door', ['maroon', 'chocolate', 'rust', 'brown', 'charcoal'], 3, 'tent');
		c.paint(
			'door',
			c.poly([
				[0.31, 0.84],
				[0.38, 0.56],
				[0.45, 0.84]
			])
		);
		c.paint('lake', c.ell(0.5, 0.95, 0.3, 0.05));
		c.part('log', WOOD, 4, 'ground');
		c.paint('log', c.line(0.66, 0.86, 0.84, 0.82, 2));
		c.paint('log', c.line(0.66, 0.82, 0.84, 0.86, 2));
		c.part('flame', ['orange', 'red', 'amber'], 1);
		c.paint(
			'flame',
			c.poly([
				[0.68, 0.82],
				[0.7, 0.66],
				[0.74, 0.72],
				[0.76, 0.58],
				[0.79, 0.7],
				[0.82, 0.64],
				[0.82, 0.82]
			])
		);
		c.part('core', ['yellow', 'lemon', 'gold'], 4, 'flame');
		c.paint(
			'core',
			c.poly([
				[0.72, 0.82],
				[0.75, 0.7],
				[0.78, 0.82]
			])
		);
		if (c.chance(0.5)) c.mirror();
		return timed(time, c.cycle(['Campsite', 'Campfire', 'Tent in the Pines'], 9), c.use);
	}
};

const cottage: Template = {
	id: 'cottage',
	aspect: 1.3,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dawn', 'dusk']);
		sky(c, time);
		sun(c, time, c.pick([0.12, 0.88]), 0.14, 0.08, 5);
		clouds(c, time, c.more(1, 2), 0.05, 0.18, 6);
		hills(c, 'grass', GRASS, 2, 0.74, 0.01, 1);
		c.part('wall', ['cream', 'white', 'beige', 'blush', 'peach'], 1);
		c.part('thatch', ['gold', 'tan', 'caramel', 'amber', 'sand'], 1);
		c.part('door', ['red', 'cobalt', 'teal', 'crimson', 'forest'], 3, 'wall');
		c.part('glass', ['sky', 'azure', 'ice', 'aqua'], 4, 'wall', 4);
		c.paint('wall', c.rect(0.22, 0.48, 0.72, 0.82));
		c.paint(
			'thatch',
			c.poly([
				[0.16, 0.5],
				[0.3, 0.24],
				[0.64, 0.24],
				[0.78, 0.5]
			])
		);
		c.part('chimney', ['rust', 'stone', 'brown', 'maroon'], 5, 'thatch');
		c.paint('chimney', c.rect(0.6, 0.16, 0.66, 0.32));
		c.part('smoke', ['silver', 'grey', 'white'], 7, 'sky');
		c.paint('smoke', c.circ(0.65, 0.1, 0.04));
		c.paint('smoke', c.circ(0.7, 0.05, 0.05));
		c.paint('door', c.rect(0.43, 0.6, 0.51, 0.82));
		for (const x of [0.29, 0.6]) c.paint('glass', c.rect(x, 0.58, x + 0.08, 0.7));
		c.part('path', ['tan', 'stone', 'sand', 'beige'], 4, 'grass');
		c.paint(
			'path',
			c.poly([
				[0.43, 0.82],
				[0.51, 0.82],
				[0.6, 1],
				[0.36, 1]
			])
		);
		c.part('bloom', ['pink', 'red', 'violet', 'yellow', 'orange'], 5, 'grass', 4);
		c.part('bush', DARK_GRASS, 4, 'grass');
		for (const x of [0.12, 0.26, 0.68, 0.82]) {
			c.paint('bush', c.ell(x, 0.84, 0.07, 0.06));
			c.paint('bloom', c.dot(x - 0.02, 0.82, 1.1));
			c.paint('bloom', c.dot(x + 0.03, 0.85, 1.1));
		}
		c.part('fence', ['white', 'snow', 'brown', 'caramel'], 6, 'grass');
		for (let x = 0.02; x < 1; x += 0.08)
			if (x < 0.35 || x > 0.6) c.paint('fence', c.rect(x, 0.88, x + 1.4 / c.w, 0.98));
		c.paint('fence', c.and(c.rect(0, 0.91, 1, 0.91 + 1 / c.h), c.not(c.rect(0.36, 0, 0.6, 1))));
		if (c.chance(0.5)) c.mirror();
		return timed(time, c.use % 2 ? 'Cottage Garden' : 'Cottage', c.use);
	}
};

const igloo: Template = {
	id: 'igloo',
	aspect: 1.25,
	draw(c) {
		const time = c.cycle<Time>(['day', 'night', 'dusk']);
		sky(c, time);
		sun(c, time, c.pick([0.15, 0.85]), 0.14, 0.08, 4);
		if (time === 'night') {
			c.part('aurora', ['lime', 'turquoise', 'violet'], 5, 'sky');
			c.paint('aurora', (x, y) => Math.abs(y - 0.2 - 0.06 * Math.sin(x * 7)) < 0.035);
			stars(c, c.more(2, 5), 0, 0, 1, 0.4);
		}
		c.part('sea', ['blue', 'cobalt', 'teal', 'navy'], 4, 'sky');
		c.paint('sea', c.rect(0, 0.5, 1, 0.6));
		c.part('berg', ['white', 'snow', 'ice', 'aqua'], 5, 'sea');
		c.paint(
			'berg',
			c.poly([
				[0.62, 0.52],
				[0.7, 0.42],
				[0.76, 0.46],
				[0.82, 0.52]
			])
		);
		hills(c, 'snow', ['silver', 'ice', 'lilac', 'lavender', 'sky'], 2, 0.58, 0.02, 1);
		c.part('pole', ['brown', 'chocolate', 'charcoal'], 6, 'sky', 4);
		c.part('flag', ['red', 'orange', 'yellow', 'pink'], 6, 'pole', 4);
		c.paint('pole', c.rect(0.46, 0.18, 0.46 + 1 / c.w, 0.4));
		c.paint(
			'flag',
			c.poly([
				[0.47, 0.18],
				[0.58, 0.21],
				[0.47, 0.25]
			])
		);
		c.part('block', ['white', 'snow'], 1);
		c.paint('block', c.and(c.ell(0.46, 0.8, 0.3, 0.42), c.rect(0, 0, 1, 0.8)));
		c.paint('block', c.rect(0.58, 0.6, 0.86, 0.8));
		c.paint('block', c.and(c.ell(0.86, 0.7, 0.04, 0.1), c.rect(0, 0, 1, 1)));
		c.part('seam', ['ice', 'sky', 'silver', 'aqua', 'lilac'], 3, 'block', 4);
		const rowH = Math.max(3, Math.round(c.h * 0.09));
		for (let y = Math.round(0.8 * c.h) - rowH; y > 0; y -= rowH) {
			c.paintOver('seam', c.shape(['rect', 0, y, c.w, 1]), ['block']);
			const off = ((y / rowH) % 2) * 3;
			for (let x = off; x < c.w; x += 6)
				c.paintOver('seam', c.shape(['rect', x, y, 1, rowH]), ['block']);
		}
		c.part('door', ['charcoal', 'navy', 'slate', 'black'], 3, 'block');
		c.paint('door', c.and(c.ell(0.76, 0.8, 0.07, 0.12), c.rect(0, 0, 1, 0.8)));
		c.part('fish', ['orange', 'salmon', 'coral'], 7, 'snow');
		if (c.t > 0.4) {
			c.paint('fish', c.ell(0.18, 0.9, 0.05, 0.025));
			c.paint(
				'fish',
				c.poly([
					[0.22, 0.9],
					[0.26, 0.87],
					[0.26, 0.93]
				])
			);
		}
		if (c.chance(0.5)) c.mirror();
		return timed(time, 'Igloo', c.use);
	}
};

const castle: Template = {
	id: 'castle',
	aspect: 1.1,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'night', 'dawn']);
		sky(c, time);
		sun(c, time, c.pick([0.12, 0.88]), 0.12, 0.07, 5);
		if (time === 'night') stars(c, c.more(2, 4), 0, 0, 1, 0.3);
		clouds(c, time, c.more(0, 2), 0.05, 0.2, 7);
		hills(c, 'hill', GRASS, 2, 0.78, 0.03, 0.7);
		c.part('stone', ['silver', 'grey', 'stone', 'beige', 'sand'], 1);
		c.part('cone', ['cobalt', 'red', 'violet', 'navy', 'crimson', 'teal'], 1);
		c.paint('stone', c.rect(0.22, 0.46, 0.78, 0.82));
		for (let x = 0.22; x < 0.78; x += 0.08) c.paint('stone', c.rect(x, 0.42, x + 0.04, 0.46));
		for (const [x, top, w] of [
			[0.18, 0.34, 0.08],
			[0.82, 0.34, 0.08],
			[0.5, 0.22, 0.1]
		]) {
			c.paint('stone', c.rect(x - w, top, x + w, 0.82));
			c.paint(
				'cone',
				c.poly([
					[x - w - 0.02, top],
					[x, top - 0.2],
					[x + w + 0.02, top]
				])
			);
		}
		c.part('gate', ['chocolate', 'charcoal', 'brown', 'black'], 3, 'stone');
		c.paint('gate', c.and(c.ell(0.5, 0.7, 0.07, 0.1), c.rect(0, 0, 1, 1)));
		c.paint('gate', c.rect(0.43, 0.7, 0.57, 0.82));
		c.part('slit', time === 'night' ? LIT : ['charcoal', 'navy', 'black', 'slate'], 4, 'stone', 4);
		for (const x of [0.18, 0.5, 0.82]) c.paint('slit', c.rect(x - 1 / c.w, 0.4, x + 1 / c.w, 0.48));
		c.part('flag', ['yellow', 'red', 'gold', 'white', 'orange'], 5, 'sky', 4);
		c.paint('flag', c.line(0.5, 0.02, 0.5, 0.06, 1));
		c.paint(
			'flag',
			c.poly([
				[0.5, 0.01],
				[0.6, 0.035],
				[0.5, 0.06]
			])
		);
		c.part('moat', WATER, 4, 'hill');
		c.paint('moat', c.rect(0, 0.86, 1, 0.94));
		c.part('bridge', WOOD, 5, 'moat');
		c.paint('bridge', c.rect(0.43, 0.82, 0.57, 0.95));
		return timed(time, c.use % 2 ? 'Hilltop Castle' : 'Castle', c.use);
	}
};

const skyline: Template = {
	id: 'skyline',
	aspect: 1.3,
	draw(c) {
		const time = c.cycle<Time>(['night', 'dusk', 'day', 'dawn']);
		sky(c, time);
		glow(c, time, 0.3, 0.7, 5);
		sun(c, time, c.pick([0.15, 0.85]), 0.12, 0.07, 6);
		if (time === 'night') stars(c, c.more(1, 4), 0, 0, 1, 0.25);
		const towers = [
			['charcoal', 'slate', 'navy'],
			['steel', 'stone', 'indigo'],
			['plum', 'purple', 'teal', 'maroon']
		];
		c.part(
			'win',
			time === 'night' || time === 'dusk' ? LIT : ['ice', 'sky', 'aqua', 'white'],
			1,
			undefined,
			4
		);
		const n = c.more(6, 9);
		let x = 0;
		for (let k = 0; k < n; k++) {
			const bw = (1 / n) * c.r(0.85, 1.25);
			const top = c.r(0.28, 0.6);
			const p = `tower${k % 3}`;
			c.part(p, towers[k % 3], k % 3 === 0 ? 1 : 3 + (k % 3), 'tower0');
			c.paint(p, c.rect(x, top, x + bw, 0.84));
			if (k % 3 === 1) c.paint(p, c.rect(x + bw * 0.4, top - 0.08, x + bw * 0.6, top));
			const cols = Math.max(1, Math.floor((bw * c.w - 1) / 3));
			for (let wy = Math.ceil(top * c.h) + 1; wy < 0.8 * c.h - 1; wy += 3) {
				for (let cx = 0; cx < cols; cx++) {
					if ((wy + cx + k) % 4 === 0) continue;
					const wx = Math.floor(x * c.w) + 1 + cx * 3;
					c.paint('win', c.shape(['rect', wx, wy, 2, 2]));
				}
			}
			x += bw;
			if (x > 1) break;
		}
		c.part('river', ['navy', 'cobalt', 'blue', 'indigo', 'teal'], 2);
		c.paint('river', c.rect(0, 0.84, 1, 1));
		c.part('shine', LIT.concat(['white']), 6, 'river', 4);
		for (let k = 0; k < c.more(2, 5); k++)
			c.paint(
				'shine',
				c.line(c.r(0.05, 0.8), 0.88 + (k % 3) * 0.04, c.r(0.1, 0.95), 0.88 + (k % 3) * 0.04, 1)
			);
		return timed(time, c.use % 2 ? 'Downtown' : 'City Lights', c.use);
	}
};

const bridge: Template = {
	id: 'bridge',
	aspect: 1.5,
	draw(c) {
		const time = c.cycle<Time>(['dusk', 'day', 'dawn']);
		sky(c, time);
		glow(c, time, 0.4, 0.62, 5);
		sun(c, time, 0.5, 0.42, 0.13, 3);
		clouds(c, time, c.more(0, 2), 0.05, 0.15, 7);
		c.part('hill', ['olive', 'forest', 'teal', 'lavender', 'slate'], 4, 'sky');
		c.paint('hill', c.below(c.wave(0.48, 0.06, 0.6, 0.1)));
		c.part('water', WATER, 2);
		c.paint('water', c.rect(0, 0.62, 1, 1));
		c.part('steel', ['red', 'orange', 'rust', 'crimson'], 1);
		for (const x of [0.25, 0.75]) {
			c.paint('steel', c.rect(x - 0.025, 0.12, x - 0.01, 0.82));
			c.paint('steel', c.rect(x + 0.01, 0.12, x + 0.025, 0.82));
			for (const y of [0.14, 0.3, 0.46])
				c.paint('steel', c.rect(x - 0.025, y, x + 0.025, y + 0.03));
		}
		const cable = (x0: number, x1: number, sag: number) => (x: number, y: number) => {
			if (x < x0 || x > x1) return false;
			const t = (x - x0) / (x1 - x0);
			const cy = 0.14 + sag * (1 - (2 * t - 1) ** 2);
			return Math.abs((y - cy) * c.h) < 0.8;
		};
		c.paint('steel', cable(0.25, 0.75, 0.42));
		c.paint('steel', cable(-0.25, 0.25, 0.42));
		c.paint('steel', cable(0.75, 1.25, 0.42));
		c.part('deck', ['charcoal', 'slate', 'black', 'navy'], 1);
		c.paint('deck', c.rect(0, 0.56, 1, 0.6));
		c.part('glint', ['white', 'ice', 'aqua', 'sky'], 6, 'water');
		for (let k = 0; k < c.more(2, 5); k++)
			c.paint('glint', c.line(c.r(0.05, 0.7), 0.7 + k * 0.06, c.r(0.3, 0.95), 0.7 + k * 0.06, 1));
		c.part('boat', ['white', 'yellow', 'snow'], 7, 'water');
		if (c.t > 0.4)
			c.paint(
				'boat',
				c.poly([
					[0.6, 0.86],
					[0.72, 0.86],
					[0.7, 0.9],
					[0.62, 0.9]
				])
			);
		return timed(time, c.use % 2 ? 'Bridge at Sunset' : 'Red Bridge', 0);
	}
};

const street: Template = {
	id: 'street',
	aspect: 1.3,
	draw(c) {
		const time = c.cycle<Time>(['day', 'dusk', 'dawn']);
		sky(c, time);
		clouds(c, time, c.more(1, 2), 0.04, 0.12, 6);
		const fronts = [
			['red', 'coral', 'crimson'],
			['yellow', 'gold', 'lemon'],
			['teal', 'turquoise', 'aqua'],
			['pink', 'rose', 'blush'],
			['lavender', 'violet', 'lilac'],
			['lime', 'leaf', 'mint']
		];
		const n = c.more(3, 5);
		c.part('glass', ['white', 'snow', 'ice'], 3, undefined, 4);
		c.part('roofs', ['slate', 'charcoal', 'navy', 'maroon', 'brown'], 2);
		for (let k = 0; k < n; k++) {
			const p = `front${k}`;
			c.part(p, fronts[(k + c.use) % fronts.length], k < 2 ? 1 : 3 + k, `front${k % 2}`);
			const x0 = k / n;
			const x1 = (k + 1) / n;
			const top = 0.22 + ((k * 7) % 3) * 0.06;
			c.paint(p, c.rect(x0, top, x1, 0.82));
			c.paint('roofs', c.rect(x0, top - 0.04, x1, top));
			if (k % 2)
				c.paint(
					'roofs',
					c.poly([
						[x0, top - 0.04],
						[(x0 + x1) / 2, top - 0.14],
						[x1, top - 0.04]
					])
				);
			const wx = [x0 + (x1 - x0) * 0.2, x1 - (x1 - x0) * 0.2 - 2 / c.w];
			for (let wy = top + 0.06; wy < 0.6; wy += 0.14)
				for (const x of wx) c.paint('glass', c.rect(x, wy, x + 2 / c.w, wy + 0.08));
			c.paint('roofs', c.rect((x0 + x1) / 2 - 1.2 / c.w, 0.68, (x0 + x1) / 2 + 1.2 / c.w, 0.82));
		}
		c.part('walk', ['silver', 'stone', 'beige', 'grey'], 2);
		c.paint('walk', c.rect(0, 0.82, 1, 0.9));
		c.part('road', ['charcoal', 'slate', 'black'], 4, 'walk');
		c.paint('road', c.rect(0, 0.9, 1, 1));
		return timed(time, c.use % 2 ? 'Row Houses' : 'Painted Houses', c.use);
	}
};

const ferris: Template = {
	id: 'ferris',
	aspect: 1,
	draw(c) {
		const time = c.cycle<Time>(['dusk', 'night', 'day']);
		sky(c, time);
		if (time === 'night') stars(c, c.more(2, 5), 0, 0, 1, 0.3);
		glow(c, time, 0.56, 0.9, 3);
		c.part('ground', ['forest', 'green', 'olive', 'slate', 'charcoal'], 2);
		c.paint('ground', c.rect(0, 0.86, 1, 1));
		c.part('frame', ['white', 'silver', 'snow', 'charcoal', 'slate'], 1);
		const cx = 0.5;
		const cy = 0.42;
		const R = 0.36;
		const m = Math.min(c.w, c.h);
		c.paint('frame', c.and(c.circ(cx, cy, R), c.not(c.circ(cx, cy, R - 1.7 / m))));
		const spokes = m < 28 ? 2 : 3;
		for (let k = 0; k < spokes; k++) {
			const a = (k / spokes) * Math.PI + Math.PI / 4;
			const dx = (Math.cos(a) * R * m) / c.w;
			const dy = (Math.sin(a) * R * m) / c.h;
			c.paint('frame', c.line(cx - dx, cy - dy, cx + dx, cy + dy, 1.2));
		}
		c.paint('frame', c.line(cx, cy, cx - 0.2, 0.88, 1.6));
		c.paint('frame', c.line(cx, cy, cx + 0.2, 0.88, 1.6));
		c.part('hub', ['gold', 'red', 'yellow', 'orange'], 5, 'frame', 3);
		c.paint('hub', c.dot(cx, cy, 1.6));
		const cars = [
			['red', 'crimson'],
			['yellow', 'gold'],
			['cobalt', 'azure', 'blue'],
			['leaf', 'lime', 'green']
		];
		for (let k = 0; k < 6; k++) {
			const a = (k / 6) * 2 * Math.PI;
			const p = `car${k % 4}`;
			c.part(p, cars[k % 4], k % 4 === 0 ? 1 : 3 + (k % 4), 'car0');
			const x = cx + (Math.cos(a) * R * Math.min(c.w, c.h)) / c.w;
			const y = cy + (Math.sin(a) * R * Math.min(c.w, c.h)) / c.h;
			c.paint(p, c.rect(x - 1.5 / c.w, y + 0.5 / c.h, x + 1.5 / c.w, y + 3.5 / c.h));
		}
		c.part('tent', ['red', 'magenta', 'violet', 'cobalt'], 5, 'ground');
		c.part('tent2', ['white', 'cream', 'yellow'], 7, 'tent');
		const tx = c.pick([0.12, 0.88]);
		c.paint(
			'tent',
			c.poly([
				[tx - 0.12, 0.9],
				[tx, 0.7],
				[tx + 0.12, 0.9]
			])
		);
		c.paintOver(
			'tent2',
			c.poly([
				[tx - 0.03, 0.9],
				[tx, 0.7],
				[tx + 0.03, 0.9]
			]),
			['tent']
		);
		return timed(time, c.use % 2 ? 'Fair at Night' : 'Ferris Wheel', c.use);
	}
};

export const SCENES: Template[] = [
	farm,
	pines,
	autumn,
	volcano,
	waterfall,
	storm,
	snowman,
	island,
	canyon,
	windmill,
	aurora,
	beach,
	wave,
	village,
	tent,
	cottage,
	igloo,
	castle,
	skyline,
	bridge,
	street,
	ferris
];
