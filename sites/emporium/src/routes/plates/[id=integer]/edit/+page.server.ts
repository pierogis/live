import { fail, redirect } from '@sveltejs/kit';

import { deletePlate, helpUpdatePlate } from '$lib/server/database/plates';
import { getJurisdictions } from '$lib/server/database/jurisdictions';
import { protectAdmin } from '$lib/helpers';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { plate } = await event.parent();
	const canonical = `https://emporium.pierogis.live/plates/${event.params.id}/edit`;
	const title = `edit ${plate.jurisdiction.name} plate (${plate.startYear || '?'}-${
		plate.endYear || '?'
	})`;
	const description = title;

	const jurisdictions = await getJurisdictions({});

	await protectAdmin(event.locals.sessionUser);

	return {
		canonical,
		title,
		description,
		jurisdictions
	};
};

export const actions: Actions = {
	update: async ({ locals, request, params }) => {
		if (locals.sessionUser?.isAdmin) {
			const formData: FormData = await request.formData();

			const jurisdictionEntry = formData.get('jurisdiction')!!;
			const startYearEntry = formData.get('startYear')!!;
			const endYearEntry = formData.get('endYear')!!;
			const imageUrlEntry = formData.get('imageUrl')!!;

			const jurisdictionId = parseInt(jurisdictionEntry.toString());
			const startYear = startYearEntry != '' ? parseInt(startYearEntry.toString()) : null;
			const endYear = endYearEntry != '' ? parseInt(endYearEntry.toString()) : null;
			const imageUrls = imageUrlEntry != '' ? [imageUrlEntry.toString()] : [];

			await helpUpdatePlate(parseInt(params.id), jurisdictionId, startYear, endYear, imageUrls);

			redirect(303, `/plates/${params.id}/edit`);
		} else {
			return fail(403, { message: `not admin` });
		}
	},
	delete: async ({ locals, params }) => {
		if (locals.sessionUser?.isAdmin) {
			const modelId = parseInt(params.id);
			await deletePlate(modelId);

			redirect(303, `/plates`);
		} else {
			return fail(403, { message: 'not admin' });
		}
	}
};
