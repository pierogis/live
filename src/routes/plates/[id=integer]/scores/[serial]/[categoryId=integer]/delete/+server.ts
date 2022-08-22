import { json } from '@sveltejs/kit';

import { PUBLIC_API_BASE } from '$env/static/public';

import type { RequestHandler } from './$types';
export const POST: RequestHandler = async ({ locals, request, params }) => {
	if (locals.user?.serial == params.serial) {
		const apiUrl = `${PUBLIC_API_BASE}/plates/${params.id}/scores/${params.categoryId}`;

		await fetch(apiUrl, {
			method: 'delete',
			headers: { 'content-type': 'application/json', cookie: request.headers.get('cookie') }
		});

		return new Response(undefined, {
			status: 303,
			headers: {
				location: `/plates/${params.id}/scores/${params.serial}`
			}
		});
	} else {
		return json(
			{ error: `not user` },
			{
				status: 403
			}
		);
	}
};
