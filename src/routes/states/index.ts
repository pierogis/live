import * as db from '$lib/database';
import type { Plate } from '$lib/plates';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get() {
	const plates = await db.list();

	let statesPlate: { [state: string]: Plate } = {};
	for (const plate of plates) {
		if (!(plate.state in statesPlate)) {
			statesPlate[plate.state] = await db.get({ state: plate.state });
		}
	}

	return {
		body: { states: statesPlate }
	};
}
