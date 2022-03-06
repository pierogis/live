import { getImages } from '$lib/database/images';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	try {
		const parsedParams = { plateId: parseInt(params.id) };
		const scores = await getImages(parsedParams);

		return {
			body: { scores }
		};
	} catch (error) {
		console.error(error);
		return {
			status: 500,
			body: {
				error: {
					message: 'Internal Server Error'
				}
			}
		};
	}
}
