/*
 * Text on a colored tile: black or white, whichever has the higher WCAG
 * contrast ratio. With pure black and white one of the two always reaches at
 * least 4.58:1 (the worst case is a color whose ratio is the same against both),
 * so a count on any color passes WCAG AA without an outline.
 * No imports beyond palette, so node scripts and tests can use it.
 */
import { hexToRgb } from './palette.ts';

const DARK_INK = '#000000';
const LIGHT_INK = '#ffffff';

/** WCAG relative luminance of an sRGB color, 0 (black) to 1 (white). */
function luminance(hex: string): number {
	const lin = (v: number) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
	const [r, g, b] = hexToRgb(hex);
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two colors, 1 to 21. */
export function contrast(a: string, b: string): number {
	const la = luminance(a);
	const lb = luminance(b);
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** The ink (black or white) that reads best on `hex`. */
export function inkOn(hex: string): string {
	return contrast(hex, DARK_INK) >= contrast(hex, LIGHT_INK) ? DARK_INK : LIGHT_INK;
}

/** `hex` mixed toward white by `t` (0 to 1), for a lighter hover shade. */
export function lighten(hex: string, t: number): string {
	const [r, g, b] = hexToRgb(hex);
	const mix = (v: number) =>
		Math.round(v + (255 - v) * t)
			.toString(16)
			.padStart(2, '0');
	return `#${mix(r)}${mix(g)}${mix(b)}`;
}
