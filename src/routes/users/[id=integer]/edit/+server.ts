import { error, json, redirect } from '@sveltejs/kit';

import { PUBLIC_API_BASE } from '$env/static/public';
import type { User } from '@prisma/client';

import type { RequestHandler } from './$types';
export const POST: RequestHandler = async ({ locals, request, params }) => {
	if (!locals.user) {
		return json(
			{ error: `not signed in` },
			{
				status: 401
			}
		);
	}
	if (locals.user?.id == parseInt(params.id) || locals.user?.isAdmin) {
		const formData = await request.formData();

		// const emailEntry = formData.get('email');
		const serialEntry = formData.get('serial');

		const data: Pick<User, 'serial'> = {
			// ...(emailEntry && { email: emailEntry.toString() }),
			...(serialEntry && { serial: serialEntry.toString().toUpperCase() })
		};

		const apiUrl = `${PUBLIC_API_BASE}/users/${params.id}`;
		const response = await fetch(apiUrl, {
			body: JSON.stringify(data),
			method: 'put',
			headers: {
				'content-type': 'application/json',
				cookie: request.headers.get('cookie')
			}
		});

		if (response.status == 200) {
			const user: User = await response.json();

			// redirect to the updated user
			throw redirect(303, `/users/${user.serial}`);
		} else {
			const err = await response.json();

			throw error(400, err);
		}
	} else {
		throw error(403, `not user ${params.id} or admin`);
	}
};
