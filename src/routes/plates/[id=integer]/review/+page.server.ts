import { fail, redirect } from '@sveltejs/kit';

import { message, superValidate } from 'sveltekit-superforms/server';

import { deleteReview, getReview, upsertReview } from '$lib/server/database/reviews';
import { schema } from '$lib/forms/review';

export const load = async ({ parent, params }) => {
	const { sessionUser } = await parent();

	const review = (await getReview({ modelId: parseInt(params.id), userId: sessionUser.id })) || {
		id: null,
		modelId: parseInt(params.id),
		userId: sessionUser.id,
		description: ''
	};

	const form = await superValidate(review, schema);

	return { form };
};

export const actions = {
	update: async ({ locals, request, params }) => {
		if (locals.sessionUser !== null) {
			const modelId = parseInt(params.id);
			const userId = locals.sessionUser.id;

			const form = await superValidate(request, schema);

			if (!form.valid) {
				console.log('invalid review update');
				// Again, always return { form } and things will just work.
				return fail(400, { form });
			}

			if (form.data.userId !== userId) {
				// Again, always return { form } and things will just work.
				return message(form, 'Review does not belong to you', { status: 401 });
			}

			if (!form.data.description || (form.data.description == '' && form.data.id)) {
				await deleteReview({ modelId, userId: form.data.userId });

				throw redirect(303, `/plates/${modelId}`);
			} else {
				const data = {
					id: form.data.id,
					modelId,
					userId: form.data.userId,
					description: form.data.description
				};

				console.log(data);

				await upsertReview(data);

				throw redirect(303, `/plates/${modelId}`);
			}
		} else {
			throw redirect(302, `/login`);
		}
	},
	delete: async ({ locals, request, params }) => {
		if (locals.sessionUser !== null) {
			const modelId = parseInt(params.id);
			const userId = locals.sessionUser.id;

			const form = await superValidate(request, schema);

			if (!form.valid) {
				// Again, always return { form } and things will just work.
				return fail(400, { form });
			}

			if (form.data.userId !== userId && !locals.sessionUser.isAdmin) {
				// Again, always return { form } and things will just work.
				return message(form, 'Review does not belong to you', { status: 401 });
			}

			const reviewParams = {
				modelId,
				userId: form.data.userId
			};

			await deleteReview(reviewParams);
			throw redirect(303, `/plates/${modelId}`);
		} else {
			throw redirect(302, `/login`);
		}
	}
};
