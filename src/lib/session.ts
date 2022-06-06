import { serialize } from 'cookie';

import { variables } from '$lib/env';
import { encrypt, decrypt } from './encryption';

export async function createSessionCookie(data: { userId: number }): Promise<string> {
	const session = await encrypt(data);

	return serialize(variables.sessionName, session, {
		maxAge: variables.sessionLength / 1000, // maxAge is in seconds. Divide by 1000 to convert from milliseconds to seconds.
		expires: new Date(Date.now() + variables.sessionLength),
		httpOnly: true,
		secure: process.env['NODE_ENV'] === 'production',
		path: '/',
		sameSite: 'lax'
	});
}

export function expireSessionCookie(): string {
	return serialize(variables.sessionName, '', {
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
