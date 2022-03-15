import { getJurisidictionWithPlates } from '$lib/database/jurisdictions';

/** @type {import('./jurisdictions/[id]').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	const jurisdiction = await getJurisidictionWithPlates({ id: parseInt(params.id) });

	return {
		body: { jurisdiction }
	};
}
