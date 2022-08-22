import { json } from '@sveltejs/kit';

import type { User } from '@prisma/client';
import { getUser, updateUser, deleteUser } from '$lib/database/users';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ locals, params, setHeaders }) => {
	try {
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
			return new Response(undefined, { status: 404 });
		}
	} catch (err) {
		console.error(err);
		return new Response(undefined, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ locals, request, params }) => {
	try {
		if (!locals.user) {
			return json(
				{ error: `not signed in` },
				{
					status: 401
				}
			);
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
			} catch (error) {
				if (error.code == 23505) {
					return json(
						{ error: `serial ${user.serial} already exists` },
						{
							status: 400
						}
					);
				}
			}

			return json(user);
		} else {
			return json(
				{ error: `not user ${params.id} or admin` },
				{
					status: 403
				}
			);
		}
	} catch (err) {
		console.error(err);
		return new Response(undefined, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	try {
		if (!locals.user) {
			return json(
				{ error: `not signed in` },
				{
					status: 401
				}
			);
		}
		if (locals.user?.id == parseInt(params.id) || locals.user?.isAdmin) {
			await deleteUser(parseInt(params.id));

			return new Response(undefined);
		} else {
			return json(
				{ error: `not user ${params.id} or admin` },
				{
					status: 403
				}
			);
		}
	} catch (err) {
		console.error(err);
		return new Response(undefined, { status: 500 });
	}
};
