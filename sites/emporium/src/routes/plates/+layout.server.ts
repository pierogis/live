import { getCategories } from '$lib/server/database/categories';

export const load = async (event) => {
	const categories = await getCategories(event.locals.db, { ware: 'plate' });

	return {
		categories
	};
};
