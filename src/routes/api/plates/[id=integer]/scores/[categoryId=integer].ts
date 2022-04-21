// api/plates/[id=integer]/scores/[category=category].ts

import { deleteScore, upsertScore } from '$lib/database/scores';

/** @type {import('./api/plates/[id=integer]/scores/[categoryId=integer]').RequestHandler} */
export async function put({ locals, params, request }) {
	console.log('karl');
	try {
		if (locals.user) {
			const modelId = parseInt(params.id);
			const userId: number = locals.user.id;
			const categoryId = parseInt(params.categoryId);

			const body: { value: number } = await request.json();

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
}

/** @type {import('./api/plates/[id=integer]/scores/[categoryId=integer]').RequestHandler} */
export async function del({ locals, params }) {
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
}
