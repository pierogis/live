import { error, redirect } from '@sveltejs/kit';

import { getCategories } from '$lib/server/database/categories';
import { updateUserBySerial } from '$lib/server/database/users';
import type { Category, User } from '$db/schema';

export const load = async () => {
	const categories: Category[] = await getCategories({ ware: 'plate' });

	return { categories };
};

export const actions = {
	default: async ({ locals, request, params }) => {
		if (locals.sessionUser === null) {
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

			const user = await updateUserBySerial(params.serial, data);

			// redirect to the updated user
			throw redirect(302, `/users/${user.serial}`);
		} else {
			throw error(403, `not user ${params.serial} or admin`);
		}
	}
};
