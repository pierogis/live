import { error } from '@sveltejs/kit';

import { getFullPlate } from '$queries';

export const load = async ({ params, locals }) => {
	const plate = await getFullPlate(locals.db, { modelId: parseInt(params.id) });

	if (!plate) {
		error(404, "plate doesn't exist");
	}

	return {
		plate
	};
};
