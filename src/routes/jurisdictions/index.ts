import * as db from '$lib/database';
import type { Plate } from '$lib/models';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get() {
	const plates = await db.listPlates();

	const jurisdictionsPlate: { [jurisdiction: string]: Plate } = {};
	for (const plate of plates) {
		if (!(plate.jurisdiction in jurisdictionsPlate)) {
			jurisdictionsPlate[plate.jurisdiction] = await db.get({ jurisdiction: plate.jurisdiction });
		}
	}

	return {
		body: { jurisdictions: jurisdictionsPlate }
	};
}
