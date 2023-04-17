import { getFullPlates } from '$lib/server/database/plates';
import { getCategories } from '$lib/server/database/categories';

export const load = async () => {
	const plates = await getFullPlates();

	const categories = await getCategories({ wareName: 'plate' });

	return {
		plates,
		categories
	};
};
