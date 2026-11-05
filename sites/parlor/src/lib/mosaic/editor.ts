/* Mosaic in the shared picture editor. */
import type { EditorGame } from '../shared/editor/types';
import Mosaic from './Mosaic.svelte';
import type { Level } from './engine';
import { PACKS } from './levels/index';
import { reportLevel } from './report';

export const mosaicEditor: EditorGame<Level> = {
	id: 'mosaic',
	packs: PACKS,
	play: Mosaic,
	check(level, index) {
		const r = reportLevel(level, index);
		return {
			problems: r.problems,
			warnings: r.warnings,
			summary: 'Solvable with the 20-slot tray.',
			stats: [
				{ label: 'dots', value: `${r.dots} in ${r.colors} colors` },
				{ label: 'solver', value: `${r.moves} moves, ${r.parks} to the tray` },
				{ label: 'tray used', value: `${r.minTray} / 20` },
				{ label: 'groups', value: `${r.groups}, biggest ${r.biggestGroup}` },
				{ label: 'on one color', value: `${r.cleanGroups} / ${r.groups} groups` },
				{ label: 'difficulty', value: String(r.score) }
			]
		};
	}
};
