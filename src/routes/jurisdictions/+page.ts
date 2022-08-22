import { PUBLIC_API_BASE } from '$env/static/public';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ fetch }) => {
	const request = await fetch(`${PUBLIC_API_BASE}/plates?distinct=jurisdictionId`);

	const plates = await request.json();

	return { plates };
};
