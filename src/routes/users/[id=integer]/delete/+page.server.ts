import { error, invalid, redirect } from '@sveltejs/kit';

import { PUBLIC_API_BASE } from '$env/static/public';

import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ locals, params, request }) => {
		if (!locals.user) {
			return invalid(401, { message: `not signed in` });
		}
		if (locals.user?.id == parseInt(params.id) || locals.user?.isAdmin) {
			const apiUrl = `${PUBLIC_API_BASE}/users/${params.id}`;
			const response = await fetch(apiUrl, {
				method: 'delete',
				headers: { 'content-type': 'application/json', cookie: request.headers.get('cookie') }
			});

			if (response.status == 200) {
				throw redirect(300, '/');
			} else {
				const err = await response.json();

				throw error(400, err);
			}
		} else {
			return invalid(403, { message: `not user ${params.id} or admin` });
		}
	}
};
