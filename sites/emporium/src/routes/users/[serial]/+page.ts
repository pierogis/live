import type { Writable } from 'svelte/store';

import type { Score } from '$db/schema';
import { storeScores } from '$lib/api/scores';

export const load = async ({ parent, data, params }) => {
	const { user } = await parent();
	const { categories, form } = data;

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

	const canonical = `https://emporium.pierogis.live/users/${params.serial}`;
	const title = `user: ${user.serial.toUpperCase()}`;
	const description = `user: ${user.serial.toUpperCase()} of the emporium`;

	return { canonical, title, description, user, categories, reviewsScores, form };
};
