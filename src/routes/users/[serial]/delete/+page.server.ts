import { invalid, redirect } from '@sveltejs/kit';

import { deleteUser } from '$lib/server/database/users';

import { userIdInputName } from '$lib/forms/user';

import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	return { user };
};

export const actions: Actions = {
	default: async ({ locals, params, request }) => {
		if (!locals.sessionUser) {
			return invalid(401, { message: `not signed in` });
		}
		if (locals.sessionUser?.serial == params.serial || locals.sessionUser?.isAdmin) {
			const formData = await request.formData();
			const userId = formData.get(userIdInputName);

			if (!userId) {
				return invalid(400, { message: 'userId missing' });
			} else {
				await deleteUser(parseInt(userId.toString()));
			}

			throw redirect(300, '/');
		} else {
			return invalid(403, { message: `not user ${params.serial} or admin` });
		}
	}
};
