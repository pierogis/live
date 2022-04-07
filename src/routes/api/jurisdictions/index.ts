// api/jurisdictions/index.ts

import { getJurisdictions } from '$lib/database/jurisdictions';

/** @type {import('./api/jurisdictions/index').RequestHandler} */
export async function get({ params }) {
	const jurisdictions = await getJurisdictions({});

	return {
		body: jurisdictions
	};
}
