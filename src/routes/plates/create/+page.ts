import { PUBLIC_API_BASE } from '$env/static/public';
import { protect } from '$lib/helpers';
import type { Jurisdiction } from '@prisma/client';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent, fetch }) => {
	async function handle() {
		const response = await fetch(`${PUBLIC_API_BASE}/jurisdictions`);

		const jurisdictions: Jurisdiction[] = await response.json();

		return {
			jurisdictions
		};
	}

	const { user } = await parent();

	return protect(user, handle);
};
