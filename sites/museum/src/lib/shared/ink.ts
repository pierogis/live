import { hexToRgb } from './palette.ts';

const DARK_INK = '#000000';
const LIGHT_INK = '#ffffff';

function luminance(hex: string): number {
	const lin = (v: number) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
	const [r, g, b] = hexToRgb(hex);
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: string, b: string): number {
	const la = luminance(a);
	const lb = luminance(b);
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function inkOn(hex: string): string {
	return contrast(hex, DARK_INK) >= contrast(hex, LIGHT_INK) ? DARK_INK : LIGHT_INK;
}

export function lighten(hex: string, t: number): string {
	const [r, g, b] = hexToRgb(hex);
	const mix = (v: number) =>
		Math.round(v + (255 - v) * t)
			.toString(16)
			.padStart(2, '0');
	return `#${mix(r)}${mix(g)}${mix(b)}`;
}
