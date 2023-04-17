import { storeScores } from '$lib/api/scores';
import type { Score } from '@prisma/client';
import type { Writable } from 'svelte/store';

export const load = async ({ parent, data, fetch }) => {
	const { user } = await parent();
	const { categories } = data;

	const { sessionUser } = await parent();
	const isUser = sessionUser && sessionUser.id == user.id;
	const isAdmin = sessionUser && sessionUser.isAdmin;

	if (isUser) user.email = sessionUser.email;

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

	return { user, isUser, isAdmin, reviewsScores, categories };
};
