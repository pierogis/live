import type { SongSettings } from './sound.ts';

export interface Picture {
	id: string;
	name: string;
	palette: Record<string, string>;
	art: string[];
	song?: SongSettings;
	difficulty?: number;
}

export type Listed<L extends Picture = Picture> = Omit<L, 'palette' | 'art'> & {
	panel?: { mural: string; n: number; of: number };
};

export interface Pack<L extends Picture = Picture> {
	id: string;
	name: string;
	mural?: { cols: number };
	song?: SongSettings;
	difficulty?: number;
	levels: L[];
}
