import { json } from '@sveltejs/kit';
import { getCategories } from '$lib/server/database/categories';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async (event) => {
	const categories = await getCategories(event.locals.db, { ware: 'plate' });

	event.setHeaders({
		'cache-control': 'public, max-age=3600'
	});

	return json(categories);
};
