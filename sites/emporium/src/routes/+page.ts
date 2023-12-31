import { redirect } from '@sveltejs/kit';

export const load = async () => {
	const location = '/plates';

	redirect(301, location);
};
