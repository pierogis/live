import { error } from '@sveltejs/kit';
import type { Category, Model, Review, Score, User, Image } from '@prisma/client';
import { PUBLIC_API_BASE } from '$env/static/public';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent, fetch, params }) => {
	const userResponse = await fetch(`${PUBLIC_API_BASE}/users?serial=${params.serial}`);
	const user: User & {
		scores: Score[];
		reviews: (Review & {
			model: Model & {
				scores: Score[];
				images: Image[];
			};
		})[];
	} = await userResponse.json();

	if (userResponse.status == 404) {
		throw error(404, "user doesn't exist");
	}

	const session = await parent();
	const isUser = session.user && session.user.id == user.id;
	const isAdmin = session.user && session.user.isAdmin;

	if (isUser) user.email = session.user.email;

	const categoriesResponse = await fetch(`${PUBLIC_API_BASE}/plates/categories`);
	const categories: Category[] = await categoriesResponse.json();

	return { user, isUser, isAdmin, categories };
};
