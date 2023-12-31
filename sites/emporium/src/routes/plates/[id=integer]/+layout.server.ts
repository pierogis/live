import { error } from '@sveltejs/kit';

import { getFullPlate } from '$lib/server/database/plates';

export const load = async ({ params }) => {
	const plate = await getFullPlate({ modelId: parseInt(params.id) });

	if (!plate) {
		error(404, "plate doesn't exist");
	}

	return {
		plate
	};
};
