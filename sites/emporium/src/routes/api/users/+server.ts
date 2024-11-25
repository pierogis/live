import { error, json } from '@sveltejs/kit';

import { getUser } from '$queries';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ url, locals, setHeaders }) => {
	const serial = url.searchParams.get('serial');
	if (!serial) {
		error(403, 'user serial param not provided');
	}
	const user = await getUser(locals.db, { serial });

	if (user) {
		const maskedUser = {
			...user,
			email: !locals.sessionUser?.isAdmin ? null : user.email
		};

		setHeaders({
			'cache-control': 'public, max-age=3600'
		});

		return json(maskedUser);
	}
	error(404, `user with serial ${serial} not found`);
};
