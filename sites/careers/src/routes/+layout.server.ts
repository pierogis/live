import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const canonical = 'https://careers.pierogis.live';
	const title = 'careers';
	const description = 'a good place to start working with pierogis';

	return { canonical, title, description };
};
