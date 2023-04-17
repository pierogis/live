import { redirect } from '@sveltejs/kit';

export const load = async ({ parent }) => {
	let location = '/login';

	const { sessionUser } = await parent();
	if (sessionUser) {
		location = `/users/${sessionUser.serial}`;
	}

	throw redirect(301, location);
};
