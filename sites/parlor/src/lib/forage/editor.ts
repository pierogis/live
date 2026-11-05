/* Forage in the shared picture editor. */
import { checkPicture } from '../shared/editor/checks';
import type { EditorGame } from '../shared/editor/types';
import { difficultyIndex, LABELS } from '../shared/difficulty';
import type { Level } from './engine';
import Forage from './Forage.svelte';
import { PACKS } from './levels/index';
import { reportForage } from './report';

/** Random games per check: few, so checking keeps up with painting. `forage:tune` measures properly. */
const ROLLOUTS = 4;

export const forageEditor: EditorGame<Level> = {
	id: 'forage',
	packs: PACKS,
	play: Forage,
	check(level, index) {
		const picture = checkPicture(level);
		if (picture.problems.length) {
			return { problems: picture.problems, warnings: picture.warnings, summary: '', stats: [] };
		}
		const r = reportForage(level, index, ROLLOUTS);
		const d = difficultyIndex(r.difficulty.careless);
		const pct = (x: number) => `${Math.round(100 * x)}%`;
		return {
			problems: r.problems,
			warnings: [
				...picture.warnings,
				...(level.seed !== undefined ? [] : ['not tuned yet: run pnpm -F parlor forage:tune'])
			],
			summary: 'Winnable: the built-in play clears it.',
			stats: [
				{ label: 'food', value: `${r.blocks} in ${r.colors} colors` },
				{ label: 'colonies', value: String(r.colonies) },
				{ label: 'linked pairs', value: String(r.links) },
				{ label: 'locks', value: String(r.locks) },
				{ label: 'mystery', value: String(r.mystery) },
				{
					label: 'careless wins',
					value: `about ${pct(r.difficulty.careless)} (${ROLLOUTS * 2} games)`
				},
				{ label: 'difficulty', value: d ? LABELS[d - 1].toLowerCase() : '—' }
			]
		};
	}
};
