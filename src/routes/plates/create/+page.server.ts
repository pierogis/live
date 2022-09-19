import { error, invalid, redirect } from '@sveltejs/kit';

import type { Plate } from '@prisma/client';

import { protect } from '$lib/helpers';
import { getJurisdictions } from '$lib/server/database/jurisdictions';

import { PUBLIC_API_BASE } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	async function handle() {
		const jurisdictions = await getJurisdictions({});

		return {
			jurisdictions
		};
	}

	const { user } = await parent();

	return protect(user, handle);
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (locals.user?.isAdmin) {
			const formData: FormData = await request.formData();

			const jurisdictionEntry = formData.get('jurisdiction');
			const startYearEntry = formData.get('startYear');
			const endYearEntry = formData.get('endYear');
			const imageUrlEntry = formData.get('imageUrl');

			if (!jurisdictionEntry) {
				return invalid(400, { message: `jurisdiction not provided` });
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

				throw redirect(300, `/plates/${plate.modelId}`);
			} else {
				throw error(500);
			}
		} else {
			return invalid(403, { message: `not admin` });
		}
	}
};
