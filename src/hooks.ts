import { parse } from 'cookie';

import { variables, setupEnv } from '$lib/env';
import { db, setupClient } from '$lib/database/client';
import { deleteSessionCookie, getUserSession } from '$lib/session';
import { setup, setupWords } from '$lib/words';

import { getUser } from '$lib/database/users';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	if (!variables) setupEnv();
	if (!db) setupClient();
	if (!setup) setupWords();

	const cookies = parse(event.request.headers.get('cookie') || '');

	let response;

	try {
		let { userId } = await getUserSession<{ userId: number }>(cookies[variables.sessionName]);

		if (userId) {
			event.locals.user = await getUser({ id: userId });
		}

		response = await resolve(event);

		if (!event.locals.user) {
			const cookie = deleteSessionCookie();
			response.headers.set('set-cookie', cookie);
		}
	} catch {
		response = await resolve(event);
		if (cookies[variables.sessionName]) {
			// set cookie expires now
			const cookie = deleteSessionCookie();
			response.headers.set('set-cookie', cookie);
		}
	}
	return response;
}

/** @type {import('@sveltejs/kit').GetSession} */
export function getSession(event): App.Session {
	return { user: event.locals.user };
}
