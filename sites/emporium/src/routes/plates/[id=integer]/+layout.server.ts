import { error } from '@sveltejs/kit';

import { getFullPlate } from '$lib/server/database/plates';

export const load = async (event) => {
	const plate = await getFullPlate(event.locals.db, { modelId: parseInt(event.params.id) });

	if (!plate) {
		error(404, "plate doesn't exist");
	}

	return {
		plate
	};
};
