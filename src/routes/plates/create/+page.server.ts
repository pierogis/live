import { error } from '@sveltejs/kit';

import { PUBLIC_API_BASE } from '$env/static/public';
import type { Plate } from '@prisma/client';

import type { Action } from './$types';
export const POST: Action = async ({ locals, request }) => {
	if (locals.user?.isAdmin) {
		const formData: FormData = await request.formData();

		const jurisdictionEntry = formData.get('jurisdiction');
		const startYearEntry = formData.get('startYear');
		const endYearEntry = formData.get('endYear');
		const imageUrlEntry = formData.get('imageUrl');

		if (!jurisdictionEntry) {
			throw error(400, `jurisdiction not provided`);
		}

		const data = {
			jurisdiction: { abbreviation: jurisdictionEntry.toString() },
			startYear: startYearEntry ? parseInt(startYearEntry.toString()) : null,
			endYear: endYearEntry ? parseInt(endYearEntry.toString()) : null,
			imageUrls: imageUrlEntry ? [imageUrlEntry.toString()] : []
		};

		const apiUrl = PUBLIC_API_BASE + '/plates';

		const response = await fetch(apiUrl, {
			method: 'post',
			headers: { 'content-type': 'application/json', cookie: request.headers.get('cookie') },
			body: JSON.stringify(data)
		});

		if (response.status == 200) {
			const plate: Plate = await response.json();

			return {
				location: `/plates/${plate.modelId}`
			};
		} else {
			throw error(500);
		}
	} else {
		throw error(403, `not admin`);
	}
};
