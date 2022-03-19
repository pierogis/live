import { getImages } from '$lib/database/images';
import { listJurisdictions } from '$lib/database/jurisdictions';
import { getFullPlate } from '$lib/database/plates';

/** @type {import('./plates/[id]/edit').RequestHandler} */
export async function get({ params }) {
	const parsedParams = { ...params, id: parseInt(params.id) };
	const plate = await getFullPlate(parsedParams);

	const jurisdictions = await listJurisdictions();

	return {
		body: { plate, jurisdictions }
	};
}
