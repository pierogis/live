import { serialize } from 'cookie';
import { variables } from '$lib/env';
import Iron from '@hapi/iron';

async function encrypt(data): Promise<string> {
	return data && Iron.seal(data, variables.encryptionSecret, Iron.defaults);
}

async function decrypt<T>(data: string): Promise<T> {
	return data && Iron.unseal(data, variables.encryptionSecret, Iron.defaults);
}

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

export function deleteSessionCookie(): Promise<string> {
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

export function removeSessionCookie(): string {
	return serialize(variables.sessionName, '', {
		maxAge: -1,
		path: '/'
	});
}
