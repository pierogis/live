import { error, json } from '@sveltejs/kit';

import { getScores } from '$lib/server/database/scores';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async (event) => {
	const userIdParam = event.url.searchParams.get('userId');

	const userId =
		event.locals.sessionUser?.id || userIdParam === null ? null : parseInt(userIdParam);
	if (userId) {
		const parsedParams = { modelId: parseInt(event.params.id), userId: userId };
		const scores = await getScores(event.locals.db, parsedParams);

		return json(scores);
	} else {
		error(401, 'not signed in and userId not specified');
	}
};
