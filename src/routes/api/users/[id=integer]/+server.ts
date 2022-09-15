import { error, json } from '@sveltejs/kit';

import type { User } from '@prisma/client';
import { getUser, updateUser, deleteUser } from '$lib/server/database/users';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ locals, params, setHeaders }) => {
	const user = await getUser({ id: parseInt(params.id) });

	if (user) {
		if (locals.user?.id != parseInt(params.id) && !locals.user?.isAdmin) {
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
	if (!locals.user) {
		throw error(401, `not signed in`);
	}
	if (locals.user?.id == parseInt(params.id) || locals.user?.isAdmin) {
		const { serial }: { serial: string } = await request.json();

		let user: Partial<Omit<User, 'isAdmin'>> & Pick<User, 'id'> = {
			id: parseInt(params.id),
			// ...(emailEntry && { email: emailEntry.toString() }),
			...(serial && { serial: serial.toUpperCase() })
		};

		try {
			user = await updateUser(user);
		} catch (err) {
			if (err.code == 23505) {
				throw error(400, `serial ${user.serial} already exists`);
			} else throw err;
		}

		return json(user);
	} else {
		throw error(401, `not user ${params.id} or admin`);
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		throw error(401, `not signed in`);
	}
	if (locals.user?.id == parseInt(params.id) || locals.user?.isAdmin) {
		const user = await deleteUser(parseInt(params.id));

		return json(user);
	} else {
		throw error(403, `not user ${params.id} or admin`);
	}
};
