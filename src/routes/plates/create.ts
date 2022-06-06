import { variables } from '$lib/env';
import type { Plate } from '@prisma/client';

import type { RequestHandler } from './__types/create';
export const post: RequestHandler = async ({ locals, request }) => {
	if (locals.user?.isAdmin) {
		const formData: FormData = await request.formData();

		const jurisdictionEntry = formData.get('jurisdiction');
		const startYearEntry = formData.get('startYear');
		const endYearEntry = formData.get('endYear');
		const imageUrlEntry = formData.get('imageUrl');

		if (!jurisdictionEntry) {
			return {
				status: 400,
				body: { error: `jurisdiction not provided` }
			};
		}

		const data = {
			jurisdiction: { abbreviation: jurisdictionEntry.toString() },
			startYear: startYearEntry ? parseInt(startYearEntry.toString()) : null,
			endYear: endYearEntry ? parseInt(endYearEntry.toString()) : null,
			imageUrls: imageUrlEntry ? [imageUrlEntry.toString()] : []
		};

		const apiUrl = variables.apiBase + '/plates';

		const response = await fetch(apiUrl, {
			method: 'post',
			headers: { 'content-type': 'application/json', cookie: request.headers.get('cookie') },
			body: JSON.stringify(data)
		});

		if (response.status == 200) {
			const plate: Plate = await response.json();

			// redirect to the newly created plate
			return {
				status: 303,
				headers: {
					location: `/plates/${plate.modelId}`
				}
			};
		} else {
			return {
				status: 500
			};
		}
	} else {
		return {
			status: 403,
			body: { error: `not admin` }
		};
	}
};
