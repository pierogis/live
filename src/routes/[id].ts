import * as db from '$lib/database';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }) {
	const plate = await db.get(params);

	return {
		body: { plate }
	};
}
