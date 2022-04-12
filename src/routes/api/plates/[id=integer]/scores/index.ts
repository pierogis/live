// api/plates/[id=integer]/scores/index.ts

import { getScores } from '$lib/database/scores';

/** @type {import('./api/plates/[id=integer]/scores').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	try {
		const parsedParams = { plateId: parseInt(params.id) };
		const scores = await getScores(parsedParams);

		return {
			body: { scores }
		};
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
}
