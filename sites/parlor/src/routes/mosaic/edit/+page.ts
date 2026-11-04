import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		canonical: 'https://parlor.pierogis.live/mosaic/edit',
		title: 'mosaic editor · parlor',
		description: 'paint pictures for mosaic, check them, and play-test them'
	};
};
