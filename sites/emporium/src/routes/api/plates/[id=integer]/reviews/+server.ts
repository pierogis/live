import { error, json } from '@sveltejs/kit';

import { upsertReview } from '$queries';

import type { RequestHandler } from './$types';
export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (locals.sessionUser !== null) {
		const { description }: { description: string } = await request.json();

		const modelId = parseInt(params.id);
		const userId: number = locals.sessionUser.id;

		const data = {
			modelId,
			userId,
			description: description
		};

		const review = await upsertReview(locals.db, data);

		return json(review);
	} else {
		error(401, 'not signed in');
	}
};
