import { json } from '@sveltejs/kit';

import { getJurisdictionWithPlates } from '$lib/server/database/jurisdictions';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const jurisdiction = await getJurisdictionWithPlates({ id: parseInt(params.id) });

	setHeaders({
		'cache-control': 'no-cache'
	});

	return json(jurisdiction);
};
