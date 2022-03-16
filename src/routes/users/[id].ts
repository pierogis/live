import type { User } from '@prisma/client';
import { getUserWithScores, updateUser, deleteUser } from '$lib/database/users';

/** @type {import('./users/[id]').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	const user = await getUserWithScores({ id: parseInt(params.id) });

	return {
		body: { user }
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
		const formData = await request.formData();

		// const emailEntry = formData.get('email');
		const serialEntry = formData.get('serial');

		let user: Partial<Omit<User, 'isAdmin'>> & Pick<User, 'id'> = {
			id: parseInt(params.id),
			// ...(emailEntry && { email: emailEntry.toString() }),
			...(serialEntry && { serial: serialEntry.toString().toUpperCase() })
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
			status: 303,
			headers: {
				location: `/users/${user.id}`
			}
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
		status: 303,
		headers: {
			location: `/`
		}
	};
}
