import type { PageLoad } from './$types';
export const load: PageLoad = async () => {
	const taglines = [
		'live pierogis multimedia experiences',
		'data driven restaurant',
		'not dead yet !',
		'virtual food truck'
	];
	const tagline = taglines[Math.floor(Math.random() * taglines.length)];

	return {
		tagline
	};
};
