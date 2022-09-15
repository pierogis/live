import { redirect } from '@sveltejs/kit';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent }) => {
	let location = '/login';

	const { user } = await parent();
	if (user) {
		location = `/users/${user.serial}`;
	}

	throw redirect(301, location);
};
