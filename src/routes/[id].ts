import * as db from '$lib/database';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	const parsedParams = { ...params, id: parseInt(params.id) };
	const plate = await db.get(parsedParams);

	return {
		body: { plate }
	};
}
