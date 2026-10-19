import { getCategories } from '#lib/server/database/categories.js';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async (event) => {
	const categories = await getCategories(event.locals.db, { ware: 'plate' });

	event.setHeaders({
		'cache-control': 'public, max-age=3600'
	});

	return Response.json(categories);
};
