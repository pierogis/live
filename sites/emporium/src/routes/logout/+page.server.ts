import { redirect } from '@sveltejs/kit';

import { expireSessionCookie } from '$lib/server/session';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const canonical = `https://emporium.pierogis.live/logout`;
	const title = `logout`;
	const description = `exit the emporium`;

	return {
		canonical,
		title,
		description
	};
};

export const actions: Actions = {
	default: (event) => {
		expireSessionCookie(event.cookies);

		redirect(301, '/');
	}
};
