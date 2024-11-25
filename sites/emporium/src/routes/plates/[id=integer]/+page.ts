import { storeScores } from '$lib/api/scores';
import { storeReviews } from '$lib/api/reviews';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data, params }) => {
	const { plate, categories } = await parent();
	const { sessionUser, reviewForm } = data;
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

	const canonical = `https://emporium.pierogis.live/plates/${params.id}`;
	const title = `${plate.jurisdiction.name} plate (${plate.startYear || '?'}-${
		plate.endYear || '?'
	})`;
	const description = `view ${title}`;

	return {
		canonical,
		title,
		description,
		reviewForm,
		userReview,
		editorialReview,
		allReviews,
		userScores,
		editorialScores,
		allScores,
		sessionUser
	};
};
