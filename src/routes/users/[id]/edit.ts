// users/[id]/edit.ts

import type { User } from '@prisma/client';

/** @type {import('./users/[id]').RequestHandler} */
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

		let data: Pick<User, 'serial'> = {
			// ...(emailEntry && { email: emailEntry.toString() }),
			...(serialEntry && { serial: serialEntry.toString().toUpperCase() })
		};
		const response = await fetch('/users/${params.id}', {
			body: JSON.stringify(data),
			method: 'put',
			headers: {
				'Content-Type': 'application/json'
			}
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
