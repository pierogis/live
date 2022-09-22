import { redirect } from '@sveltejs/kit';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent }) => {
	let location = '/login';

	const { sessionUser } = await parent();
	if (sessionUser) {
		location = `/users/${sessionUser.serial}`;
	}

	throw redirect(301, location);
};
