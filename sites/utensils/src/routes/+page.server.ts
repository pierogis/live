import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const canonical = 'https://utensils.pierogis.live';
	const title = 'utensils';
	const description = 'a demonstration of table manners';

	return { canonical, title, description };
};
