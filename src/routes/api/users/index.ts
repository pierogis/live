// api/users/index.ts

import { getUser } from '$lib/database/users';

/** @type {import('./api/users/index').RequestHandler} */
export async function get({ params, locals, url }) {
	try {
		const serial = url.searchParams.get('serial');
		if (!serial) {
			return {
				status: 403
			};
		}
		const user = await getUser({ serial });

		if (user) {
			if (locals.user?.id != params.id && !locals.user?.isAdmin) {
				user.email = null;
			}

			return {
				body: user
			};
		}
		return {
			status: 404
		};
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
}
