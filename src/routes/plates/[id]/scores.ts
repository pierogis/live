import { getScores } from '$lib/database/scores';

/** @type {import('./plates/[id]/scores').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	const parsedParams = { plateId: parseInt(params.id) };
	const scores = await getScores(parsedParams);

	return {
		body: { scores }
	};
}
