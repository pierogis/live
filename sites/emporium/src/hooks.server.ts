import type { Handle, HandleServerError } from '@sveltejs/kit';

import { SESSION_NAME } from '$env/static/private';
import { env } from '$env/dynamic/private';

import { createD1Client, createLibSqlClient } from '$lib/server/database';
import { decryptSessionCookie } from '$lib/server/session';
import { getUser } from '$lib/server/database/users';

const db = env.DATABASE_URL ? createLibSqlClient(env.DATABASE_URL) : null;

export const handle: Handle = async ({ event, resolve }) => {
	if (event.platform?.env.DB) {
		event.locals.db = createD1Client(event.platform.env.DB);
	} else if (db) {
		event.locals.db = db;
	} else {
		throw new Error('No database found');
	}
	if (!event.platform) {
		throw 'platform not found';
	}
	event.locals.kv_binding = event.platform.env.KV;

	event.locals.sessionUser = null;
	const sessionCookie = event.cookies.get(SESSION_NAME);

	let deleteCookie = false;

	if (sessionCookie) {
		try {
			const { userId } = await decryptSessionCookie<{ userId: number }>(sessionCookie);

			if (userId) {
				const sessionUser = await getUser(event.locals.db, { id: userId });

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
		event.cookies.delete(SESSION_NAME, { path: '/' });
	}

	return await resolve(event);
};

export const handleError: HandleServerError = ({ error }) => {
	if (error instanceof Error) {
		console.error(error);
	}
};
