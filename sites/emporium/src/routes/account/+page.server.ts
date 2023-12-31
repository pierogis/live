import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	if (event.locals.sessionUser !== null) {
		throw redirect(301, `/users/${event.locals.sessionUser.serial}`);
	} else {
		throw redirect(301, '/login');
	}
};
