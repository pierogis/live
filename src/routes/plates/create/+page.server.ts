import { fail, redirect } from '@sveltejs/kit';

import type { Plate } from '@prisma/client';

import { protect } from '$lib/helpers';
import { getJurisdictions } from '$lib/server/database/jurisdictions';

import type { Actions, PageServerLoad } from './$types';
import { helpCreatePlate } from '$lib/server/database/plates';

export const load: PageServerLoad = async ({ parent }) => {
	async function handle() {
		const jurisdictions = await getJurisdictions({});

		return {
			jurisdictions
		};
	}

	const { sessionUser } = await parent();

	return protect(sessionUser, handle);
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (locals.sessionUser?.isAdmin) {
			const formData: FormData = await request.formData();

			const jurisdictionEntry = formData.get('jurisdiction');
			const startYearEntry = formData.get('startYear');
			const endYearEntry = formData.get('endYear');
			const imageUrlEntry = formData.get('imageUrl');

			if (!jurisdictionEntry) {
				return fail(400, { message: `jurisdiction not provided` });
			}

			const jurisdiction = { abbreviation: jurisdictionEntry.toString() };
			const startYear = startYearEntry ? parseInt(startYearEntry.toString()) : undefined;
			const endYear = endYearEntry ? parseInt(endYearEntry.toString()) : undefined;
			const imageUrls = imageUrlEntry ? [imageUrlEntry.toString()] : [];

			const plate: Plate = await helpCreatePlate(jurisdiction, startYear, endYear, imageUrls);

			throw redirect(303, `/plates/${plate.modelId}`);
		} else {
			return fail(403, { message: `not admin` });
		}
	}
};
