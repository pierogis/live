// api/plates/[id]/reviews.ts

import { insertReview } from '$lib/database/reviews';

/** @type {import('./api/plates/[id]/reviews').RequestHandler} */
export async function post({ locals, request, params }) {
	if (locals.user) {
		const json: { description: string } = await request.json();

		const plateId = parseInt(params.id);
		const userId: number = locals.user.id;

		const data = {
			plateId,
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
}
