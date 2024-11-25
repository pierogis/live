import { json } from '@sveltejs/kit';

import { getCategories } from '$queries';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ locals, setHeaders }) => {
	const categories = await getCategories(locals.db, { ware: 'plate' });

	setHeaders({
		'cache-control': 'public, max-age=3600'
	});

	return json(categories);
};
