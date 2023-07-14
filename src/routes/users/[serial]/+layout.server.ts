import { error } from '@sveltejs/kit';

import { getUser } from '$lib/server/database/users';

export const load = async ({ params, parent }) => {
	const user = await getUser({ serial: params.serial });

	if (!user) {
		throw error(404, "user doesn't exist");
	}

	const { sessionUser } = await parent();

	const isUser = sessionUser !== null && sessionUser.id == user.id;
	const isAdmin = sessionUser !== null && sessionUser.isAdmin;
	user.email = isUser ? sessionUser.email : undefined;

	return { user, isUser, isAdmin };
};
