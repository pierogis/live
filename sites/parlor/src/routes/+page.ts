import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		canonical: 'https://parlor.pierogis.live',
		title: 'parlor',
		description: 'a room for games'
	};
};
