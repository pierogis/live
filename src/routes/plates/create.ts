import { listJurisdictions } from '$lib/database/jurisdictions';

/** @type {import('/plates/create').RequestHandler} */
export async function get() {
	const jurisdictions = await listJurisdictions();

	return {
		body: { jurisdictions }
	};
}
