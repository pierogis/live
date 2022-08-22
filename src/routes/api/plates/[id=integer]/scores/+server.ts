import { json } from '@sveltejs/kit';

import { getScores } from '$lib/database/scores';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ locals, url, params }) => {
	try {
		const userId = locals.user?.id || parseInt(url.searchParams.get('userId'));
		if (userId) {
			const parsedParams = { modelId: parseInt(params.id), userId: userId };
			const scores = await getScores(parsedParams);

			return json(scores);
		} else {
			return json(
				{ error: 'not signed in and userId not specified' },
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
