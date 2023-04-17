import type { Handle, HandleServerError } from '@sveltejs/kit';

import { SESSION_NAME } from '$env/static/private';

import { cache, setupCache } from '$lib/server/cache';
import { getUserSession } from '$lib/server/session';

import { getUser } from '$lib/server/database/users';

export const handle: Handle = async ({ event, resolve }) => {
	if (!cache) setupCache();

	const sessionCookie = event.cookies.get(SESSION_NAME);

	let deleteCookie = false;

	if (sessionCookie) {
		try {
			const { userId } = await getUserSession<{ userId: number }>(sessionCookie);

			if (userId) {
				const user = await getUser({ id: userId });

				if (!user) {
					throw 'cookie user not in database';
				}
				event.locals.sessionUser = user;
			}
		} catch {
			deleteCookie = true;
		}
	}

	if (deleteCookie) {
		event.cookies.delete(SESSION_NAME);
	}

	const response = await resolve(event);

	return response;
};

export const handleError: HandleServerError = ({ error }) => {
	if (error instanceof Error) {
		console.error(error);
	}
};
