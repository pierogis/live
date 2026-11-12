import type { Picture } from '../../src/lib/shared/level.ts';
import type { SongSettings } from '../../src/lib/shared/sound.ts';
import { Canvas } from './canvas.ts';

export type Panel = [slug: string, name: string, song: SongSettings, difficulty?: number];

export interface Mural {
	file: string;
	name: string;
	prefix: string;
	notes: string;
	cols: number;
	difficulty?: number;
	panel?: [w: number, h: number];
	palette: Record<string, string>;
	ground: string;
	panels: Panel[];
	draw(c: Canvas): void;
}

export function layout(m: Mural) {
	const [pw, ph] = m.panel ?? [24, 22];
	const rows = m.panels.length / m.cols;
	if (!Number.isInteger(rows)) {
		throw new Error(`${m.file}: ${m.panels.length} panels don't fill rows of ${m.cols}`);
	}
	return { pw, ph, rows };
}

export function paint(m: Mural): string[] {
	const { pw, ph, rows } = layout(m);
	const c = new Canvas(m.cols * pw, rows * ph, m.ground);
	m.draw(c);
	return c.rows();
}

export function pack(m: Mural, picture = paint(m)) {
	const { pw, ph } = layout(m);
	const levels: Picture[] = m.panels.map(([slug, name, song, difficulty], k) => {
		const px = (k % m.cols) * pw;
		const py = Math.floor(k / m.cols) * ph;
		const art = picture.slice(py, py + ph).map((row) => row.slice(px, px + pw));
		const used = new Set(art.join(''));
		const palette = Object.fromEntries(Object.entries(m.palette).filter(([ch]) => used.has(ch)));
		return {
			id: `${m.prefix}-${slug}`,
			name,
			song,
			...(difficulty !== undefined && { difficulty }),
			palette,
			art
		};
	});
	return {
		name: m.name,
		mural: { cols: m.cols },
		...(m.difficulty !== undefined && { difficulty: m.difficulty }),
		song: { notes: m.notes, theme: m.prefix },
		levels
	};
}
