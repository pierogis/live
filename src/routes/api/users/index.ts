// api/users/index.ts

import { getUser } from '$lib/database/users';

import type { RequestHandler } from './__types';
export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		const serial = url.searchParams.get('serial');
		if (!serial) {
			return {
				status: 403
			};
		}
		const user = await getUser({ serial });

		if (user) {
			if (!locals.user?.isAdmin) {
				user.email = null;
			}

			return {
				status: 200,
				headers: {
					'cache-control': 'no-cache, max-age=3600'
				},
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
};
