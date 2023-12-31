import { getFullPlates } from '$lib/server/database/plates';

export const load = async () => {
	const plates = await getFullPlates({});

	return {
		plates
	};
};
