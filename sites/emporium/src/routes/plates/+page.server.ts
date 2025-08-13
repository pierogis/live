import { getFullPlates } from '$lib/server/database/plates';

export const load = async (event) => {
	const plates = await getFullPlates(event.locals.db, {});

	return {
		plates
	};
};
