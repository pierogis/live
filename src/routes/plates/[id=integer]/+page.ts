import { storeScores } from '$lib/api/scores';
import { storeReviews } from '$lib/api/reviews';

export const load = async ({ parent, fetch, data }) => {
	const { plate, sessionUser, categories } = await parent();
	const reviewStores = storeReviews(plate.model.reviews, plate.modelId, sessionUser?.id);

	const { userReview, editorialReview, allReviews } = reviewStores;

	const scoreStores = storeScores(
		plate.model.scores,
		plate.modelId,
		sessionUser?.id,
		categories,
		fetch
	);

	const { userScores, editorialScores, allScores } = scoreStores;

	return {
		reviewForm: data.reviewForm,
		userReview,
		editorialReview,
		allReviews,
		userScores,
		editorialScores,
		allScores
	};
};
