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

	try {
		event.locals =
			(await getUserSession<App.Locals>(cookies[variables.sessionName])) || event.locals;

		const response = await resolve(event);
		return response;
	} catch {
		const response = await resolve(event);
		if (cookies[variables.sessionName]) {
			// set cookie expires now
			const cookie = deleteSessionCookie();
			response.headers.set('set-cookie', cookie);
		}

		return response;
	}
}

/** @type {import('@sveltejs/kit').GetSession} */
export async function getSession(event): Promise<App.Session> {
	let user = event.locals.userId ? await getUser({ id: event.locals.userId }) : null;

	return { user };
}
