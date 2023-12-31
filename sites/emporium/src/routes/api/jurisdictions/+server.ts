import { json } from '@sveltejs/kit';

import { getJurisdictions } from '$lib/server/database/jurisdictions';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ setHeaders }) => {
	const jurisdictions = await getJurisdictions({});

	setHeaders({
		'cache-control': 'public, max-age=3600'
	});

	return json(jurisdictions);
};
