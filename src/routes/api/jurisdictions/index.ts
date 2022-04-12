// api/jurisdictions/index.ts

import { getJurisdictions } from '$lib/database/jurisdictions';

/** @type {import('./api/jurisdictions/index').RequestHandler} */
export async function get() {
	try {
		const jurisdictions = await getJurisdictions({});

		return {
			body: jurisdictions
		};
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
}
