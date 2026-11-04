import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		canonical: 'https://parlor.pierogis.live/mosaic',
		title: 'mosaic · parlor',
		description: 'a calm color-sorting pixel art puzzle. no ads, no timers, no lives.'
	};
};
