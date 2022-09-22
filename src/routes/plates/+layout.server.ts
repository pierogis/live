import { getFullPlates } from '$lib/server/database/plates';
import { getCategories } from '$lib/server/database/categories';

import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async () => {
	const plates = await getFullPlates();

	const categories = await getCategories({ wareName: 'plate' });

	return {
		plates,
		categories
	};
};
