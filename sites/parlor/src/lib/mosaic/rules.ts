/*
 * Mosaic's checks for the picture editor and `pnpm -F parlor levels`. Pure, with `.ts`
 * imports, so the editor's check worker and node scripts can load it.
 */
import type { Rules } from '../shared/editor/types.ts';
import { BUILD_TRAY, type Level } from './engine.ts';
import { reportLevel } from './report.ts';

export const rules: Rules<Level> = {
	id: 'mosaic',
	check(level, index) {
		const r = reportLevel(level, index);
		return {
			problems: r.problems,
			warnings: r.warnings,
			summary: `Solvable with the ${BUILD_TRAY}-slot tray.`,
			stats: [
				{ label: 'dots', value: `${r.dots} in ${r.colors} colors` },
				{ label: 'solver', value: `${r.moves} moves, ${r.parks} to the tray` },
				{ label: 'tray used', value: `${r.minTray} / ${BUILD_TRAY}` },
				{ label: 'blobs', value: `${r.blobs} dots` },
				{ label: 'groups', value: `${r.groups}, biggest ${r.biggestGroup}` },
				{ label: 'on one color', value: `${r.cleanGroups} / ${r.groups} groups` },
				{ label: 'difficulty', value: String(r.score) }
			]
		};
	},
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
