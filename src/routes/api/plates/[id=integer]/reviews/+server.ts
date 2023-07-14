import { error, json } from '@sveltejs/kit';

import { upsertReview } from '$lib/server/database/reviews';

import type { RequestHandler } from './$types';
export const POST: RequestHandler = async ({ locals, request, params }) => {
	if (locals.sessionUser !== null) {
		const { description }: { description: string } = await request.json();

		const modelId = parseInt(params.id);
		const userId: number = locals.sessionUser.id;

		const data = {
			modelId,
			userId,
			description: description || undefined
		};

		const review = await upsertReview(data);

		return json(review);
	} else {
		throw error(401, 'not signed in');
	}
};
