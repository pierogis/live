import { getPlatePerJurisdiction } from '$lib/database/plates';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get() {
	const plates = await getPlatePerJurisdiction();

	return {
		body: { plates }
	};
}
