// api/plates/[id=integer]/scores/index.ts

import { getScores } from '$lib/database/scores';

/** @type {import('./api/plates/[id=integer]/scores/index').RequestHandler} */
export async function get({ params, locals, url }) {
	try {
		const userId = locals.user?.id || url.searchParams.get('userId');
		if (userId) {
			const parsedParams = { modelId: parseInt(params.id), userId: parseInt(userId) };
			const scores = await getScores(parsedParams);

			return {
				body: scores
			};
		} else {
			return {
				status: 401,
				body: { error: 'not signed in and userId not specified' }
			};
		}
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
}
