import type { Prisma } from '@prisma/client';
import { getFullPlates, createPlate } from '$lib/database/plates';

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
		const imageUrlEntry = formData.get('imageUrl');

		if (!jurisdictionEntry) {
			return {
				status: 400,
				body: { error: `jurisdiction not provided` }
			};
		}

		const partial: Prisma.PlateCreateInput = {
			jurisdiction: { connect: { abbreviation: jurisdictionEntry.toString() } },
			startYear: startYearEntry ? parseInt(startYearEntry.toString()) : null,
			endYear: endYearEntry ? parseInt(endYearEntry.toString()) : null,
			images: imageUrlEntry
				? {
						create: [{ url: imageUrlEntry.toString() }]
				  }
				: undefined
		};

		const plate = await createPlate(partial);

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
