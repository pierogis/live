import type { Writable } from 'svelte/store';
import { superValidate } from 'sveltekit-superforms/client';
import { valibot } from 'sveltekit-superforms/adapters';

import type { Score } from '$db/schema';
import { storeScores } from '$lib/api/scores';
import { userSchema } from '$lib/forms/user';

export const load = async (event) => {
	const { user } = await event.parent();
	const { categories } = event.data;

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

	const form = await superValidate({ serial: user.serial }, valibot(userSchema));

	const canonical = `https://emporium.pierogis.live/users/${event.params.serial}`;
	const title = `user: ${user.serial.toUpperCase()}`;
	const description = `user: ${user.serial.toUpperCase()} of the emporium`;

	return { canonical, title, description, user, form, reviewsScores, categories };
};
