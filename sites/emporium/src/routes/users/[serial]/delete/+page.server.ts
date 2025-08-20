import { fail, redirect } from '@sveltejs/kit';

import { deleteUser } from '$lib/server/database/users';

import { userIdInputName } from '$lib/forms/user';
import { protectUserOrAdmin } from '$lib/helpers';

import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async (event) => {
	const { user } = await event.parent();

	await protectUserOrAdmin(event.locals.sessionUser, user);

	const canonical = `https://emporium.pierogis.live/users/${event.params.serial}/delete`;
	const title = `delete user: ${user.serial.toUpperCase()}`;
	const description = `delete user: ${user.serial.toUpperCase()} of the emporium`;

	return { canonical, title, description, user };
};

export const actions = {
	default: async (event) => {
		if (event.locals.sessionUser === null) {
			return fail(401, { message: `not signed in` });
		}
		if (
			event.locals.sessionUser?.serial == event.params.serial ||
			event.locals.sessionUser?.isAdmin
		) {
			const formData = await event.request.formData();
			const userId = formData.get(userIdInputName);

			if (!userId) {
				return fail(400, { message: 'userId missing' });
			} else {
				await deleteUser(event.locals.db, parseInt(userId.toString()));
			}

			redirect(303, '/');
		} else {
			return fail(403, { message: `not user ${event.params.serial} or admin` });
		}
	}
};
