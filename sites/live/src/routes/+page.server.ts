import type { PageServerLoad } from './$types';

const TAGLINES = [
	'live pierogis multimedia experiences',
	'data driven restaurant',
	'not dead yet !',
	'virtual food truck'
];

export const load: PageServerLoad = () => ({
	title: 'pierogis live',
	description: 'a basecamp for pierogis',
	tagline: TAGLINES[Math.floor(Math.random() * TAGLINES.length)]
});
