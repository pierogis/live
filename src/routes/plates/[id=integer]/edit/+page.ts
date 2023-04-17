import { protect } from '$lib/helpers';

export const load = async ({ parent }) => {
	async function handler() {
		const { plate, jurisdictions } = await parent();

		return {
			plate,
			jurisdictions
		};
	}

	const { sessionUser } = await parent();

	return await protect(sessionUser, handler);
};
