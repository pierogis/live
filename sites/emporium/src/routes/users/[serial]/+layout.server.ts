import { error } from '@sveltejs/kit';

import { getUserWithInteractions } from '$lib/server/database/users';

export const load = async (event) => {
	const user = await getUserWithInteractions(event.locals.db, {
		serial: event.params.serial
	});

	if (user === undefined) {
		error(404, "user doesn't exist");
	}

	const sessionUser = event.locals.sessionUser;
	const isUser = sessionUser !== null && sessionUser.id == user.id;
	const isAdmin = sessionUser !== null && sessionUser.isAdmin;

	const maskedUser = {
		...user,
		email: isUser ? sessionUser.email : undefined
	};

	return { user: maskedUser, isUser, isAdmin };
};
