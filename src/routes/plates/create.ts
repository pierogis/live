import { listJurisdictions } from '$lib/database/jurisdictions';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get() {
	const jurisdictions = await listJurisdictions();

	return {
		body: { jurisdictions }
	};
}
