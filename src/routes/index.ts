import type { Plate } from '$lib/database/models';
import { listPlates, createPlate } from '$lib/database/plates';

/** @type {import('./index').RequestHandler} */
export async function get() {
	const plates = await listPlates();

	return {
		body: { plates }
	};
}

/** @type {import('./index').RequestHandler} */
export async function post({ request }: { request: Request }) {
	let formData = await request.formData();

	let data = {};
	formData.forEach((v, k) => {
		data[k] = v.valueOf();
	});

	const plate: Omit<Plate, 'id'> = {
		jurisdiction: data['jurisdiction'],
		startYear: data['startYear'] != '' ? parseInt(data['startYear']) : null,
		endYear: data['endYear'] != '' ? parseInt(data['endYear']) : null
	};

	const id = await createPlate(plate);

	// redirect to the newly created plate
	return {
		status: 303,
		headers: {
			location: `/${id}`
		}
	};
}
