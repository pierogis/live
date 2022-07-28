import { get, writable, type Writable } from 'svelte/store';

import type { Review, User } from '@prisma/client';

import { PUBLIC_API_BASE } from '$env/static/public';

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
		await fetch(`${PUBLIC_API_BASE}/plates/${modelId}/reviews/${reviewUserId}`, {
			method: 'put',
			body: JSON.stringify(data)
		});
	} else {
		await fetch(`${PUBLIC_API_BASE}/plates/${modelId}/reviews`, {
			method: 'post',
			body: JSON.stringify(data)
		});
	}

	return `${PUBLIC_API_BASE}/plates/${modelId}`;
}

export async function handleDeleteReview(
	userReview: Writable<Review>,
	modelId: number
): Promise<string> {
	const reviewUserId = get(userReview).id;

	if (reviewUserId) {
		await fetch(`${PUBLIC_API_BASE}/plates/${modelId}/reviews/${reviewUserId}`, {
			method: 'delete'
		});
	}

	return `${PUBLIC_API_BASE}/plates/${modelId}`;
}

export function storeReviews(
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
