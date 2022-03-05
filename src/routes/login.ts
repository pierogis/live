import { createSession } from '$lib/database/users';
import { serialize } from 'cookie';

/** @type {import('./[login]').RequestHandler} */
export async function post() {
	const uuid = createSession({ id: 0, name: 'karl' });

	return {
		status: 201,
		headers: {
			'Set-Cookie': serialize('session_id', uuid, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 7 // one week
			})
		},
		body: {
			message: 'Successfully signed in'
		}
	};
}
