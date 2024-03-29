import { error } from '@sveltejs/kit';

import { getJurisdictionWithPlates } from '$lib/server/database/jurisdictions';
import { getCategories } from '$lib/server/database/categories';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const jurisdiction = await getJurisdictionWithPlates({ id: parseInt(event.params.id) });

	if (!jurisdiction) {
		error(404, "jurisdiction doesn't exist");
	}

	const categories = await getCategories({ ware: 'plate' });

	return { jurisdiction, categories };
};
