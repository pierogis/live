import { error, json } from '@sveltejs/kit';

import type { User } from '@prisma/client';
import { getUser, updateUserById, deleteUser } from '$lib/server/database/users';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ locals, params, setHeaders }) => {
	const user = await getUser({ id: parseInt(params.id) });

	if (user) {
		if (locals.sessionUser?.id != parseInt(params.id) && !locals.sessionUser?.isAdmin) {
			user.email = null;
		}

		setHeaders({
			'cache-control': 'no-cache, max-age=3600'
		});

		return json(user);
	} else {
		throw error(404, `user ${params.id} not found`);
	}
};

export const PUT: RequestHandler = async ({ locals, request, params }) => {
	if (!locals.sessionUser) {
		throw error(401, `not signed in`);
	}
	if (locals.sessionUser?.id == parseInt(params.id) || locals.sessionUser?.isAdmin) {
		const { serial }: { serial: string } = await request.json();

		let data: Partial<Omit<User, 'isAdmin' | 'id'>> = {
			// ...(emailEntry && { email: emailEntry.toString() }),
			...(serial && { serial: serial.toUpperCase() })
		};

		try {
			const user = await updateUserById(parseInt(params.id), data);

			return json(user);
		} catch (err) {
			if (err.code == 23505) {
				throw error(400, `user with serial ${serial.toUpperCase()} already exists`);
			} else throw err;
		}
	} else {
		throw error(403, `not user ${params.id} or admin`);
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.sessionUser) {
		throw error(401, `not signed in`);
	}
	if (locals.sessionUser?.id == parseInt(params.id) || locals.sessionUser?.isAdmin) {
		const user = await deleteUser(parseInt(params.id));

		return json(user);
	} else {
		throw error(403, `not user ${params.id} or admin`);
	}
};
