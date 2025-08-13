import { json } from '@sveltejs/kit';

import { getJurisdictionWithPlates } from '$lib/server/database/jurisdictions';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async (event) => {
	const jurisdiction = await getJurisdictionWithPlates(event.locals.db, {
		id: parseInt(event.params.id)
	});

	event.setHeaders({
		'cache-control': 'no-cache'
	});

	return json(jurisdiction);
};
