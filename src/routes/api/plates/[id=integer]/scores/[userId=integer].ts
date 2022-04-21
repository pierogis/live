// api/plates/[id=integer]/scores/[userId=integer].ts

import { getScores } from '$lib/database/scores';

/** @type {import('./api/plates/[id=integer]/scores/[userId=integer]').RequestHandler} */
export async function get({ params }) {
	try {
		const parsedParams = { modelId: parseInt(params.id), userId: parseInt(params.userId) };
		const scores = await getScores(parsedParams);

		return {
			body: scores
		};
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
}
