import { getPlatePerJurisdiction } from '$queries';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const plates = await getPlatePerJurisdiction(locals.db);

	const canonical = `https://emporium.pierogis.live/jurisdictions`;
	const title = `jurisdictions`;
	const description = `plates by jurisdiction`;

	return { canonical, title, description, plates };
};
