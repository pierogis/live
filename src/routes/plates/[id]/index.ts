import type { Prisma } from '@prisma/client';
import { updatePlate, deletePlate, getFullPlate } from '$lib/database/plates';

/** @type {import('./plates/[id]').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	const parsedParams = { ...params, id: parseInt(params.id) };
	const plate = await getFullPlate(parsedParams);

	return {
		status: 200,
		body: { plate }
	};
}

/** @type {import('./plates/[id]/index').RequestHandler} */
export async function put({ locals, request, params }) {
	if (locals.user?.isAdmin) {
		const formData: FormData = await request.formData();

		const jurisdictionEntry = formData.get('jurisdiction');
		const startYearEntry = formData.get('startYear');
		const endYearEntry = formData.get('endYear');
		const imageUrlEntry = formData.get('image');

		const partial: Prisma.PlateUpdateInput = {
			jurisdiction: { connect: { abbreviation: jurisdictionEntry.toString() } },
			startYear: startYearEntry != '' ? parseInt(startYearEntry.toString()) : null,
			endYear: endYearEntry != '' ? parseInt(endYearEntry.toString()) : null,
			images: imageUrlEntry
				? {
						upsert: [
							{
								where: { url: imageUrlEntry.toString() },
								update: { url: imageUrlEntry.toString() },
								create: { url: imageUrlEntry.toString() }
							}
						]
				  }
				: undefined
		};

		const plate = await updatePlate(parseInt(params.id), partial);

		// redirect to the updated plate
		return {
			status: 303,
			headers: {
				location: `/plates/${plate.id}`
			}
		};
	} else {
		return {
			status: 403,
			body: { error: `not admin` }
		};
	}
}

/** @type {import('./plates/[id]/index').RequestHandler} */
export async function del({ locals, params }) {
	if (locals.user?.isAdmin) {
		await deletePlate(parseInt(params.id));

		return {
			status: 303,
			headers: {
				location: `/`
			}
		};
	} else {
		return {
			status: 403,
			body: { error: `not admin` }
		};
	}
}
