import { json } from '@sveltejs/kit';

import { getJurisdictionWithPlates } from '$queries';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ locals, params, setHeaders }) => {
	const jurisdiction = await getJurisdictionWithPlates(locals.db, { id: parseInt(params.id) });

	setHeaders({
		'cache-control': 'no-cache'
	});

	return json(jurisdiction);
};
