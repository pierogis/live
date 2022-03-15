import { getPlates } from '$lib/database/plates';
import { listJurisdictions } from '$lib/database/jurisdictions';
import type { Plate } from '@prisma/client';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get() {
	const jurisdictions = await listJurisdictions();

	const jurisdictionsPlate: { [jurisdiction: string]: Plate } = {};
	for (const jurisdiction of jurisdictions) {
		const jdPlates = await getPlates({ jurisdiction: jurisdiction.abbreviation }, 1);
		if (jdPlates.length > 0) {
			jurisdictionsPlate[jurisdiction.abbreviation] = jdPlates[0];
		}
	}

	return {
		body: { jurisdictionsPlate }
	};
}
