import type { GameId } from '../games.ts';
import type { Picture } from './level.ts';

export interface Row {
	problems: string[];
	warnings: string[];
	cols: Record<string, string | number>;
	score?: number;
}

export interface Rules<L extends Picture = Picture> {
	id: GameId;
	row: (level: L, measure: boolean) => Row;
}
