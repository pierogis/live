import type { PageLoad } from './$types';

export const load: PageLoad = ({ data }) => {
	return {
		...data,
		title: 'museum',
		description: 'a quiet room with pictures'
	};
};
