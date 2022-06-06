import { parse } from 'cookie';

import type { RequestEvent } from '@sveltejs/kit';

import { variables, setupEnv } from '$lib/env';
import { cache, setupCache } from '$lib/cache';
import { expireSessionCookie, getUserSession } from '$lib/session';

import { getUser } from '$lib/database/users';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	if (!variables) setupEnv();
	if (!cache) setupCache();

	const cookies = parse(event.request.headers.get('cookie') || '');

	let deleteCookie = false;

	if (variables.sessionName in cookies) {
		try {
			const { userId } = await getUserSession<{ userId: number }>(cookies[variables.sessionName]);

			if (userId) {
				const user = await getUser({ id: userId });

				if (!user) {
					throw 'Cookie user not in database';
				}
				event.locals.user = user;
			}
		} catch {
			deleteCookie = true;
		}
	}

	const response = await resolve(event);

	if (deleteCookie) {
		const cookie = expireSessionCookie();
		response.headers.set('set-cookie', cookie);
	}

	return response;
}

/** @type {import('@sveltejs/kit').GetSession} */
export function getSession(event: RequestEvent): App.Session {
	return { user: event.locals.user };
}
