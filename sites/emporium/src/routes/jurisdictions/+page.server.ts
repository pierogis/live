import { getPlatePerJurisdiction } from '$lib/server/database/plates';

export const load = async () => {
	const plates = await getPlatePerJurisdiction();

	return { plates };
};
