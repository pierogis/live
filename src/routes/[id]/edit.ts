import { listJurisdictions } from '$lib/database/jurisdictions';
import { getPlate } from '$lib/database/plates';

/** @type {import('./[id]/edit').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	try {
		const parsedParams = { ...params, id: parseInt(params.id) };
		const plate = await getPlate(parsedParams);

		const jurisdictions = listJurisdictions();

		return {
			body: { plate, jurisdictions }
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
