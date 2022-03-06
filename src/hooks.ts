import cookie from 'cookie';
import { variables } from '$lib/env';
import { getSession } from '$lib/session';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const cookies = cookie.parse(event.request.headers.get('cookie') || '');

	const user = await getSession<User>(cookies[variables.sessionName]);
	event.locals.user = user;

	const response = await resolve(event);

	return response;
}

// /** @type {import('@sveltejs/kit').GetSession} */
// export function getSession(event) {
// 	let user = getSessionUser(event.locals.sessionId);
// 	return event.locals.sessionId
// 		? {
// 				user: {
// 					// only include properties needed client-side —
// 					// exclude anything else attached to the user
// 					// like access tokens etc
// 					id: event.locals.user.id,
// 					name: event.locals.user.name,
// 					email: event.locals.user.email
// 				}
// 		  }
// 		: {};
// }
