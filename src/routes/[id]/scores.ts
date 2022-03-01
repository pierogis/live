import { getScores } from '$lib/database/review';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	const parsedParams = { plateId: parseInt(params.id) };
	const scores = await getScores(parsedParams);

	return {
		body: { scores }
	};
}
