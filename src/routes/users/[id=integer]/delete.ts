// users/[id=integer]/delete.ts

import { PUBLIC_API_BASE } from '$env/static/public';

import type { RequestHandler } from './__types/delete';
export const POST: RequestHandler = async ({ locals, request, params }) => {
	if (!locals.user) {
		return {
			status: 401,
			body: { error: `not signed in` }
		};
	}
	if (locals.user?.id == parseInt(params.id) || locals.user?.isAdmin) {
		const apiUrl = `${PUBLIC_API_BASE}/users/${params.id}`;
		const response = await fetch(apiUrl, {
			method: 'delete',
			headers: { 'content-type': 'application/json', cookie: request.headers.get('cookie') }
		});

		if (response.status == 200) {
			// redirect to the updated user
			return {
				status: 303,
				headers: {
					location: `/`
				}
			};
		} else {
			const error = await response.json();

			return {
				status: 400,
				body: { error }
			};
		}
	} else {
		// redirect to the updated user
		return {
			status: 403,
			body: { error: `not user ${params.id} or admin` }
		};
	}
};
