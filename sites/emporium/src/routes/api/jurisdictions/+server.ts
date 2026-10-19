import { getJurisdictions } from '#lib/server/database/jurisdictions.js';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async (event) => {
	const jurisdictions = await getJurisdictions(event.locals.db, {});

	event.setHeaders({
		'cache-control': 'public, max-age=3600'
	});

	return Response.json(jurisdictions);
};
