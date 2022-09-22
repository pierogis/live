import type { Writable } from 'svelte/store';

import type { Score } from '@prisma/client';
import { storeScores } from '$lib/api/scores';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent, data, fetch }) => {
	const { user, categories } = data;

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

	return { user, isUser, isAdmin, categories, reviewsScores };
};
