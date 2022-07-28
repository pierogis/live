// api/plates/[id=integer]/reviews/[reviewId=integer].ts

import { deleteReview, updateReview } from '$lib/database/reviews';

import type { RequestHandler } from './__types/[reviewId=integer]';
export const PUT: RequestHandler = async ({ locals, request, params }) => {
	try {
		if (locals.user) {
			const json: { description: string } = await request.json();

			const modelId = parseInt(params.id);
			const reviewId = parseInt(params.reviewId);
			const userId: number = locals.user.id;

			const data = {
				id: reviewId,
				modelId,
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
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	try {
		if (locals.user) {
			const modelId = parseInt(params.id);
			const userId: number = locals.user.id;

			const reviewParams = {
				modelId,
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
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
};
