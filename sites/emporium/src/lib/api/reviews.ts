import { writable, type Writable } from 'svelte/store';

import type { Review, User } from '$db/schema';

export function storeReviews(
	reviews: (Review & { user: User })[],
	modelId: number,
	userId: number | undefined
) {
	let userReview: Writable<{ id?: number; modelId: number; userId?: number; description: string }> =
		writable({
			id: undefined,
			modelId: modelId,
			userId: userId,
			description: ''
		});

	let editorialReview: Writable<{
		id?: number;
		modelId: number;
		userId?: number;
		description: string;
	}> = writable({
		id: undefined,
		modelId: modelId,
		userId: 1,
		description: ''
	});

	const allReviews: Writable<Review & { user: User }>[] = [];

	reviews.forEach((review) => {
		const reviewStore = writable(review);

		if (review.userId == userId) {
			userReview = reviewStore;
		}

		if (review.userId == 1) {
			editorialReview = reviewStore;
		}

		allReviews.push(reviewStore);
	});

	if (userId == 1) {
		editorialReview = userReview;
	}

	return { userReview, editorialReview, allReviews };
}
