import type { Plate } from '$lib/database/models';
import { listPlates, createPlate } from '$lib/database/plates';

/** @type {import('./plates/index').RequestHandler} */
export async function get(event) {
	try {
		const plates = await listPlates();
		const showAdmin = event.locals.userId == 0;

		return {
			body: { plates, showAdmin }
		};
	} catch (error) {
		console.error(error);
		return {
			status: 500,
			body: {
				error: {
					message: 'Internal Server Error'
				}
			}
		};
	}
}

/** @type {import('./plates/index').RequestHandler} */
export async function post({ request }: { request: Request }) {
	try {
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
	} catch (error) {
		console.error(error);
		return {
			status: 500,
			body: {
				error: {
					message: 'Internal Server Error'
				}
			}
		};
	}
}
