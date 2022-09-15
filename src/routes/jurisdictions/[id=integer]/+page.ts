import { error } from '@sveltejs/kit';
import { PUBLIC_API_BASE } from '$env/static/public';

import type { Category, Jurisdiction } from '@prisma/client';
import type { FullPlate } from '$lib/models';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ params, fetch }) => {
	const jurisdictionResponse = await fetch(`${PUBLIC_API_BASE}/jurisdictions/${params.id}`);
	const categoriesResponse = await fetch(`${PUBLIC_API_BASE}/plates/categories`);

	const jurisdiction: Jurisdiction & {
		plates: FullPlate[];
	} = await jurisdictionResponse.json();

	const categories: Category[] = await categoriesResponse.json();

	if (!jurisdiction) {
		throw error(404, "jurisdiction doesn't exist");
	}

	return { jurisdiction, categories };
};
