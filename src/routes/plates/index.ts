import type { Plate } from '@prisma/client';
import { getFullPlates, createPlate } from '$lib/database/plates';
import { createImage } from '$lib/database/images';
import { getJurisdiction } from '$lib/database/jurisdictions';

/** @type {import('./plates/index').RequestHandler} */
export async function get() {
	const plates = await getFullPlates();

	return {
		status: 200,
		body: { plates }
	};
}

/** @type {import('./plates/index').RequestHandler} */
export async function post({ locals, request }) {
	if (locals.user?.isAdmin) {
		const formData: FormData = await request.formData();

		const jurisdictionEntry = formData.get('jurisdiction');
		const startYearEntry = formData.get('startYear');
		const endYearEntry = formData.get('endYear');

		const partial: Omit<Plate, 'id'> = {
			jurisdictionId: (await getJurisdiction({ abbreviation: jurisdictionEntry.toString() })).id,
			startYear: startYearEntry ? parseInt(startYearEntry.toString()) : null,
			endYear: endYearEntry ? parseInt(endYearEntry.toString()) : null
		};

		const plate = await createPlate(partial);

		const imageUrlEntry = formData.get('imageUrl');
		if (imageUrlEntry) {
			const image = await createImage({ plateId: plate.id, url: imageUrlEntry.toString() });
		}

		// redirect to the newly created plate
		return {
			status: 303,
			headers: {
				location: `/plates/${plate.id}/edit`
			}
		};
	} else {
		return {
			status: 403,
			body: { error: `not admin` }
		};
	}
}
