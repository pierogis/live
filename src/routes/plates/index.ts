import type { Plate } from '$lib/database/models';
import { listPlates, createPlate } from '$lib/database/plates';

/** @type {import('./plates/index').RequestHandler} */
export async function get() {
	const plates = await listPlates();

	return {
		status: 200,
		body: { plates }
	};
}

/** @type {import('./plates/index').RequestHandler} */
export async function post({ locals, request }) {
	if (locals.user?.isAdmin) {
		const formData = await request.formData();

		let data = {};
		formData.forEach((v, k) => {
			data[k] = v.valueOf();
		});

		const partial: Omit<Plate, 'id'> = {
			jurisdiction: data['jurisdiction'],
			startYear: data['startYear'] != '' ? parseInt(data['startYear']) : null,
			endYear: data['endYear'] != '' ? parseInt(data['endYear']) : null
		};

		const plate = await createPlate(partial);

		// redirect to the newly created plate
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
