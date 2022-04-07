// api/plates/[id]/reviews/[reviewId].ts

import { deleteReview, updateReview } from '$lib/database/reviews';

/** @type {import('./api/plates/[id]/reviews/[reviewId]').RequestHandler} */
export async function put({ locals, request, params }) {
	if (locals.user) {
		const json: { description: string } = await request.json();

		const plateId = parseInt(params.id);
		const reviewId = parseInt(params.reviewId);
		const userId: number = locals.user.id;

		const data = {
			id: reviewId,
			plateId,
			userId,
			description: json.description || undefined
		};

		const review = await updateReview(data);

		// redirect to the updated plate
		return {
			status: 200,
			body: review
		};
	} else {
		return {
			status: 401,
			body: { error: `not signed in` }
		};
	}
}

/** @type {import('./api/plates/[id]/reviews/[reviewId]').RequestHandler} */
export async function del({ locals, params }) {
	if (locals.user) {
		const plateId = parseInt(params.id);
		const userId: number = locals.user.id;

		const reviewParams = {
			plateId,
			userId
		};

		await deleteReview(reviewParams);

		// redirect to the updated plate
		return {
			status: 200
		};
	} else {
		return {
			status: 401,
			body: { error: `not signed in` }
		};
	}
}
