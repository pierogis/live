import { error, redirect } from '@sveltejs/kit';

import type { Actions } from './$types';

import { deletePlate, helpUpdatePlate } from '$lib/server/database/plates';

export const actions: Actions = {
	update: async ({ locals, request, params }) => {
		if (locals.sessionUser?.isAdmin) {
			const formData: FormData = await request.formData();

			const jurisdictionEntry = formData.get('jurisdiction');
			const startYearEntry = formData.get('startYear');
			const endYearEntry = formData.get('endYear');
			const imageUrlEntry = formData.get('imageUrl');

			const jurisdiction = { abbreviation: jurisdictionEntry.toString() };
			const startYear = startYearEntry != '' ? parseInt(startYearEntry.toString()) : null;
			const endYear = endYearEntry != '' ? parseInt(endYearEntry.toString()) : null;
			const imageUrls = imageUrlEntry != '' ? [imageUrlEntry.toString()] : [];

			await helpUpdatePlate(parseInt(params.id), jurisdiction, startYear, endYear, imageUrls);

			throw redirect(303, `/plates/${params.id}/edit`);
		} else {
			return error(403, { message: `not admin` });
		}
	},
	delete: async ({ locals, params }) => {
		if (locals.sessionUser?.isAdmin) {
			const modelId = parseInt(params.id);
			await deletePlate(modelId);

			throw redirect(303, `/plates`);
		} else {
			throw error(403, 'not admin');
		}
	}
};
