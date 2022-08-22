import { parse } from 'cookie';

import type { Handle } from '@sveltejs/kit';

import { variables } from '$lib/env';
import { cache, setupCache } from '$lib/cache';
import { expireSessionCookie, getUserSession } from '$lib/session';

import { getUser } from '$lib/database/users';

export const handle: Handle = async ({ event, resolve }) => {
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
};
