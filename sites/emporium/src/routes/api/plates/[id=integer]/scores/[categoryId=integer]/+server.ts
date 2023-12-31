import { error, json } from '@sveltejs/kit';

import { deleteScore, upsertScore } from '$lib/server/database/scores';

import type { RequestHandler } from './$types';
export const PUT: RequestHandler = async ({ locals, request, params }) => {
	if (locals.sessionUser !== null) {
		const modelId = parseInt(params.id);
		const userId: number = locals.sessionUser.id;
		const categoryId = parseInt(params.categoryId);

		const body: { value: number } = await request.json();

		if (body.value < 0 || body.value > 10) {
			error(400, 'score value less than 0 or greater than 10');
		}

		const data = {
			modelId,
			userId,
			categoryId,
			value: body.value
		};

		const score = await upsertScore(data);

		return json(score);
	} else {
		error(401, 'not signed in');
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (locals.sessionUser !== null) {
		const modelId = parseInt(params.id);
		const userId: number = locals.sessionUser.id;
		const categoryId = parseInt(params.categoryId);

		const scoreParams = {
			modelId,
			userId,
			categoryId
		};

		const score = await deleteScore(scoreParams);

		return json(score);
	} else {
		error(401, 'not signed in');
	}
};
