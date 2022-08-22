import { json } from '@sveltejs/kit';

import { PUBLIC_API_BASE } from '$env/static/public';
import { valueEntryName } from '../_form';

import type { RequestHandler } from './$types';
export const POST: RequestHandler = async ({ locals, request, params }) => {
	if (locals.user?.isAdmin) {
		const formData: FormData = await request.formData();

		const valueEntry = formData.get(valueEntryName);

		const data = {
			value: parseInt(valueEntry.toString())
		};

		const apiUrl = `${PUBLIC_API_BASE}/plates/${params.id}/scores/${params.categoryId}`;

		const response = await fetch(apiUrl, {
			method: 'put',
			headers: { 'content-type': 'application/json', cookie: request.headers.get('cookie') },
			body: JSON.stringify(data)
		});

		await response.json();

		return new Response(undefined, {
			status: 303,
			headers: {
				location: `/plates/${params.id}/scores/${params.serial}`
			}
		});
	} else {
		return json(
			{ error: `not admin` },
			{
				status: 403
			}
		);
	}
};
