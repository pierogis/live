import { error } from '@sveltejs/kit';

import { getJurisidictionWithPlates } from '$lib/server/database/jurisdictions';
import { getCategories } from '$lib/server/database/categories';

import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params }) => {
	const jurisdiction = getJurisidictionWithPlates({ id: parseInt(params.id) });

	if (!jurisdiction) {
		throw error(404, "jurisdiction doesn't exist");
	}

	const categories = getCategories({ wareName: 'plate' });

	return { jurisdiction, categories };
};
