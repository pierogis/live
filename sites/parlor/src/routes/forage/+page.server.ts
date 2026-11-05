import { redirect } from '@sveltejs/kit';

import { cookieName, saveFromCookie } from '#lib/forage/save.js';
import type { PageServerLoad } from './$types';

// Rendered per request: it reads your save to send you straight to your level.
export const prerender = false;

export const load: PageServerLoad = ({ cookies }) => {
	const save = saveFromCookie(cookies.get(cookieName('forage')));
	if (save.level > 0) redirect(307, `/forage/${save.level + 1}`);
	return {
		canonical: 'https://parlor.pierogis.live/forage',
		title: 'forage · parlor',
		description: DESCRIPTION
	};
};

const DESCRIPTION =
	'send ant colonies to eat a pixel picture away, color by color, from the outside in';
