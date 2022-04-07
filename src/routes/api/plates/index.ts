// api/plates/index.ts

import type { FullPlate } from '$lib/database/models';
import { getFullPlates, createPlate, getPlatePerJurisdiction } from '$lib/database/plates';

/** @type {import('./api/plates/index').RequestHandler} */
export async function get({ request }) {
	const queryParams = new URLSearchParams(request.url.split('?', 2)[1]);
	const distinct = queryParams.get('distinct');

	let plates: FullPlate[];

	if (distinct == 'jurisdictionId') {
		plates = await getPlatePerJurisdiction();
	} else {
		plates = await getFullPlates();
	}

	return {
		status: 200,
		body: plates
	};
}

/** @type {import('./plates/index').RequestHandler} */
export async function post({ locals, body }) {
	if (locals.user?.isAdmin) {
		if (!body.jurisdiction) {
			return {
				status: 400,
				body: { error: `jurisdiction not provided` }
			};
		}

		const plate = await createPlate(body);

		// redirect to the newly created plate
		return {
			status: 200,
			body: plate
		};
	} else {
		return {
			status: 403,
			body: { error: `not admin` }
		};
	}
}
