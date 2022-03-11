import { listJurisdictions } from '$lib/database/jurisdictions';
import { getPlate } from '$lib/database/plates';

/** @type {import('./plates/[id]/edit').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	const parsedParams = { ...params, id: parseInt(params.id) };
	const plate = await getPlate(parsedParams);

	const jurisdictions = listJurisdictions();

	return {
		body: { plate, jurisdictions }
	};
}
