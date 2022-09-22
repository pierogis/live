import { error, json } from '@sveltejs/kit';

import { getScores } from '$lib/server/database/scores';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ locals, url, params }) => {
	const userId = locals.sessionUser?.id || parseInt(url.searchParams.get('userId'));
	if (userId) {
		const parsedParams = { modelId: parseInt(params.id), userId: userId };
		const scores = await getScores(parsedParams);

		return json(scores);
	} else {
		throw error(401, 'not signed in and userId not specified');
	}
};
