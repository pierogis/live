import { expireSessionCookie } from '$lib/session';

import type { RequestHandler } from './__types/logout';
export const post: RequestHandler = async () => {
	const cookie = expireSessionCookie();
	return {
		status: 301,
		headers: { 'set-cookie': cookie, location: '/' },
		body: {
			message: 'signed out'
		}
	};
};
