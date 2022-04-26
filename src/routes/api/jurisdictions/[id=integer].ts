// api/jurisdictions/[id=integer].ts

import { getJurisidictionWithPlates } from '$lib/database/jurisdictions';

/** @type {import('./api/jurisdictions/[id=integer]').RequestHandler} */
export async function get({ params }) {
	try {
		const jurisdiction = await getJurisidictionWithPlates({ id: parseInt(params.id) });

		return {
			body: jurisdiction
		};
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
}
