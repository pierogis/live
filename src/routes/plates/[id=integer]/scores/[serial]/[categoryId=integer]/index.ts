// plates/[id=integer]/scores/[serial]/[category=integer]/index.ts

import { variables } from '$lib/env';
import { valueEntryName } from '../_form';

/** @type {import('./plates/[id=integer]/scores/[serial]/[category=integer]/index').RequestHandler} */
export async function post({ locals, request, params }) {
	if (locals.user?.isAdmin) {
		const formData: FormData = await request.formData();

		const valueEntry = formData.get(valueEntryName);

		const data = {
			value: parseInt(valueEntry.toString())
		};

		const apiUrl = `${variables.apiBase}/plates/${params.id}/scores/${params.categoryId}`;

		console.log(apiUrl);

		const response = await fetch(apiUrl, {
			method: 'put',
			headers: { 'content-type': 'application/json', cookie: request.headers.get('cookie') },
			body: JSON.stringify(data)
		});

		await response.json();

		// redirect to the updated plate
		return {
			status: 303,
			headers: {
				location: `/plates/${params.id}/scores/${params.userId}`
			}
		};
	} else {
		return {
			status: 403,
			body: { error: `not admin` }
		};
	}
}
