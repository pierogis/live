import type { Plate } from '$lib/database/models';
import { getPlate, updatePlate, deletePlate } from '$lib/database/plates';

/** @type {import('./plates/[id]').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	try {
		const parsedParams = { ...params, id: parseInt(params.id) };
		const plate = await getPlate(parsedParams);

		if (plate) {
			return {
				status: 200,
				body: { plate: plate }
			};
		}

		return {
			status: 404
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

/** @type {import('./plates/[id]').RequestHandler} */
export async function put({ request, params }: { request: Request; params: { id: string } }) {
	try {
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

/** @type {import('./plates/[id]').RequestHandler} */
export async function del({ params }: { params: { id: string } }) {
	try {
		await deletePlate(parseInt(params.id));

		// redirect to the newly created plate
		return {
			status: 303,
			headers: {
				location: `/`
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
