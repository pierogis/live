import { json } from '@sveltejs/kit';
import { getCategories } from '$lib/database/categories';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ setHeaders }) => {
	try {
		const categories = await getCategories({ wareName: 'plate' });

		setHeaders({
			'cache-control': 'public, max-age=3600'
		});

		return json(categories);
	} catch (err) {
		console.error(err);
		return new Response(undefined, { status: 500 });
	}
};
