import { error, fail, redirect } from '@sveltejs/kit';

import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { users, type Category } from '$db/schema';
import { getCategories, updateUserBySerial } from '$queries';
import { userSchema } from '$lib/forms/user';

export const load = async ({ locals, parent }) => {
	const categories: Category[] = await getCategories(locals.db, { ware: 'plate' });

	const { user } = await parent();

	const form = await superValidate({ serial: user.serial }, zod(userSchema));

	return { user, categories, form };
};

export const actions = {
	default: async ({ locals, params, request }) => {
		if (locals.sessionUser === null) {
			error(401, `not signed in`);
		}
		if (locals.sessionUser.serial == params.serial || locals.sessionUser.isAdmin) {
			const form = await superValidate(request, zod(userSchema));
			if (!form.valid) {
				return fail(400, form);
			}

			const user = await updateUserBySerial(locals.db, params.serial, {
				serial: form.data.serial.toUpperCase()
			}).returning({ serial: users.serial });

			const newUserSerial = user[0].serial;

			// redirect to the updated user
			redirect(302, `/users/${newUserSerial}`);
		} else {
			error(403, `not user ${params.serial} or admin`);
		}
	}
};
