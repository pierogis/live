import { json } from '@sveltejs/kit';

import { deleteScore, upsertScore } from '$lib/database/scores';

import type { RequestHandler } from './$types';
export const PUT: RequestHandler = async ({ locals, request, params }) => {
	try {
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
			const categoryId = parseInt(params.categoryId);

			const score = {
				modelId,
				userId,
				categoryId
			};

			await deleteScore(score);

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
