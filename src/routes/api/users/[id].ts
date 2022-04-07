import type { User } from '@prisma/client';
import { getUser, updateUser, deleteUser } from '$lib/database/users';

/** @type {import('./users/[id]').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	const user = await getUser({ id: parseInt(params.id) });

	return {
		body: user
	};
}

/** @type {import('./users/[id]').RequestHandler} */
export async function put({ locals, request, params }) {
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
}

/** @type {import('./users/[id]').RequestHandler} */
export async function del({ params }: { params: { id: string } }) {
	await deleteUser(parseInt(params.id));

	// redirect to the newly created user
	return {
		status: 200
	};
}
