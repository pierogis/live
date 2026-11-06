import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		title: 'parlor',
		description: 'a room for games'
	};
};
