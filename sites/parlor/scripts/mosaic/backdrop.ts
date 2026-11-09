/*
 * Pieces many Mosaic pictures share: a sky for a time of day, a sun or moon, clouds,
 * stars and rolling hills. Each paints a named part with true colors for that time.
 */
import type { Canvas } from './canvas.ts';

export type Time = 'day' | 'dusk' | 'night' | 'dawn';

export interface Template {
	id: string;
	/** Width over height. */
	aspect: number;
	/** How many levels may use it (default 4). */
	max?: number;
	/** Paint the picture; returns its name. */
	draw(c: Canvas): string;
}

const SKY: Record<Time, string[]> = {
	day: ['sky', 'azure', 'ice', 'aqua'],
	dusk: ['apricot', 'salmon', 'peach', 'rose', 'lavender'],
	night: ['night', 'navy', 'indigo', 'plum'],
	dawn: ['blush', 'lilac', 'peach', 'lemon', 'mint']
};
const GLOW: Record<Time, string[]> = {
	day: ['ice', 'white', 'aqua', 'mint'],
	dusk: ['orange', 'gold', 'pink', 'coral', 'yellow'],
	night: ['indigo', 'purple', 'navy', 'violet'],
	dawn: ['lemon', 'gold', 'apricot', 'peach', 'yellow']
};
const SUN: Record<Time, string[]> = {
	day: ['yellow', 'lemon', 'gold'],
	dusk: ['orange', 'red', 'gold', 'yellow'],
	night: ['cream', 'lemon', 'white', 'snow'],
	dawn: ['yellow', 'gold', 'white', 'coral']
};
const CLOUD: Record<Time, string[]> = {
	day: ['white', 'snow', 'cream'],
	dusk: ['lilac', 'blush', 'lavender', 'cream', 'rose'],
	night: ['slate', 'steel', 'indigo', 'grey'],
	dawn: ['white', 'cream', 'snow', 'blush']
};

/**
 * "Fox" at a time of day, as a level name. `alt` picks between two wordings; long names
 * always take the one with the time after them.
 */
export function timed(time: Time, name: string, alt: number): string {
	if (/^(The|A) | (under|over|on|in|and|of|at|by) /.test(name)) alt = 1;
	switch (time) {
		case 'day':
			return name;
		case 'dusk':
			return alt % 2 ? `${name} at Sunset` : `${name} at Dusk`;
		case 'night':
			return alt % 2 ? `${name} by Moonlight` : `Night ${name}`;
		case 'dawn':
			return alt % 2 ? `${name} at Dawn` : `Morning ${name}`;
	}
}

/** The sky part for a time of day, filling the picture unless `fill` is false. */
export function sky(c: Canvas, time: Time, pri = 2, fill = true, orElse?: string) {
	c.part('sky', SKY[time], pri, orElse);
	// Split in two, its lower band glows like the horizon.
	c.parts.get('sky')!.tones = GLOW[time];
	if (fill) c.fill('sky');
}

/** A band of glow above the horizon, from y0 down to y1 (fractions), wavy at the top. */
export function glow(c: Canvas, time: Time, y0: number, y1: number, pri: number) {
	c.part('glow', GLOW[time], pri, 'sky');
	const f = c.wave(y0, 0.015, c.r(0.6, 1.4), c.r(0, 1));
	c.paint('glow', (x, y) => y >= f(x) && y < y1);
}

/** The sun, or the moon at night. r in fractions of the shorter side. */
export function sun(c: Canvas, time: Time, x: number, y: number, r: number, pri: number) {
	c.part('sun', SUN[time], pri, 'sky');
	c.paint('sun', c.circ(x, y, r));
	if (time === 'night' && c.chance(0.5)) {
		// A crescent: bite the moon with the sky.
		const d = r * 0.55;
		c.paintOver(
			'sky',
			c.circ(x + d * (c.chance(0.5) ? 1 : -1) * (c.h / c.w), y - d * 0.4, r * 0.85),
			['sun']
		);
	}
}

/** A puffy cloud made of three circles, centered at (x, y), about `s` across (of the shorter side). */
function cloud(c: Canvas, time: Time, x: number, y: number, s: number, pri: number) {
	c.part('cloud', CLOUD[time], pri, 'sky');
	const k = c.h / c.w;
	c.paint('cloud', c.circ(x, y, s * 0.3));
	c.paint('cloud', c.circ(x - s * 0.32 * k, y + s * 0.08, s * 0.22));
	c.paint('cloud', c.circ(x + s * 0.34 * k, y + s * 0.07, s * 0.24));
	c.paint('cloud', c.rect(x - s * 0.5 * k, y + s * 0.02, x + s * 0.55 * k, y + s * 0.22));
}

/** `n` clouds spread across the band y0..y1, over whatever is there. */
export function clouds(c: Canvas, time: Time, n: number, y0: number, y1: number, pri: number) {
	for (let i = 0; i < n; i++) {
		const x = (i + c.r(0.25, 0.75)) / n;
		cloud(c, time, x, c.r(y0, y1), c.r(0.22, 0.32), pri);
	}
}

/** Stars as small plus signs (5 cells), in the box, only over `host` (the sky). */
export function stars(
	c: Canvas,
	n: number,
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	pri = 6,
	host = 'sky'
) {
	c.part('star', ['yellow', 'lemon', 'white', 'cream', 'gold'], pri, host, 4);
	const spots: [number, number][] = [];
	for (let tries = 0; tries < n * 30 && spots.length < n; tries++) {
		const cx = Math.floor(c.r(x0, x1) * c.w);
		const cy = Math.floor(c.r(y0, y1) * c.h);
		if (cx < 1 || cy < 1 || cx > c.w - 2 || cy > c.h - 2) continue;
		if (spots.some(([sx, sy]) => Math.abs(sx - cx) < 5 && Math.abs(sy - cy) < 5)) continue;
		let ok = true;
		for (let dy = -2; dy <= 2; dy++)
			for (let dx = -2; dx <= 2; dx++) if (c.grid[(cy + dy) * c.w + cx + dx] !== host) ok = false;
		if (!ok) continue;
		spots.push([cx, cy]);
		c.paint('star', c.shape(['rect', cx - 1, cy, 3, 1]));
		c.paint('star', c.shape(['rect', cx, cy - 1, 1, 3]));
	}
}

/** Hills: everything below a wavy line (base, amplitude, waves across, all fractions). */
export function hills(
	c: Canvas,
	name: string,
	colors: string[],
	pri: number,
	base: number,
	amp: number,
	waves = c.r(0.6, 1.4),
	orElse?: string
) {
	c.part(name, colors, pri, orElse);
	c.paint(name, c.below(c.wave(base, amp, waves, c.r(0, 1))));
}

export const GRASS = ['green', 'leaf', 'forest', 'olive', 'sage', 'lime'];
export const DARK_GRASS = ['forest', 'pine', 'green', 'olive'];
export const WATER = ['blue', 'azure', 'cobalt', 'teal', 'turquoise', 'navy'];
export const WOOD = ['brown', 'chocolate', 'caramel', 'rust'];
