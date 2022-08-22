import { json } from '@sveltejs/kit';

import { getUser } from '$lib/database/users';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ locals, url, setHeaders }) => {
	try {
		const serial = url.searchParams.get('serial');
		if (!serial) {
			return new Response(undefined, { status: 403 });
		}
		const user = await getUser({ serial });

		if (user) {
			if (!locals.user?.isAdmin) {
				user.email = null;
			}

			setHeaders({
				'cache-control': 'public, max-age=3600'
			});

			return json(user, {
				headers: {
					'cache-control': 'no-cache, max-age=3600'
				}
			});
		}
		return new Response(undefined, { status: 404 });
	} catch (err) {
		console.error(err);
		return new Response(undefined, { status: 500 });
	}
};
