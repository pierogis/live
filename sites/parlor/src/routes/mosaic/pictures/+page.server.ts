import { cookieName, saveFromCookie } from '#lib/mosaic/save.js';
import type { PageServerLoad } from './$types';

// Rendered per request, so your ✓ marks come from your save right away.
export const prerender = false;

export const load: PageServerLoad = ({ cookies }) => {
	return {
		save: saveFromCookie(cookies.get(cookieName('mosaic'))),
		canonical: 'https://parlor.pierogis.live/mosaic/pictures',
		title: 'mosaic pictures · parlor',
		description: 'every mosaic picture'
	};
};
