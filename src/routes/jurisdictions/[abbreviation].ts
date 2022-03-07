import { getPlates } from '$lib/database/plates';
import { getJurisdiction } from '$lib/database/jurisdictions';

/** @type {import('./jurisdictions/[abbreviation]').RequestHandler} */
export async function get({ params }: { params: { abbreviation: string } }) {
	const plates = await getPlates({ jurisdiction: params.abbreviation });
	const jurisdiction = await getJurisdiction(params);

	return {
		body: { plates, jurisdiction }
	};
}
