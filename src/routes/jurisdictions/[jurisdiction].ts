import { getPlates } from '$lib/database/plate';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }: { params: { jurisdiction: string } }) {
	const plates = await getPlates(params);

	return {
		body: { plates }
	};
}
