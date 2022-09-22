import { getJurisdictions } from '$lib/server/database/jurisdictions';

import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async ({ locals }) => {
	const { sessionUser } = locals;
	const jurisdictions = await getJurisdictions({});

	return { sessionUser, jurisdictions };
};
