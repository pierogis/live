import { getFullPlates } from '$queries';

export const load = async ({ locals }) => {
	const plates = await getFullPlates(locals.db, {});

	return {
		plates
	};
};
