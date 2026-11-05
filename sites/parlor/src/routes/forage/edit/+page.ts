import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		canonical: 'https://parlor.pierogis.live/forage/edit',
		title: 'forage editor · parlor',
		description: 'paint pictures for forage, check them, and play-test them'
	};
};
