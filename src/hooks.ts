import { getSessionUser } from '$lib/database/users';

import type { RequestEvent } from '@sveltejs/kit';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	console.log(event.request.headers.get('cookie'));
	event.locals.user = await getSessionUser(event.request.headers.get('cookie'));

	console.log(event.locals);

	const response = await resolve(event);
	return response;
}

/** @type {import('@sveltejs/kit').GetSession} */
export function getSession(event: RequestEvent) {
	return event.locals.user
		? {
				user: {
					// only include properties needed client-side —
					// exclude anything else attached to the user
					// like access tokens etc
					id: event.locals.user.id,
					name: event.locals.user.name,
					email: event.locals.user.email
				}
		  }
		: {};
}
