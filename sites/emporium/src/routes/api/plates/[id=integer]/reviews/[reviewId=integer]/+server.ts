import { json, error } from '@sveltejs/kit';

import { deleteReview, updateReview } from '$lib/server/database/reviews';

import type { RequestHandler } from './$types';
export const PUT: RequestHandler = async (event) => {
	if (event.locals.sessionUser !== null) {
		const { description }: { description: string } = await event.request.json();

		const modelId = parseInt(event.params.id);
		const reviewId = parseInt(event.params.reviewId);
		const userId: number = event.locals.sessionUser.id;

		const data = {
			id: reviewId,
			modelId,
			userId,
			description: description
		};

		const review = await updateReview(event.locals.db, data);

		return json(review);
	} else {
		error(401, 'not signed in');
	}
};

export const DELETE: RequestHandler = async (event) => {
	if (event.locals.sessionUser !== null) {
		const modelId = parseInt(event.params.id);
		const userId: number = event.locals.sessionUser.id;

		const reviewParams = {
			modelId,
			userId
		};

		const review = await deleteReview(event.locals.db, reviewParams);

		return json(review);
	} else {
		error(401, 'not signed in');
	}
};
