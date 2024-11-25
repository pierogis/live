import { error } from '@sveltejs/kit';

import { getUserWithInteractions } from '$queries';

export const load = async ({ locals, params }) => {
	const user = await getUserWithInteractions(locals.db, { serial: params.serial });

	if (user === undefined) {
		error(404, "user doesn't exist");
	}

	const sessionUser = locals.sessionUser;
	const isUser = sessionUser !== null && sessionUser.id == user.id;
	const isAdmin = sessionUser !== null && sessionUser.isAdmin;

	const maskedUser = {
		...user,
		email: isUser ? sessionUser.email : undefined
	};

	return { user: maskedUser, isUser, isAdmin };
};
