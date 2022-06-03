import type { Review, User } from '@prisma/client';
import { get, writable, type Writable } from 'svelte/store';

export async function handleSubmitReview(
	description: string,
	userReview: Writable<Review>,
	modelId: number
): Promise<string> {
	const data = { description };

	userReview.update((review) => {
		review.description = description;

		return review;
	});

	const reviewUserId = get(userReview).id;

	if (reviewUserId) {
		await fetch(`/api/plates/${modelId}/reviews/${reviewUserId}`, {
			method: 'put',
			body: JSON.stringify(data)
		});
	} else {
		await fetch(`/api/plates/${modelId}/reviews`, {
			method: 'post',
			body: JSON.stringify(data)
		});
	}

	return `/api/plates/${modelId}`;
}

export async function handleDeleteReview(
	userReview: Writable<Review>,
	modelId: number
): Promise<string> {
	const reviewUserId = get(userReview).id;

	if (reviewUserId) {
		await fetch(`/api/plates/${modelId}/reviews/${reviewUserId}`, { method: 'delete' });
	}

	return `/api/plates/${modelId}`;
}

export function transformReviews(
	reviews: (Review & { user: User })[],
	modelId: number,
	userId: number
) {
	let userReview: Writable<Review> = writable({
		id: null,
		modelId: modelId,
		userId: userId,
		description: ''
	});

	let editorialReview: Writable<Review> = writable({
		id: null,
		modelId: modelId,
		userId: 1,
		description: ''
	});

	let allReviews: Writable<Review & { user: User }>[] = [];

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
