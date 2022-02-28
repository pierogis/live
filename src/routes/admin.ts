import { listJurisdictions } from '$lib/database/jurisdiction';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get() {
	const jurisdictions = await listJurisdictions();

	return {
		body: { jurisdictions }
	};
}
