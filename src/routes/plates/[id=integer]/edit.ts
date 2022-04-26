// plates/[id=integer]/edit.ts

import { variables } from '$lib/env';

/** @type {import('./plates/[id=integer]/edit').RequestHandler} */
export async function post({ locals, request, params }) {
	if (locals.user?.isAdmin) {
		const formData: FormData = await request.formData();

		const jurisdictionEntry = formData.get('jurisdiction');
		const startYearEntry = formData.get('startYear');
		const endYearEntry = formData.get('endYear');
		const imageUrlEntry = formData.get('imageUrl');

		const data = {
			jurisdiction: { abbreviation: jurisdictionEntry.toString() },
			startYear: startYearEntry != '' ? parseInt(startYearEntry.toString()) : null,
			endYear: endYearEntry != '' ? parseInt(endYearEntry.toString()) : null,
			imageUrls: imageUrlEntry != '' ? [imageUrlEntry.toString()] : []
		};

		const apiUrl = `${variables.apiBase}/plates/${parseInt(params.id)}`;

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
				location: `/plates/${params.id}/edit`
			}
		};
	} else {
		return {
			status: 403,
			body: { error: `not admin` }
		};
	}
}
