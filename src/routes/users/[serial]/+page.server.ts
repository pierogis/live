import { error, redirect } from '@sveltejs/kit';

import type { Category, User } from '@prisma/client';
import { getCategories } from '$lib/server/database/categories';
import { updateUserBySerial } from '$lib/server/database/users';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const categories: Category[] = await getCategories({ wareName: 'plate' });

	return { user, categories };
};

export const actions: Actions = {
	default: async ({ locals, request, params }) => {
		if (!locals.sessionUser) {
			throw error(401, `not signed in`);
		}
		if (locals.sessionUser?.serial == params.serial || locals.sessionUser?.isAdmin) {
			const formData = await request.formData();

			// const emailEntry = formData.get('email');
			const serialEntry = formData.get('serial');

			const data: Partial<Omit<User, 'isAdmin'>> & Pick<User, 'serial'> = {
				// ...(emailEntry && { email: emailEntry.toString() }),
				...(serialEntry && { serial: serialEntry.toString().toUpperCase() })
			};

			console.log(data);

			const user = await updateUserBySerial(params.serial, data);

			// redirect to the updated user
			throw redirect(302, `/users/${user.serial}`);
		} else {
			throw error(403, `not user ${params.serial} or admin`);
		}
	}
};
