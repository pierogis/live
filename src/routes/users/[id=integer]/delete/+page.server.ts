import { error } from '@sveltejs/kit';

import { PUBLIC_API_BASE } from '$env/static/public';

import type { Action } from './$types';
export const POST: Action = async ({ locals, request, params }) => {
	if (!locals.user) {
		throw error(401, `not signed in`);
	}
	if (locals.user?.id == parseInt(params.id) || locals.user?.isAdmin) {
		const apiUrl = `${PUBLIC_API_BASE}/users/${params.id}`;
		const response = await fetch(apiUrl, {
			method: 'delete',
			headers: { 'content-type': 'application/json', cookie: request.headers.get('cookie') }
		});

		if (response.status == 200) {
			return {
				location: `/`
			};
		} else {
			const error = await response.json();

			throw error(400, error);
		}
	} else {
		throw error(403, `not user ${params.id} or admin`);
	}
};
