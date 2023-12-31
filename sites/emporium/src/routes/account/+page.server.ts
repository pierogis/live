import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	if (event.locals.sessionUser !== null) {
		redirect(301, `/users/${event.locals.sessionUser.serial}`);
	} else {
		redirect(301, '/login');
	}
};
