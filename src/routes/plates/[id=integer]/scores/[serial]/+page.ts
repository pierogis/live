import { PUBLIC_API_BASE } from '$env/static/public';
import type { FullPlate } from '$lib/database/models';
import type { User, Category } from '@prisma/client';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent, params, fetch }) => {
	const userResponse = await fetch(`${PUBLIC_API_BASE}/users?serial=${params.serial}`);
	const user: User = await userResponse.json();

	const plateResponse = await fetch(`${PUBLIC_API_BASE}/plates/${params.id}`);
	const plate: FullPlate = await plateResponse.json();

	const scores = plate.model.scores.filter((score) => score.userId == user.id);

	const categoriesResponse = await fetch(`${PUBLIC_API_BASE}/plates/categories`);
	const categories: Category[] = await categoriesResponse.json();

	const session = await parent();
	const isUser = session.user?.serial == params.serial;

	return { plate, scores, serial: params.serial, isUser, categories };
};
