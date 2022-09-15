import { error, json } from '@sveltejs/kit';

import { deleteScore, upsertScore } from '$lib/server/database/scores';

import type { RequestHandler } from './$types';
export const PUT: RequestHandler = async ({ locals, request, params }) => {
	if (locals.user) {
		const modelId = parseInt(params.id);
		const userId: number = locals.user.id;
		const categoryId = parseInt(params.categoryId);

		const body: { value: number } = await request.json();

		if (body.value < 0 || body.value > 10) {
			return json(
				{ error: 'score value less than 0 or greater than 10' },
				{
					status: 400
				}
			);
		}

		const data = {
			modelId,
			userId,
			categoryId,
			value: body.value || undefined
		};

		const score = await upsertScore(data);

		return json(score);
	} else {
		throw error(401, 'not signed in');
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (locals.user) {
		const modelId = parseInt(params.id);
		const userId: number = locals.user.id;
		const categoryId = parseInt(params.categoryId);

		const scoreParams = {
			modelId,
			userId,
			categoryId
		};

		const score = await deleteScore(scoreParams);

		return json(score);
	} else {
		throw error(401, 'not signed in');
	}
};
