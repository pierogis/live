import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const canonical = 'https://colors.pierogis.live';
	const title = 'colors';
	const description = 'a way to develop your palette';

	return { canonical, title, description };
};
