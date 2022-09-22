import { protect } from '$lib/helpers';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent }) => {
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
