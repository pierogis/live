import { getPlates } from '$lib/database/plate';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	const parsedParams = { ...params, id: parseInt(params.id) };
	const plates = await getPlates(parsedParams);

	return {
		body: { plate: plates[0] }
	};
}
