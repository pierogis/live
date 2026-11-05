import { error } from '@sveltejs/kit';

import { LEVELS } from '#lib/mosaic/levels/index.js';
import type { EntryGenerator, PageLoad } from './$types';

/** Every level gets its own prerendered page, with its board already drawn. */
export const entries: EntryGenerator = () => LEVELS.map((_, i) => ({ n: String(i + 1) }));

export const load: PageLoad = ({ params }) => {
	const index = Number(params.n) - 1;
	const level = LEVELS[index];
	if (!level) error(404, 'No such level');
	return {
		index,
		canonical: `https://parlor.pierogis.live/mosaic/${index + 1}`,
		title: `${level.name} · mosaic · parlor`,
		description: `mosaic level ${index + 1}: ${level.name}`
	};
};
