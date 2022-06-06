// api/users/[id=integer].ts

import type { User } from '@prisma/client';
import { getUser, updateUser, deleteUser } from '$lib/database/users';

import type { RequestHandler } from './__types/[id=integer]';
export const get: RequestHandler = async ({ locals, params }) => {
	try {
		const user = await getUser({ id: parseInt(params.id) });

		if (user) {
			if (locals.user?.id != parseInt(params.id) && !locals.user?.isAdmin) {
				user.email = null;
			}

			return {
				status: 200,
				headers: {
					'cache-control': 'no-cache, max-age=3600'
				},
				body: user
			};
		} else {
			return {
				status: 404
			};
		}
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
};

/** @type {import('./api/users/[id=integer]').RequestHandler} */
export async function put({ locals, request, params }) {
	try {
		if (!locals.user) {
			// redirect to the updated user
			return {
				status: 401,
				body: { error: `not signed in` }
			};
		}
		if (locals.user?.id == params.id || locals.user?.isAdmin) {
			const json: { serial: string } = await request.json();

			let user: Partial<Omit<User, 'isAdmin'>> & Pick<User, 'id'> = {
				id: parseInt(params.id),
				// ...(emailEntry && { email: emailEntry.toString() }),
				...(json.serial && { serial: json.serial.toUpperCase() })
			};

			try {
				user = await updateUser(user);
			} catch (error) {
				if (error.code == 23505) {
					return {
						status: 400,
						body: { error: `serial ${user.serial} already exists` }
					};
				}
			}

			// redirect to the updated user
			return {
				status: 200,
				body: user
			};
		} else {
			// redirect to the updated user
			return {
				status: 403,
				body: { error: `not user ${params.id} or admin` }
			};
		}
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
}

/** @type {import('./api/users/[id=integer]').RequestHandler} */
export async function del({ locals, params }) {
	try {
		if (!locals.user) {
			// redirect to the updated user
			return {
				status: 401,
				body: { error: `not signed in` }
			};
		}
		if (locals.user?.id == params.id || locals.user?.isAdmin) {
			await deleteUser(parseInt(params.id));

			return {
				status: 200
			};
		} else {
			// redirect to the updated user
			return {
				status: 403,
				body: { error: `not user ${params.id} or admin` }
			};
		}
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
}
