import { redirect } from '@sveltejs/kit';

import { browser } from '$app/env';
import { goto } from '$app/navigation';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent }) => {
	let location = '/login';

	const { user } = await parent();
	if (user) {
		location = `/users/${user.serial}`;
	}

	// TODO: temporary workaround https://github.com/sveltejs/kit/issues/5952
	if (browser) return await goto(location);
	else throw redirect(301, location);
};
