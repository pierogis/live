import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	let location = '/login';

	const { sessionUser } = await event.parent();
	if (sessionUser !== null) {
		location = `/users/${sessionUser.serial}`;
	}

	throw redirect(301, location);
};
