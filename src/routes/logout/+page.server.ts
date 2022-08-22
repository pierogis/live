import { expireSessionCookie } from '$lib/session';

import type { PageServerLoad } from './$types';
export const POST: PageServerLoad = async ({ setHeaders }) => {
	const cookie = expireSessionCookie();

	setHeaders({ 'set-cookie': cookie });

	return {
		status: 301,
		location: '/'
	};
};
