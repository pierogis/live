import { redirect } from '@sveltejs/kit';

export const load = async () => {
	const location = '/plates';

	throw redirect(301, location);
};
