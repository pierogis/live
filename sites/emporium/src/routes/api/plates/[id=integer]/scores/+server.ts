import { error, json } from '@sveltejs/kit';

import { getScores } from '$queries';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ url, locals, params }) => {
	const userIdParam = url.searchParams.get('userId');

	const userId = locals.sessionUser?.id || userIdParam === null ? null : parseInt(userIdParam);
	if (userId) {
		const parsedParams = { modelId: parseInt(params.id), userId: userId };
		const scores = await getScores(locals.db, parsedParams);

		return json(scores);
	} else {
		error(401, 'not signed in and userId not specified');
	}
};
