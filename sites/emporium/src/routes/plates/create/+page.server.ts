import { fail, redirect } from '@sveltejs/kit';

import { protectAdmin } from '$lib/helpers';
import { getJurisdictions } from '$lib/server/database/jurisdictions';

import { helpCreatePlate } from '$lib/server/database/plates';

import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async (event) => {
	const canonical = `https://emporium.pierogis.live/plates/create`;
	const title = `create plate`;
	const description = `register a plate for the emporium`;

	await protectAdmin(event.locals.sessionUser);

	const jurisdictions = await getJurisdictions({});

	return {
		canonical,
		title,
		description,
		jurisdictions
	};
};

export const actions = {
	default: async (event) => {
		if (event.locals.sessionUser?.isAdmin) {
			const formData: FormData = await event.request.formData();

			const jurisdictionEntry = formData.get('jurisdiction');
			const startYearEntry = formData.get('startYear');
			const endYearEntry = formData.get('endYear');
			const imageUrlEntry = formData.get('imageUrl');

			if (!jurisdictionEntry) {
				return fail(400, { message: `jurisdiction not provided` });
			}

			const jurisdictionId = parseInt(jurisdictionEntry.toString());
			const startYear = startYearEntry ? parseInt(startYearEntry.toString()) : undefined;
			const endYear = endYearEntry ? parseInt(endYearEntry.toString()) : undefined;
			const imageUrls = imageUrlEntry ? [imageUrlEntry.toString()] : [];

			const plate = await helpCreatePlate(jurisdictionId, startYear, endYear, imageUrls);

			if (plate === undefined) {
				return fail(403, { message: `couldn't create plate` });
			}

			redirect(303, `/plates/${plate.modelId}`);
		} else {
			return fail(403, { message: `not admin` });
		}
	}
};
