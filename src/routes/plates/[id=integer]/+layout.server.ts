import { error } from '@sveltejs/kit';

import { getFullPlate } from '$lib/server/database/plates';

import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async ({ params, parent }) => {
	const { categories } = await parent();
	const plate = await getFullPlate({ modelId: parseInt(params.id) });

	if (!plate) {
		throw error(404, "plate doesn't exist");
	}

	return {
		categories,
		plate
	};
};
