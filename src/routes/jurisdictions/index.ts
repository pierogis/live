import { listPlates, getPlates } from '$lib/database/plates';
import type { Plate } from '$lib/database/models';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get() {
	const plates = await listPlates();

	const jurisdictionsPlate: { [jurisdiction: string]: Plate } = {};
	for (const plate of plates) {
		if (!(plate.jurisdiction in jurisdictionsPlate)) {
			const jdPlates = await getPlates({ jurisdiction: plate.jurisdiction }, 1);
			jurisdictionsPlate[plate.jurisdiction] = jdPlates[0];
		}
	}

	return {
		body: { jurisdictions: jurisdictionsPlate }
	};
}
