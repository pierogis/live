import { error, fail, redirect } from '@sveltejs/kit';

import { superValidate } from 'sveltekit-superforms/client';

import type { Category } from '$db/schema';
import { getCategories } from '$lib/server/database/categories';
import { updateUserBySerial } from '$lib/server/database/users';
import { userSchema } from '$lib/forms/user';

export const load = async () => {
	const categories: Category[] = await getCategories({ ware: 'plate' });

	return { categories };
};

export const actions = {
	default: async (event) => {
		if (event.locals.sessionUser === null) {
			throw error(401, `not signed in`);
		}
		if (
			event.locals.sessionUser.serial == event.params.serial ||
			event.locals.sessionUser.isAdmin
		) {
			const form = await superValidate(event, userSchema);
			if (!form.valid) {
				return fail(400, form);
			}

			const user = await updateUserBySerial(event.params.serial, {
				serial: form.data.serial.toUpperCase()
			});

			// redirect to the updated user
			throw redirect(302, `/users/${user.serial}`);
		} else {
			throw error(403, `not user ${event.params.serial} or admin`);
		}
	}
};
