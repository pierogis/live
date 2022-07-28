// api/jurisdictions/index.ts

import { getJurisdictions } from '$lib/database/jurisdictions';

import type { RequestHandler } from './__types';
export const GET: RequestHandler = async () => {
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
};
