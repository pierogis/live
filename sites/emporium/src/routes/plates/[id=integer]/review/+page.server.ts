import { fail, redirect } from '@sveltejs/kit';

import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { deleteReview, getReview, upsertReview } from '$queries';
import { schema } from '$lib/forms/review';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals, params }) => {
	const { plate } = await parent();

	if (locals.sessionUser === null) {
		redirect(302, `/login`);
	}

	const review = (await getReview(locals.db, {
		modelId: parseInt(params.id),
		userId: locals.sessionUser.id
	})) || {
		id: undefined,
		modelId: parseInt(params.id),
		userId: locals.sessionUser.id,
		description: ''
	};

	const form = await superValidate(review, zod(schema));

	const canonical = `https://emporium.pierogis.live/plates/${params.id}/review`;
	const title = `${plate.jurisdiction.name} plate (${plate.startYear || '?'}-${
		plate.endYear || '?'
	}) review`;
	const description = title;

	return { canonical, title, description, form };
};

export const actions: Actions = {
	update: async ({ locals, params, request }) => {
		if (locals.sessionUser !== null) {
			const modelId = parseInt(params.id);
			const userId = locals.sessionUser.id;

			const form = await superValidate(request, zod(schema));

			if (!form.valid) {
				// Again, always return { form } and things will just work.
				return fail(400, { form });
			}

			if (form.data.userId !== userId) {
				// Again, always return { form } and things will just work.
				return message(form, 'Review does not belong to you', { status: 401 });
			}

			if (!form.data.description || (form.data.description == '' && form.data.id)) {
				await deleteReview(locals.db, { modelId, userId: form.data.userId });

				redirect(303, `/plates/${modelId}`);
			} else {
				const data = {
					id: form.data.id,
					modelId,
					userId: form.data.userId,
					description: form.data.description
				};

				await upsertReview(locals.db, data);

				redirect(303, `/plates/${modelId}`);
			}
		} else {
			redirect(302, `/login`);
		}
	},
	delete: async ({ locals, params, request }) => {
		if (locals.sessionUser !== null) {
			const modelId = parseInt(params.id);
			const userId = locals.sessionUser.id;

			const form = await superValidate(request, zod(schema));

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

			await deleteReview(locals.db, reviewParams);
			redirect(303, `/plates/${modelId}`);
		} else {
			redirect(302, `/login`);
		}
	}
};
