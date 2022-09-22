import { error, json } from '@sveltejs/kit';

import { getUser } from '$lib/server/database/users';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ locals, url, setHeaders }) => {
	const serial = url.searchParams.get('serial');
	if (!serial) {
		throw error(403, 'user serial param not provided');
	}
	const user = await getUser({ serial });

	if (user) {
		if (!locals.sessionUser?.isAdmin) {
			user.email = null;
		}

		setHeaders({
			'cache-control': 'public, max-age=3600'
		});

		return json(user);
	}
	throw error(404, `user with serial ${serial} not found`);
};
