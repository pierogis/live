// api/jurisdictions/index.ts

import { getJurisdictions } from '$lib/database/jurisdictions';

/** @type {import('./api/jurisdictions/index').RequestHandler} */
export async function get() {
	try {
		const jurisdictions = await getJurisdictions({});

		return {
			status: 200,
			headers: {
				'cache-control': 'public, max-age=3600'
			},
			body: jurisdictions
		};
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
}
