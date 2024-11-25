import type { Handle, HandleServerError } from '@sveltejs/kit';

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import { SESSION_NAME, DATABASE_URL } from '$env/static/private';

import { decryptSessionCookie } from '$lib/server/session';
import * as schema from '$db/schema';
import { getUser } from '$queries';

export const handle: Handle = async ({ event, resolve }) => {
	const client = postgres(DATABASE_URL);
	event.locals.db = drizzle(client, { schema });

	event.locals.kv = event.platform!.env.KV;

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
