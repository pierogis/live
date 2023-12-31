import { error, json } from '@sveltejs/kit';

import { upsertReview } from '$lib/server/database/reviews';

import type { RequestHandler } from './$types';
export const POST: RequestHandler = async (event) => {
	if (event.locals.sessionUser !== null) {
		const { description }: { description: string } = await event.request.json();

		const modelId = parseInt(event.params.id);
		const userId: number = event.locals.sessionUser.id;

		const data = {
			modelId,
			userId,
			description: description
		};

		const review = await upsertReview(data);

		return json(review);
	} else {
		error(401, 'not signed in');
	}
};
