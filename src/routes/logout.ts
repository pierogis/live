import { deleteSessionCookie } from '$lib/session';

/** @type {import('./logout').RequestHandler} */
export async function post({}) {
	const cookie = deleteSessionCookie();
	return {
		status: 301,
		headers: { 'set-cookie': cookie, location: '/' },
		body: {
			message: 'Signed out'
		}
	};
}
