import { PUBLIC_API_BASE } from '$env/static/public';
import { protect } from '$lib/helpers';

import type { Jurisdiction } from '@prisma/client';
import type { FullPlate } from '$lib/database/models';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent, params, fetch }) => {
	async function handler() {
		const plateResponse = await fetch(`${PUBLIC_API_BASE}/plates/${params.id}`);

		if (plateResponse.status == 404) {
			return { status: 404, error: "plate doesn't exist" };
		}

		const plate: FullPlate = await plateResponse.json();

		const jurisdictionsResponse = await fetch(`${PUBLIC_API_BASE}/jurisdictions`);
		const jurisdictions: Jurisdiction[] = await jurisdictionsResponse.json();

		return {
			plate,
			jurisdictions
		};
	}

	const { user } = await parent();

	return await protect(user, handler);
};
