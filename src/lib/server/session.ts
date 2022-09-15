import type { Cookies } from '@sveltejs/kit';

import { SESSION_LENGTH, SESSION_NAME } from '$env/static/private';

import { encrypt, decrypt } from './encryption';

export async function setSessionCookie(
	cookies: Cookies,
	data: {
		userId: number;
	}
): Promise<void> {
	const sessionCookie = await encrypt(data);

	return cookies.set(SESSION_NAME, sessionCookie, {
		maxAge: parseInt(SESSION_LENGTH) / 1000, // maxAge is in seconds. Divide by 1000 to convert from milliseconds to seconds.
		expires: new Date(Date.now() + parseInt(SESSION_LENGTH)),
		httpOnly: true,
		secure: process.env['NODE_ENV'] === 'production',
		path: '/',
		sameSite: 'lax'
	});
}

export function expireSessionCookie(cookies: Cookies): void {
	return cookies.set(SESSION_NAME, '', {
		expires: new Date(0),
		httpOnly: true,
		secure: process.env['NODE_ENV'] === 'production',
		path: '/',
		sameSite: 'lax'
	});
}

export async function getUserSession<T>(cookie: string): Promise<T> {
	return await decrypt(cookie);
}
