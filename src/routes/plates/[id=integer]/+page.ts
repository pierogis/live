import { storeScores } from '$lib/api/scores';
import { storeReviews } from '$lib/api/reviews';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent, fetch }) => {
	const { sessionUser, plate, categories } = await parent();

	const reviewStores = storeReviews(plate.model.reviews, plate.modelId, sessionUser?.id);

	const userReview = reviewStores.userReview;
	const editorialReview = reviewStores.editorialReview;
	const allReviews = reviewStores.allReviews;

	const scoreStores = storeScores(
		plate.model.scores,
		plate.modelId,
		sessionUser?.id,
		categories,
		fetch
	);
	const userScores = scoreStores.userScores;
	const editorialScores = scoreStores.editorialScores;
	const allScores = scoreStores.allScores;

	return {
		categories,
		plate,
		userReview,
		editorialReview,
		allReviews,
		userScores,
		editorialScores,
		allScores
	};
};
