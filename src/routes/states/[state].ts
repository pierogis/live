import * as db from '$lib/database';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }: { params: { state: string } }) {
	const plates = await db.getAll(params);

	return {
		body: { plates }
	};
}
