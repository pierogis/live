/*
 * Checks every game's pictures share: is it a well-formed picture with colors that
 * are easy to tell apart. Each game adds its own checks on top (can it be won, how
 * hard is it). Imports use `.ts` so node scripts can load this file directly.
 */
import { closePairs } from '../palette.ts';

export interface Picture {
	id: string;
	name: string;
	palette: Record<string, string>;
	art: string[];
}

export interface PictureCheck {
	w: number;
	h: number;
	/** Pixels per color key ('.' left out). */
	counts: Record<string, number>;
	/** Pixels that aren't empty. */
	pixels: number;
	/** Must fix: no game can use the picture like this. */
	problems: string[];
	/** Worth a look, but usable. */
	warnings: string[];
}

export function checkPicture(lv: Picture): PictureCheck {
	const problems: string[] = [];
	const warnings: string[] = [];
	const h = lv.art.length;
	const w = lv.art[0]?.length ?? 0;
	const counts: Record<string, number> = {};
	for (const row of lv.art) {
		for (const ch of row) if (ch !== '.') counts[ch] = (counts[ch] || 0) + 1;
	}
	if (!lv.id.trim()) problems.push('needs an id');
	if (!lv.name.trim()) problems.push('needs a name');
	if (lv.art.some((row) => row.length !== w)) problems.push('rows are not all the same width');
	for (const k of Object.keys(counts)) if (!(k in lv.palette)) problems.push(`"${k}" has no color`);
	if (Object.keys(counts).length < 2) problems.push('needs at least 2 colors');
	for (const p of closePairs(lv.palette, Object.keys(counts))) {
		problems.push(`${p.a} and ${p.b} look alike (${p.delta.toFixed(0)}, needs 28)`);
	}
	for (const k of Object.keys(lv.palette)) if (!counts[k]) warnings.push(`${k} isn't used`);
	if (w > 40 || h > 44) warnings.push(`${w}x${h} is very big for a phone`);
	const pixels = Object.values(counts).reduce((a, b) => a + b, 0);
	return { w, h, counts, pixels, problems, warnings };
}
