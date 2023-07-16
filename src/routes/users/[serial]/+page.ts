import { storeScores } from '$lib/api/scores';
import type { Score } from '$db/schema';
import type { Writable } from 'svelte/store';

export const load = async ({ parent, data, fetch }) => {
	const { user } = await parent();
	const { categories } = data;

	const { sessionUser } = await parent();
	const isLoggedInUser = sessionUser !== null && sessionUser.id == user.id;
	const isLoggedInAdmin = sessionUser !== null && sessionUser.isAdmin;

	if (isLoggedInUser) user.email = sessionUser.email;

	const reviewsScores = user.reviews.reduce<{
		[reviewId: number]: {
			[categoryId: number]: Writable<Score>[];
		};
	}>((previous, review) => {
		const reviewScores = storeScores(
			review.model.scores,
			review.modelId,
			user?.id,
			categories,
			fetch
		);

		previous[review.id] = reviewScores.allScores;

		return previous;
	}, {});

	return { user, isLoggedInUser, isLoggedInAdmin, reviewsScores, categories };
};
