import cookie from 'cookie';
import { variables } from '$lib/env';
import { getUserSession } from '$lib/session';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const cookies = cookie.parse(event.request.headers.get('cookie') || '');

	const user = await getUserSession<User>(cookies[variables.sessionName]);
	event.locals.user = user;

	const response = await resolve(event);

	return response;
}

/** @type {import('@sveltejs/kit').GetSession} */
export function getSession(event) {
	return { user: event.locals.user };
}
