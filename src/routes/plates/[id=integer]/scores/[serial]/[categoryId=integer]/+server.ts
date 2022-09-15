import { error, redirect } from '@sveltejs/kit';

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

		throw redirect(303, `/plates/${params.id}/scores/${params.serial}`);
	} else {
		throw error(403, 'not admin');
	}
};
