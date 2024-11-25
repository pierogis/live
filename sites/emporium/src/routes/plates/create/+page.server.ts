import { fail, redirect } from '@sveltejs/kit';

import { protectAdmin } from '$lib/helpers';

import { helpCreatePlate, getJurisdictions } from '$queries';

import type { PageServerLoad } from './$types.js';
import { plates } from '$db';

export const load: PageServerLoad = async ({ locals }) => {
	const canonical = `https://emporium.pierogis.live/plates/create`;
	const title = `create plate`;
	const description = `register a plate for the emporium`;

	await protectAdmin(locals.sessionUser);

	const jurisdictions = await getJurisdictions(locals.db, {});

	return {
		canonical,
		title,
		description,
		jurisdictions
	};
};

export const actions = {
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

			const jurisdictionId = parseInt(jurisdictionEntry.toString());
			const startYear = startYearEntry ? parseInt(startYearEntry.toString()) : undefined;
			const endYear = endYearEntry ? parseInt(endYearEntry.toString()) : undefined;
			const imageUrls = imageUrlEntry ? [imageUrlEntry.toString()] : [];

			const plate = (
				await helpCreatePlate(locals.db, jurisdictionId, startYear, endYear, imageUrls)
			)[0];
			if (plate === undefined) {
				return fail(403, { message: `couldn't create plate` });
			}

			redirect(303, `/plates/${plate.modelId}`);
		} else {
			return fail(403, { message: `not admin` });
		}
	}
};
