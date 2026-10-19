import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';

import { env as cloudflare } from 'cloudflare:workers';

import { SESSION_NAME } from '$app/env/private';

import { createD1Client } from '#lib/server/database/index.js';
import { decryptSessionCookie } from '#lib/server/session.js';
import { getUser } from '#lib/server/database/users.js';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.db = createD1Client(cloudflare.DB);
	event.locals.kv_binding = cloudflare.KV;

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

export const handleError: HandleServerError = ({ kind, error }) => {
	if (kind === 'unknown') {
		console.error(error);
	}
};
