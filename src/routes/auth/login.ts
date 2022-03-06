import { createSessionCookie } from '$lib/session';

/** @type {import('./auth/login').RequestHandler} */
export async function post({ request }: { request: Request }) {
	try {
		const didToken = request.headers['authorization'];

		let user = {};

		const cookie = await createSessionCookie(user);

		return {
			status: 200,
			headers: {
				'set-cookie': cookie
			},
			body: {
				user
			}
		};
	} catch (error) {
		console.error(error);
		return {
			status: 500,
			body: {
				error: {
					message: 'Internal Server Error'
				}
			}
		};
	}
}
