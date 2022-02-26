import { type Plate, listPlates, getPlates } from '$lib/database/plate';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get() {
	const plates = await listPlates();

	const jurisdictionsPlate: { [jurisdiction: string]: Plate } = {};
	for (const plate of plates) {
		if (!(plate.jurisdiction in jurisdictionsPlate)) {
			let jdPlates = await getPlates({ jurisdiction: plate.jurisdiction }, 1);
			jurisdictionsPlate[plate.jurisdiction] = jdPlates[0];
		}
	}

	return {
		body: { jurisdictions: jurisdictionsPlate }
	};
}
