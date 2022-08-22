import { error } from '@sveltejs/kit';

import { PUBLIC_API_BASE } from '$env/static/public';

import type { Action } from './$types';
export const POST: Action = async ({ locals, request, params }) => {
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

		const apiUrl = `${PUBLIC_API_BASE}/plates/${parseInt(params.id)}`;

		const response = await fetch(apiUrl, {
			method: 'put',
			headers: { 'content-type': 'application/json', cookie: request.headers.get('cookie') },
			body: JSON.stringify(data)
		});

		if (response.status == 200) {
			return {
				location: `/plates/${params.id}/edit`
			};
		} else {
			throw error(400, `edit failed`);
		}
	} else {
		throw error(403, `not admin`);
	}
};
