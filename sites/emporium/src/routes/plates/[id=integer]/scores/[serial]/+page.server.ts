import { error, fail } from '@sveltejs/kit';

import { getUserWithInteractions, deleteScore, upsertScore } from '$queries';

import { valueInputName, categoryIdInputName } from './_form';

export const load = async ({ locals, params }) => {
	const user = await getUserWithInteractions(locals.db, { serial: params.serial });

	if (user === undefined) {
		error(404, "user doesn't exist");
	}

	const isUser = locals.sessionUser?.id == user.id;

	return { user, isUser };
};

export const actions = {
	update: async ({ locals, request, params }) => {
		if (locals.sessionUser !== null) {
			const formData: FormData = await request.formData();

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

			const modelId = parseInt(params.id);
			const userId = locals.sessionUser.id;

			if (value < 0 || value > 10) {
				return fail(400, { message: 'score value less than 0 or greater than 10' });
			}

			const data = {
				modelId,
				userId,
				categoryId,
				value: value
			};

			const score = await upsertScore(locals.db, data);

			return { score };
		} else {
			error(401, 'not signed in');
		}
	},
	delete: async ({ locals, params, request }) => {
		if (locals.sessionUser?.serial == params.serial) {
			const formData: FormData = await request.formData();

			const categoryIdEntry = formData.get(categoryIdInputName);
			if (!categoryIdEntry) {
				return fail(400, { message: 'no categoryId provided' });
			}
			const categoryId = parseInt(categoryIdEntry.toString());

			const modelId = parseInt(params.id);
			const userId = locals.sessionUser.id;

			const scoreParams = {
				modelId,
				userId,
				categoryId
			};

			const score = await deleteScore(locals.db, scoreParams);

			return { score };
		} else {
			error(403, 'not user');
		}
	}
};
