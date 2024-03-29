import { getCategories } from '$lib/server/database/categories';

export const load = async () => {
	const categories = await getCategories({ ware: 'plate' });

	return {
		categories
	};
};
