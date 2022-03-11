import type { Plate } from '$lib/database/models';
import { getPlate, updatePlate, deletePlate } from '$lib/database/plates';

/** @type {import('./plates/[id]').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	const parsedParams = { ...params, id: parseInt(params.id) };
	const plate = await getPlate(parsedParams);

	return {
		status: 200,
		body: { plate }
	};
}

/** @type {import('./plates/[id]/index').RequestHandler} */
export async function put({ locals, request, params }) {
	if (locals.user?.isAdmin) {
		const formData = await request.formData();

		let data = {};
		formData.forEach((v, k) => {
			data[k] = v.valueOf();
		});

		let plate: Plate = {
			id: parseInt(params.id),
			jurisdiction: data['jurisdiction'],
			startYear: data['startYear'] != '' ? parseInt(data['startYear']) : null,
			endYear: data['endYear'] != '' ? parseInt(data['endYear']) : null
		};

		plate = await updatePlate(plate);

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
