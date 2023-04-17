import { fail, redirect } from '@sveltejs/kit';

import { deleteUser } from '$lib/server/database/users';

import { userIdInputName } from '$lib/forms/user';

export const load = async ({ parent }) => {
	const { user } = await parent();

	return { user };
};

export const actions = {
	default: async ({ locals, params, request }) => {
		if (!locals.sessionUser) {
			return fail(401, { message: `not signed in` });
		}
		if (locals.sessionUser?.serial == params.serial || locals.sessionUser?.isAdmin) {
			const formData = await request.formData();
			const userId = formData.get(userIdInputName);

			if (!userId) {
				return fail(400, { message: 'userId missing' });
			} else {
				await deleteUser(parseInt(userId.toString()));
			}

			throw redirect(303, '/');
		} else {
			return fail(403, { message: `not user ${params.serial} or admin` });
		}
	}
};
