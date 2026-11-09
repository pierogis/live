import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = () => ({
	title: 'other | pierogis live',
	description: 'the rest of pierogis'
});
