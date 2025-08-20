import { getPlatePerJurisdiction } from '$lib/server/database/plates';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const canonical = `https://emporium.pierogis.live/jurisdictions`;
	const title = `jurisdictions`;
	const description = `plates by jurisdiction`;

	const plates = await getPlatePerJurisdiction(event.locals.db);

	return { canonical, title, description, plates };
};
