// users/[id=integer]/edit.ts

import { variables } from '$lib/env';
import type { User } from '@prisma/client';

/** @type {import('./users/[id=integer]/edit').RequestHandler} */
export async function post({ locals, request, params }) {
	if (!locals.user) {
		return {
			status: 401,
			body: { error: `not signed in` }
		};
	}
	if (locals.user?.id == params.id || locals.user?.isAdmin) {
		const formData = await request.formData();

		// const emailEntry = formData.get('email');
		const serialEntry = formData.get('serial');

		const data: Pick<User, 'serial'> = {
			// ...(emailEntry && { email: emailEntry.toString() }),
			...(serialEntry && { serial: serialEntry.toString().toUpperCase() })
		};

		const apiUrl = `${variables.apiBase}/users/${params.id}`;
		const response = await fetch(apiUrl, {
			body: JSON.stringify(data),
			method: 'put',
			headers: { 'content-type': 'application/json', cookie: request.headers.get('cookie') }
		});

		if (response.status == 200) {
			const user: User = await response.json();

			// redirect to the updated user
			return {
				status: 303,
				headers: {
					location: `/users/${user.id}`
				}
			};
		} else {
			const error = await response.json();

			return {
				status: 400,
				body: error
			};
		}
	} else {
		// redirect to the updated user
		return {
			status: 403,
			body: { error: `not user ${params.id} or admin` }
		};
	}
}
