/* A mural: one big picture, drawn with code, whose panels are the levels of a game's pack. */
import type { Picture } from '../../src/lib/shared/level.ts';
import type { SongSettings } from '../../src/lib/shared/sound.ts';
import { Canvas } from './canvas.ts';

/** A panel: its id's end, its name, its song, and its own difficulty when not the mural's. */
export type Panel = [slug: string, name: string, song: SongSettings, difficulty?: number];

export interface Mural {
	/** The pack file's name, without `.json` or the number that sets its place (`fileOf`). */
	file: string;
	name: string;
	/** Starts every panel's id, and is the theme its songs share. */
	prefix: string;
	/** The key whose notes every panel's song keeps to. */
	notes: string;
	/** Panels to a row; the panel count sets how many rows. */
	cols: number;
	/**
	 * How hard its panels are made, 0 to 1 (Mosaic: see `Pack.difficulty`), unless a panel
	 * sets its own.
	 */
	difficulty?: number;
	/** A panel's size in dots; 24 by 22 unless given. */
	panel?: [w: number, h: number];
	palette: Record<string, string>;
	/** The letter the canvas starts filled with. */
	ground: string;
	panels: Panel[];
	draw(c: Canvas): void;
}

/** A panel's size in dots, and how many rows of panels the mural has. */
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
