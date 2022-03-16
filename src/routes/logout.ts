import { expireSessionCookie } from '$lib/session';

/** @type {import('./logout').RequestHandler} */
export async function post() {
	const cookie = expireSessionCookie();
	return {
		status: 301,
		headers: { 'set-cookie': cookie, location: '/' },
		body: {
			message: 'Signed out'
		}
	};
}
