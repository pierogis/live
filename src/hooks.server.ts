import type { Handle, HandleServerError } from '@sveltejs/kit';

import { SESSION_NAME } from '$env/static/private';

import { cache, setupCache } from '$lib/server/cache';

import { decryptSessionCookie } from '$lib/server/session';
import { getSessionUser } from '$lib/server/database/users';

export const handle: Handle = async ({ event, resolve }) => {
	if (!cache) setupCache();

	event.locals.sessionUser = null;
	const sessionCookie = event.cookies.get(SESSION_NAME);

	let deleteCookie = false;

	if (sessionCookie) {
		try {
			const { userId } = await decryptSessionCookie<{ userId: number }>(sessionCookie);

			if (userId) {
				const sessionUser = await getSessionUser({ id: userId });

				if (!sessionUser) {
					throw 'cookie user not in database';
				}
				event.locals.sessionUser = sessionUser;
			}
		} catch {
			deleteCookie = true;
		}
	}

	if (deleteCookie) {
		event.cookies.delete(SESSION_NAME);
	}

	return await resolve(event);
};

export const handleError: HandleServerError = ({ error }) => {
	if (error instanceof Error) {
		console.error(error);
	}
};
