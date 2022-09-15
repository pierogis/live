import { PUBLIC_API_BASE } from '$env/static/public';

import type { Category } from '@prisma/client';
import type { FullPlate } from '$lib/models';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ fetch }) => {
	const platesResponse = await fetch(`${PUBLIC_API_BASE}/plates`);
	const categoriesResponse = await fetch(`${PUBLIC_API_BASE}/plates/categories`);

	const plates: FullPlate[] = await platesResponse.json();
	const categories: Category[] = await categoriesResponse.json();

	return {
		status: 200,
		plates,
		categories
	};
};
