// api/plates/[id=integer]/scores/index.ts

import { getScores } from '$lib/database/scores';

import type { RequestHandler } from './__types';
export const get: RequestHandler = async ({ locals, url, params }) => {
	try {
		const userId = locals.user?.id || parseInt(url.searchParams.get('userId'));
		if (userId) {
			const parsedParams = { modelId: parseInt(params.id), userId: userId };
			const scores = await getScores(parsedParams);

			return {
				status: 200,
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
};
