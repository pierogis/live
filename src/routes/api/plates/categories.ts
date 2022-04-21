import { getCategories } from '$lib/database/categories';

/** @type {import('./api/plates/categories').RequestHandler} */
export async function get() {
	try {
		const categories = await getCategories({ wareName: 'plate' });

		return {
			status: 200,
			body: categories
		};
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
}
