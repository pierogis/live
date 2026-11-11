import type { PageLoad } from './$types';

export const load: PageLoad = ({ data }) => {
	return {
		...data,
		title: 'museum',
		description: 'in which you can appreciate art'
	};
};
