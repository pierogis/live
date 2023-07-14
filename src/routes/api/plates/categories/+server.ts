import { json } from '@sveltejs/kit';
import { getCategories } from '$lib/server/database/categories';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ setHeaders }) => {
	const categories = await getCategories({ ware: 'plate' });

	setHeaders({
		'cache-control': 'public, max-age=3600'
	});

	return json(categories);
};
