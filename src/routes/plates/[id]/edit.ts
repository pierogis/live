import { getImages } from '$lib/database/images';
import { listJurisdictions } from '$lib/database/jurisdictions';
import { getPlate } from '$lib/database/plates';

/** @type {import('./plates/[id]/edit').RequestHandler} */
export async function get({ params }) {
	const parsedParams = { ...params, id: parseInt(params.id) };
	const plate = await getPlate(parsedParams);
	const images = await getImages({ plateId: plate.id });

	const jurisdictions = await listJurisdictions();

	return {
		body: { plate, jurisdictions, images }
	};
}
