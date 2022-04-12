// api/plates/[id=integer]/scores/[category].ts

import { deleteScore, upsertScore } from '$lib/database/scores';
import type { Category } from '@prisma/client';

/** @type {import('./api/plates/[id=integer]/scores/[category]').RequestHandler} */
export async function put({ locals, params, request }) {
	try {
		if (locals.user) {
			const plateId = parseInt(params.id);
			const userId: number = locals.user.id;
			const category: Category = params.category;

			const body: { value: number } = await request.json();

			const data = {
				plateId,
				userId,
				category,
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

/** @type {import('./api/plates/[id=integer]/scores/[category]').RequestHandler} */
export async function del({ locals, params }) {
	try {
		if (locals.user) {
			const plateId = parseInt(params.id);
			const userId: number = locals.user.id;
			const category: Category = params.category;

			const score = {
				plateId,
				userId,
				category
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
