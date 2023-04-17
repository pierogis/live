import { protectAdmin } from '$lib/helpers';

export const load = async ({ parent }) => {
	const { sessionUser } = await parent();

	return await protectAdmin(sessionUser);
};
