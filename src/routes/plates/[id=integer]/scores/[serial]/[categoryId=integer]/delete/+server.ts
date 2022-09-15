import { redirect, error } from '@sveltejs/kit';

import { PUBLIC_API_BASE } from '$env/static/public';

import type { RequestHandler } from './$types';
export const POST: RequestHandler = async ({ locals, request, params }) => {
	if (locals.user?.serial == params.serial) {
		const apiUrl = `${PUBLIC_API_BASE}/plates/${params.id}/scores/${params.categoryId}`;

		await fetch(apiUrl, {
			method: 'delete',
			headers: { 'content-type': 'application/json', cookie: request.headers.get('cookie') }
		});

		throw redirect(303, `/plates/${params.id}/scores/${params.serial}`);
	} else {
		throw error(403, 'not user');
	}
};
