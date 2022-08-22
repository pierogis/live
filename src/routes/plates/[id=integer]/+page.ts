import { error } from '@sveltejs/kit';
import { PUBLIC_API_BASE } from '$env/static/public';

import { storeScores } from '$lib/api/scores';
import { storeReviews } from '$lib/api/reviews';

import type { FullPlate } from '$lib/database/models';
import type { Category } from '@prisma/client';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent, fetch, params }) => {
	const platesResponse = await fetch(`${PUBLIC_API_BASE}/plates/${params.id}`);
	const categoriesResponse = await fetch(`${PUBLIC_API_BASE}/plates/categories`);

	if (platesResponse.status == 404) {
		throw error(404, "plate doesn't exist");
	}

	const plate: FullPlate = await platesResponse.json();
	const categories: Category[] = await categoriesResponse.json();

	const session = await parent();

	const reviewStores = storeReviews(plate.model.reviews, plate.modelId, session.user?.id);

	const userReview = reviewStores.userReview;
	const editorialReview = reviewStores.editorialReview;
	const allReviews = reviewStores.allReviews;

	const scoreStores = storeScores(plate.model.scores, plate.modelId, session.user?.id, categories);
	const userScores = scoreStores.userScores;
	const editorialScores = scoreStores.editorialScores;
	const allScores = scoreStores.allScores;

	return {
		categories,
		plate,
		user: session.user,
		userReview,
		editorialReview,
		allReviews,
		userScores,
		editorialScores,
		allScores
	};
};
