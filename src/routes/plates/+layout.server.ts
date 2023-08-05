import { getCategories } from '$lib/server/database/categories';

export const load = async (event) => {
	const categories = await getCategories({ ware: 'plate' });

	return {
		categories
	};
};
