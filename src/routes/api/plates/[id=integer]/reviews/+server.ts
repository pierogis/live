import { json } from '@sveltejs/kit';

import { insertReview } from '$lib/database/reviews';

import type { RequestHandler } from './$types';
export const POST: RequestHandler = async ({ locals, request, params }) => {
	try {
		if (locals.user) {
			const { description }: { description: string } = await request.json();

			const modelId = parseInt(params.id);
			const userId: number = locals.user.id;

			const data = {
				modelId,
				userId,
				description: description || undefined
			};

			const review = await insertReview(data);

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
