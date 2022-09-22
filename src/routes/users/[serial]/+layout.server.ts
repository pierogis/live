import { error } from '@sveltejs/kit';

import { getUser } from '$lib/server/database/users';

import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async ({ params }) => {
	const user = await getUser({ serial: params.serial });

	if (!user) {
		throw error(404, "user doesn't exist");
	}

	return { user };
};
