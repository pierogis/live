import { getPlatePerJurisdiction } from '$lib/server/database/plates';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async () => {
	const plates = getPlatePerJurisdiction();

	return { plates };
};
