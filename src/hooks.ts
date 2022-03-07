import { parse } from 'cookie';
import { variables } from '$lib/env';
import { deleteSessionCookie, getUserSession } from '$lib/session';
import { getUser } from '$lib/database/users';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
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
