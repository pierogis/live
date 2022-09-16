import { PUBLIC_API_BASE } from '$env/static/public';

import type { Category } from '@prisma/client';
import type { FullPlate } from '$lib/models';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ fetch }) => {
	const platesResponse = await fetch(`${PUBLIC_API_BASE}/plates`, { mode: 'cors' });
	const categoriesResponse = await fetch(`${PUBLIC_API_BASE}/plates/categories`, { mode: 'cors' });

	const plates: FullPlate[] = await platesResponse.json();
	const categories: Category[] = await categoriesResponse.json();

	return {
		plates,
		categories
	};
};
