// api/plates/[id=integer]/scores/[categoryId=integer].ts

import { deleteScore, upsertScore } from '$lib/database/scores';

import type { RequestHandler } from './__types/[categoryId=integer]';
export const put: RequestHandler = async ({ locals, request, params }) => {
	try {
		if (locals.user) {
			const modelId = parseInt(params.id);
			const userId: number = locals.user.id;
			const categoryId = parseInt(params.categoryId);

			const body: { value: number } = await request.json();

			if (body.value < 0 || body.value > 10) {
				return {
					status: 400,
					body: { error: 'score value less than 0 or greater than 10' }
				};
			}

			const data = {
				modelId,
				userId,
				categoryId,
				value: body.value || undefined
			};

			const score = await upsertScore(data);

			// redirect to the updated plate
			return {
				status: 200,
				body: score
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

export const del: RequestHandler = async ({ locals, params }) => {
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

			// redirect to the updated plate
			return {
				status: 200
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
