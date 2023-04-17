import { error } from '@sveltejs/kit';

import { getJurisidictionWithPlates } from '$lib/server/database/jurisdictions';
import { getCategories } from '$lib/server/database/categories';

export const load = async ({ params }) => {
	const jurisdiction = await getJurisidictionWithPlates({ id: parseInt(params.id) });

	if (!jurisdiction) {
		throw error(404, "jurisdiction doesn't exist");
	}

	const categories = await getCategories({ wareName: 'plate' });

	return { jurisdiction, categories };
};
