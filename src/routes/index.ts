import type { Plate } from '$lib/database/models';
import { listPlates, createPlate } from '$lib/database/plates';

/** @type {import('./index').RequestHandler} */
export async function get() {
	const plates = await listPlates();

	// this should be based on the user id
	const showAdmin = true;

	return {
		body: { plates, showAdmin }
	};
}

/** @type {import('./index').RequestHandler} */
export async function post({ request }: { request: Request }) {
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
			location: `/${plate.id}`
		}
	};
}
