// api/jurisdictions/[id].ts

import { getJurisidictionWithPlates } from '$lib/database/jurisdictions';

/** @type {import('./api/jurisdictions/[id]').RequestHandler} */
export async function get({ params }) {
	const jurisdiction = await getJurisidictionWithPlates({ id: parseInt(params.id) });

	return {
		body: jurisdiction
	};
}
