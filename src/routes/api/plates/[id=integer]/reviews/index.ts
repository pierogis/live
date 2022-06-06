// api/plates/[id=integer]/reviews.ts

import { insertReview } from '$lib/database/reviews';

import type { RequestHandler } from './__types';
export const post: RequestHandler = async ({ locals, request, params }) => {
	try {
		if (locals.user) {
			const json: { description: string } = await request.json();

			const modelId = parseInt(params.id);
			const userId: number = locals.user.id;

			const data = {
				modelId,
				userId,
				description: json.description || undefined
			};

			const review = await insertReview(data);

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
