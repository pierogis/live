import { error, json } from '@sveltejs/kit';

import { getUser, updateUserById, deleteUser } from '$lib/server/database/users';
import type { User } from '$db/schema';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async (event) => {
	const user = await getUser(event.locals.db, { id: parseInt(event.params.id) });

	if (user) {
		const maskedUser = {
			...user,
			email:
				event.locals.sessionUser?.id != parseInt(event.params.id) &&
				!event.locals.sessionUser?.isAdmin
					? null
					: user.email
		};

		event.setHeaders({
			'cache-control': 'no-cache, max-age=3600'
		});

		return json(maskedUser);
	} else {
		error(404, `user ${event.params.id} not found`);
	}
};

export const PUT: RequestHandler = async (event) => {
	if (event.locals.sessionUser === null) {
		error(401, `not signed in`);
	}
	if (
		event.locals.sessionUser?.id == parseInt(event.params.id) ||
		event.locals.sessionUser?.isAdmin
	) {
		const { serial }: { serial: string } = await event.request.json();

		const data: Partial<Omit<User, 'isAdmin' | 'id'>> = {
			// ...(emailEntry && { email: emailEntry.toString() }),
			...(serial && { serial: serial.toUpperCase() })
		};

		try {
			const user = await updateUserById(event.locals.db, parseInt(event.params.id), data);

			return json(user);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			// TODO: fix this for drizzle
			if (err.code == 23505) {
				error(400, `user with serial ${serial.toUpperCase()} already exists`);
			} else throw err;
		}
	} else {
		error(403, `not user ${event.params.id} or admin`);
	}
};

export const DELETE: RequestHandler = async (event) => {
	if (event.locals.sessionUser === null) {
		error(401, `not signed in`);
	}
	if (
		event.locals.sessionUser?.id == parseInt(event.params.id) ||
		event.locals.sessionUser?.isAdmin
	) {
		const user = await deleteUser(event.locals.db, parseInt(event.params.id));

		return json(user);
	} else {
		error(403, `not user ${event.params.id} or admin`);
	}
};
