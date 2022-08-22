import { json } from '@sveltejs/kit';

import { getJurisdictions } from '$lib/database/jurisdictions';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async () => {
	try {
		const jurisdictions = await getJurisdictions({});

		return json(jurisdictions, {
			headers: {
				'cache-control': 'public, max-age=3600'
			}
		});
	} catch (err) {
		console.error(err);
		return new Response(undefined, { status: 500 });
	}
};
