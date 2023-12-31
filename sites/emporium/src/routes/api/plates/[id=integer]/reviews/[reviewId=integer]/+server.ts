import { json, error } from '@sveltejs/kit';

import { deleteReview, updateReview } from '$lib/server/database/reviews';

import type { RequestHandler } from './$types';
export const PUT: RequestHandler = async ({ locals, request, params }) => {
	if (locals.sessionUser !== null) {
		const { description }: { description: string } = await request.json();

		const modelId = parseInt(params.id);
		const reviewId = parseInt(params.reviewId);
		const userId: number = locals.sessionUser.id;

		const data = {
			id: reviewId,
			modelId,
			userId,
			description: description
		};

		const review = await updateReview(data);

		return json(review);
	} else {
		throw error(401, 'not signed in');
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (locals.sessionUser !== null) {
		const modelId = parseInt(params.id);
		const userId: number = locals.sessionUser.id;

		const reviewParams = {
			modelId,
			userId
		};

		const review = await deleteReview(reviewParams);

		return json(review);
	} else {
		throw error(401, 'not signed in');
	}
};
