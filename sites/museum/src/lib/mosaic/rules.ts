/* Mosaic's line per level in `pnpm -F museum levels`. Pure, with `.ts` imports, for node. */
import type { Rules } from '../shared/rules.ts';
import type { Level } from './engine.ts';
import { reportLevel } from './report.ts';

export const rules: Rules<Level> = {
	id: 'mosaic',
	row(level, index) {
		const r = reportLevel(level, index);
		return {
			problems: r.problems,
			warnings: r.warnings,
			score: r.score,
			cols: {
				size: `${r.w}x${r.h}`,
				dots: r.dots,
				colors: r.colors,
				moves: r.moves,
				parks: r.parks,
				minTray: r.minTray,
				blobs: r.blobs,
				shuffle: r.shuffle,
				biggestGroup: r.biggestGroup,
				clean: `${r.cleanGroups}/${r.groups}`,
				score: r.score,
				ms: Math.round(r.ms)
			}
		};
	}
};
