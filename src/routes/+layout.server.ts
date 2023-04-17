import { getJurisdictions } from '$lib/server/database/jurisdictions';

export const load = async ({ locals }) => {
	const { sessionUser } = locals;
	const jurisdictions = await getJurisdictions({});

	return { sessionUser, jurisdictions };
};
