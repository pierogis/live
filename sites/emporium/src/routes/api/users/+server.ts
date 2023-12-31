import { error, json } from '@sveltejs/kit';

import { getUser } from '$lib/server/database/users';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async (event) => {
	const serial = event.url.searchParams.get('serial');
	if (!serial) {
		error(403, 'user serial param not provided');
	}
	const user = await getUser({ serial });

	if (user) {
		const maskedUser = {
			...user,
			email: !event.locals.sessionUser?.isAdmin ? null : user.email
		};

		event.setHeaders({
			'cache-control': 'public, max-age=3600'
		});

		return json(maskedUser);
	}
	error(404, `user with serial ${serial} not found`);
};
