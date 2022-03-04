import { getPlates } from '$lib/database/plates';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }: { params: { jurisdiction: string } }) {
	const plates = await getPlates(params);

	return {
		body: { plates }
	};
}
