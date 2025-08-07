import { error, json } from '@sveltejs/kit';

import { getUser, updateUserById, deleteUser } from '$lib/server/database/users';
import type { User } from '$db/schema';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ locals, params, setHeaders }) => {
	const user = await getUser({ id: parseInt(params.id) });

	if (user) {
		const maskedUser = {
			...user,
			email:
				locals.sessionUser?.id != parseInt(params.id) && !locals.sessionUser?.isAdmin
					? null
					: user.email
		};

		setHeaders({
			'cache-control': 'no-cache, max-age=3600'
		});

		return json(maskedUser);
	} else {
		error(404, `user ${params.id} not found`);
	}
};

export const PUT: RequestHandler = async ({ locals, request, params }) => {
	if (locals.sessionUser === null) {
		error(401, `not signed in`);
	}
	if (locals.sessionUser?.id == parseInt(params.id) || locals.sessionUser?.isAdmin) {
		const { serial }: { serial: string } = await request.json();

		const data: Partial<Omit<User, 'isAdmin' | 'id'>> = {
			// ...(emailEntry && { email: emailEntry.toString() }),
			...(serial && { serial: serial.toUpperCase() })
		};

		try {
			const user = await updateUserById(parseInt(params.id), data);

			return json(user);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			// TODO: fix this for drizzle
			if (err.code == 23505) {
				error(400, `user with serial ${serial.toUpperCase()} already exists`);
			} else throw err;
		}
	} else {
		error(403, `not user ${params.id} or admin`);
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (locals.sessionUser === null) {
		error(401, `not signed in`);
	}
	if (locals.sessionUser?.id == parseInt(params.id) || locals.sessionUser?.isAdmin) {
		const user = await deleteUser(parseInt(params.id));

		return json(user);
	} else {
		error(403, `not user ${params.id} or admin`);
	}
};
