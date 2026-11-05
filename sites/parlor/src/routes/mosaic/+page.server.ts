import { redirect } from '@sveltejs/kit';

import { cookieName, saveFromCookie } from '#lib/mosaic/save.js';
import type { PageServerLoad } from './$types';

// Rendered per request: it reads your save to send you straight to your level.
export const prerender = false;

export const load: PageServerLoad = ({ cookies }) => {
	const save = saveFromCookie(cookies.get(cookieName('mosaic')));
	if (save.level > 0) redirect(307, `/mosaic/${save.level + 1}`);
	return {
		canonical: 'https://parlor.pierogis.live/mosaic',
		title: 'mosaic · parlor',
		description: DESCRIPTION
	};
};

const DESCRIPTION = 'lift dots off a picture, sort them by color, and fill it back in';
