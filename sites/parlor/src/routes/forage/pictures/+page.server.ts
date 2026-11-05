import { cookieName, saveFromCookie } from '#lib/forage/save.js';
import type { PageServerLoad } from './$types';

// Rendered per request, so your ✓ marks come from your save right away.
export const prerender = false;

export const load: PageServerLoad = ({ cookies }) => {
	return {
		save: saveFromCookie(cookies.get(cookieName('forage'))),
		canonical: 'https://parlor.pierogis.live/forage/pictures',
		title: 'forage pictures · parlor',
		description: 'every forage picture'
	};
};
