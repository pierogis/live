export const MIN_DELTA = 28;

export type Lab = [number, number, number];

export function hexToRgb(hex: string): [number, number, number] {
	let h = hex.replace('#', '');
	if (h.length === 3) h = [...h].map((ch) => ch + ch).join('');
	const n = parseInt(h, 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToLab(r: number, g: number, b: number): Lab {
	const lin = (v: number) =>
		(v /= 255) <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	const lr = lin(r);
	const lg = lin(g);
	const lb = lin(b);
	const x = (0.4124 * lr + 0.3576 * lg + 0.1805 * lb) / 0.95047;
	const y = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
	const z = (0.0193 * lr + 0.1192 * lg + 0.9505 * lb) / 1.08883;
	const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
	return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

export function lab(hex: string): Lab {
	return rgbToLab(...hexToRgb(hex));
}

export function deltaE(a: Lab, b: Lab): number {
	return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export interface ClosePair {
	a: string;
	b: string;
	delta: number;
}

export function closePairs(
	palette: Record<string, string>,
	used?: Iterable<string>,
	min = MIN_DELTA
): ClosePair[] {
	const only = used ? new Set(used) : null;
	const keys = Object.keys(palette).filter((k) => !only || only.has(k));
	const out: ClosePair[] = [];
	for (let i = 0; i < keys.length; i++) {
		for (let j = i + 1; j < keys.length; j++) {
			const delta = deltaE(lab(palette[keys[i]]), lab(palette[keys[j]]));
			if (delta < min) out.push({ a: keys[i], b: keys[j], delta });
		}
	}
	return out.sort((x, y) => x.delta - y.delta);
}
