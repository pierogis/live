import { json } from '@sveltejs/kit';

import { getJurisdictions } from '$lib/server/database/jurisdictions';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async (event) => {
	const jurisdictions = await getJurisdictions(event.locals.db, {});

	event.setHeaders({
		'cache-control': 'public, max-age=3600'
	});

	return json(jurisdictions);
};
