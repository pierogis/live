import { error, fail } from '@sveltejs/kit';

import { getUserWithInteractions } from '$lib/server/database/users';
import { deleteScore, upsertScore } from '$lib/server/database/scores';

import { valueInputName, categoryIdInputName } from './_form';

export const load = async (event) => {
	const user = await getUserWithInteractions(event.locals.db, {
		serial: event.params.serial
	});

	if (user === undefined) {
		error(404, "user doesn't exist");
	}

	const isUser = event.locals.sessionUser?.id == user.id;

	return { user, isUser };
};

export const actions = {
	update: async (event) => {
		if (event.locals.sessionUser !== null) {
			const formData: FormData = await event.request.formData();

			const valueEntry = formData.get(valueInputName);
			if (!valueEntry) {
				return fail(400, { message: 'no value provided' });
			}
			const value = parseInt(valueEntry.toString());

			const categoryIdEntry = formData.get(categoryIdInputName);
			if (!categoryIdEntry) {
				return fail(400, { message: 'no categoryId provided' });
			}
			const categoryId = parseInt(categoryIdEntry.toString());

			const modelId = parseInt(event.params.id);
			const userId = event.locals.sessionUser.id;

			if (value < 0 || value > 10) {
				return fail(400, { message: 'score value less than 0 or greater than 10' });
			}

			const data = {
				modelId,
				userId,
				categoryId,
				value: value
			};

			const score = await upsertScore(event.locals.db, data);

			return { score };
		} else {
			error(401, 'not signed in');
		}
	},
	delete: async (event) => {
		if (event.locals.sessionUser?.serial == event.params.serial) {
			const formData: FormData = await event.request.formData();

			const categoryIdEntry = formData.get(categoryIdInputName);
			if (!categoryIdEntry) {
				return fail(400, { message: 'no categoryId provided' });
			}
			const categoryId = parseInt(categoryIdEntry.toString());

			const modelId = parseInt(event.params.id);
			const userId = event.locals.sessionUser.id;

			const scoreParams = {
				modelId,
				userId,
				categoryId
			};

			const score = await deleteScore(event.locals.db, scoreParams);

			return { score };
		} else {
			error(403, 'not user');
		}
	}
};
