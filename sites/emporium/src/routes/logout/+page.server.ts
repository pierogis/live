import { redirect } from '@sveltejs/kit';

import { expireSessionCookie } from '$lib/server/session';

import type { Actions } from './$types';

export const actions: Actions = {
	default: (event) => {
		expireSessionCookie(event.cookies);

		redirect(301, '/');
	}
};
