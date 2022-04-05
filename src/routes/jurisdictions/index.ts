import { getPlatePerJurisdiction } from '$lib/database/plates';

/** @type {import('./jurisdictions/index').RequestHandler} */
export async function get() {
	const plates = await getPlatePerJurisdiction();

	return {
		body: { plates }
	};
}
