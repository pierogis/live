import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const canonical = 'https://colors.pierogis.live';
	const title = 'colors';
	const description = 'a way to develop your palette';

	return { canonical, title, description };
};
