import { error, json } from '@sveltejs/kit';

import { deleteScore, upsertScore } from '$lib/server/database/scores';

import type { RequestHandler } from './$types';
export const PUT: RequestHandler = async (event) => {
	if (event.locals.sessionUser !== null) {
		const modelId = parseInt(event.params.id);
		const userId: number = event.locals.sessionUser.id;
		const categoryId = parseInt(event.params.categoryId);

		const body: { value: number } = await event.request.json();

		if (body.value < 0 || body.value > 10) {
			error(400, 'score value less than 0 or greater than 10');
		}

		const data = {
			modelId,
			userId,
			categoryId,
			value: body.value
		};

		const score = await upsertScore(event.locals.db, data);

		return json(score);
	} else {
		error(401, 'not signed in');
	}
};

export const DELETE: RequestHandler = async (event) => {
	if (event.locals.sessionUser !== null) {
		const modelId = parseInt(event.params.id);
		const userId: number = event.locals.sessionUser.id;
		const categoryId = parseInt(event.params.categoryId);

		const scoreParams = {
			modelId,
			userId,
			categoryId
		};

		const score = await deleteScore(event.locals.db, scoreParams);

		return json(score);
	} else {
		error(401, 'not signed in');
	}
};
