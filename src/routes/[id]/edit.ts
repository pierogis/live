import { listJurisdictions } from '$lib/database/jurisdictions';
import { getPlates } from '$lib/database/plates';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	const parsedParams = { ...params, id: parseInt(params.id) };
	const plates = await getPlates(parsedParams, 1);

	const jurisdictions = listJurisdictions();

	return {
		body: { plate: plates[0], jurisdictions }
	};
}
