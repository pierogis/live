import { json } from '@sveltejs/kit';

import { getJurisdictions } from '$queries';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ locals, setHeaders }) => {
	const jurisdictions = await getJurisdictions(locals.db, {});

	setHeaders({
		'cache-control': 'public, max-age=3600'
	});

	return json(jurisdictions);
};
