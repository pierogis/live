import { error, fail } from '@sveltejs/kit';

import { getUser } from '$lib/server/database/users';

import { deleteScore, upsertScore } from '$lib/server/database/scores';

import { valueInputName, categoryIdInputName } from './_form';

export const load = async ({ params }) => {
	const user = await getUser({ serial: params.serial });

	return { user };
};

export const actions = {
	update: async ({ locals, request, params }) => {
		if (locals.sessionUser) {
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
			const userId: number = locals.sessionUser.id;

			if (value < 0 || value > 10) {
				return fail(400, { message: 'score value less than 0 or greater than 10' });
			}

			const data = {
				modelId,
				userId,
				categoryId,
				value: value
			};

			const score = await upsertScore(data);

			return { score };
		} else {
			throw error(401, 'not signed in');
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
			const userId: number = locals.sessionUser.id;

			const scoreParams = {
				modelId,
				userId,
				categoryId
			};

			const score = await deleteScore(scoreParams);

			return { score };
		} else {
			throw error(403, 'not user');
		}
	}
};
