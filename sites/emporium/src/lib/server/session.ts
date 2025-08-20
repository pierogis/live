import type { Cookies } from '@sveltejs/kit';

import { env } from '$env/dynamic/private';

import { encrypt, decrypt } from './encryption';

export async function setSessionCookie(
	cookies: Cookies,
	data: {
		userId: number;
	}
): Promise<void> {
	const sessionCookie = await encrypt(data);

	return cookies.set(env.SESSION_NAME, sessionCookie, {
		maxAge: parseInt(env.SESSION_LENGTH) / 1000, // maxAge is in seconds. Divide by 1000 to convert from milliseconds to seconds.
		expires: new Date(Date.now() + parseInt(env.SESSION_LENGTH)),
		httpOnly: true,
		secure: process.env['NODE_ENV'] === 'production',
		path: '/',
		sameSite: 'lax'
	});
}

export function expireSessionCookie(cookies: Cookies): void {
	return cookies.delete(env.SESSION_NAME, { path: '/' });
}

export async function decryptSessionCookie<T>(cookie: string): Promise<T> {
	return await decrypt(cookie);
}
