import { json } from '@sveltejs/kit';

import { deleteReview, updateReview } from '$lib/database/reviews';

import type { RequestHandler } from './$types';
export const PUT: RequestHandler = async ({ locals, request, params }) => {
	try {
		if (locals.user) {
			const { description }: { description: string } = await request.json();

			const modelId = parseInt(params.id);
			const reviewId = parseInt(params.reviewId);
			const userId: number = locals.user.id;

			const data = {
				id: reviewId,
				modelId,
				userId,
				description: description || undefined
			};

			const review = await updateReview(data);

			return json(review);
		} else {
			return json(
				{ error: `not signed in` },
				{
					status: 401
				}
			);
		}
	} catch (err) {
		console.error(err);
		return new Response(undefined, { status: 500 });
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

			return new Response(undefined);
		} else {
			return json(
				{ error: `not signed in` },
				{
					status: 401
				}
			);
		}
	} catch (err) {
		console.error(err);
		return new Response(undefined, { status: 500 });
	}
};
