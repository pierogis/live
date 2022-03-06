import { parse } from 'cookie';
import { variables } from '$lib/env';
import { deleteSessionCookie, getUserSession } from '$lib/session';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const cookies = parse(event.request.headers.get('cookie') || '');

	try {
		const user = await getUserSession<User>(cookies[variables.sessionName]);
		event.locals.user = user;

		const response = await resolve(event);
		return response;
	} catch {
		const response = await resolve(event);
		if (cookies[variables.sessionName]) {
			// set cookie expires now
			const cookie = deleteSessionCookie();
			response['set-cookie'] = cookie;
		}

		return response;
	}
}

/** @type {import('@sveltejs/kit').GetSession} */
export function getSession(event) {
	return { user: event.locals.user };
}
