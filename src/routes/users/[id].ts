import type { User } from '$lib/database/models';
import { getUser, updateUser, deleteUser } from '$lib/database/users';

/** @type {import('./users/[id]').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	const user = await getUser({ id: parseInt(params.id) });

	return {
		body: { user }
	};
}

/** @type {import('./users/[id]').RequestHandler} */
export async function put({ request, params }: { request: Request; params: { id: string } }) {
	const formData = await request.formData();

	const emailEntry = formData.get('email');
	const serialEntry = formData.get('serial');

	let user: Partial<Omit<User, 'isAdmin'>> & Pick<User, 'id'> = {
		id: parseInt(params.id),
		...(emailEntry && { email: emailEntry.toString() }),
		...(serialEntry && { serial: serialEntry.toString().toUpperCase() })
	};

	user = await updateUser(user);

	// redirect to the newly created user
	return {
		status: 303,
		headers: {
			location: `/users/${user.id}`
		}
	};
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
