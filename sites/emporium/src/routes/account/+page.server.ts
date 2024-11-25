import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (locals.sessionUser !== null) {
		redirect(301, `/users/${locals.sessionUser.serial}`);
	} else {
		redirect(301, '/login');
	}
};
