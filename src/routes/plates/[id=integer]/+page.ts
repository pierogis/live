import { storeScores } from '$lib/api/scores';
import { storeReviews } from '$lib/api/reviews';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent, data }) => {
	const session = await parent();
	const plate = data.plate;
	const categories = data.categories;

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
