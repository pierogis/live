import { error } from '@sveltejs/kit';

import { getJurisdictionWithPlates, getCategories } from '$queries';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const jurisdiction = await getJurisdictionWithPlates(locals.db, {
		id: parseInt(params.id)
	});

	if (!jurisdiction) {
		error(404, "jurisdiction doesn't exist");
	}

	const categories = await getCategories(locals.db, { ware: 'plate' });

	return { jurisdiction, categories };
};
