/*
 * A mural: one big picture, drawn with code, that becomes a Mosaic pack. Each of its
 * panels is a level. A mural file in this folder exports one `Mural`; index.ts lists
 * them, and `pnpm -F parlor murals` draws them into the pack files.
 */
import type { Level } from '../../src/lib/mosaic/engine.ts';
import type { SongSettings } from '../../src/lib/shared/sound.ts';
import { Canvas } from './canvas.ts';

/** A panel in reading order: the end of its id, its name, and its song. */
export type Panel = [slug: string, name: string, song: SongSettings];

export interface Mural {
	/** The pack file, without `.json`. Packs play in file name order, easiest mural first. */
	file: string;
	name: string;
	/** Starts every panel's id, and names the theme its songs share. */
	prefix: string;
	/** The key whose notes every panel's song keeps to. */
	notes: string;
	cols: number;
	rows: number;
	/** A panel's size in dots; 24 by 22 unless given. Easier murals use smaller panels. */
	panel?: [w: number, h: number];
	/** Each letter's color. A panel's own palette lists the ones it uses, in this order. */
	palette: Record<string, string>;
	/** The letter the canvas starts filled with. */
	ground: string;
	panels: Panel[];
	draw(c: Canvas): void;
}

export const PANEL: [number, number] = [24, 22];

/** The whole picture as rows of letters. */
export function paint(m: Mural): string[] {
	const [pw, ph] = m.panel ?? PANEL;
	const c = new Canvas(m.cols * pw, m.rows * ph, m.ground);
	m.draw(c);
	return c.rows();
}

/** The pack file's contents. */
export function pack(m: Mural, picture = paint(m)) {
	const [pw, ph] = m.panel ?? PANEL;
	if (m.panels.length !== m.cols * m.rows) {
		throw new Error(`${m.file}: ${m.panels.length} panels named, ${m.cols * m.rows} drawn`);
	}
	const levels: Level[] = m.panels.map(([slug, name, song], k) => {
		const px = (k % m.cols) * pw;
		const py = Math.floor(k / m.cols) * ph;
		const art = picture.slice(py, py + ph).map((row) => row.slice(px, px + pw));
		const used = new Set(art.join(''));
		const palette = Object.fromEntries(Object.entries(m.palette).filter(([ch]) => used.has(ch)));
		return { id: `${m.prefix}-${slug}`, name, song, palette, art };
	});
	return {
		name: m.name,
		mural: { cols: m.cols },
		song: { notes: m.notes, theme: m.prefix },
		levels
	};
}
