import { getFullPlate } from '$lib/server/database/plates';
import { getCategories } from '$lib/server/database/categories';

import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params }) => {
	const plate = await getFullPlate({ modelId: parseInt(params.id) });
	const categories = await getCategories({ wareName: 'plate' });

	return {
		categories,
		plate
	};
};
