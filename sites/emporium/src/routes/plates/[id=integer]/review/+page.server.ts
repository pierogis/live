import { fail, redirect } from '@sveltejs/kit';

import { message, superValidate } from 'sveltekit-superforms/server';
import { valibot } from 'sveltekit-superforms/adapters';

import { deleteReview, getReview, upsertReview } from '$lib/server/database/reviews';
import { schema } from '$lib/forms/review';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { plate } = await event.parent();
	const canonical = `https://emporium.pierogis.live/plates/${event.params.id}/review`;
	const title = `${plate.jurisdiction.name} plate (${plate.startYear || '?'}-${
		plate.endYear || '?'
	}) review`;
	const description = title;

	if (event.locals.sessionUser === null) {
		redirect(302, `/login`);
	}

	const review = (await getReview({
		modelId: parseInt(event.params.id),
		userId: event.locals.sessionUser.id
	})) || {
		id: undefined,
		modelId: parseInt(event.params.id),
		userId: event.locals.sessionUser.id,
		description: ''
	};

	const form = await superValidate(review, valibot(schema));

	return { canonical, title, description, form };
};

export const actions: Actions = {
	update: async (event) => {
		if (event.locals.sessionUser !== null) {
			const modelId = parseInt(event.params.id);
			const userId = event.locals.sessionUser.id;

			const form = await superValidate(event.request, valibot(schema));

			if (!form.valid) {
				// Again, always return { form } and things will just work.
				return fail(400, { form });
			}

			if (form.data.userId !== userId) {
				// Again, always return { form } and things will just work.
				return message(form, 'Review does not belong to you', { status: 401 });
			}

			if (!form.data.description || (form.data.description == '' && form.data.id)) {
				await deleteReview({ modelId, userId: form.data.userId });

				redirect(303, `/plates/${modelId}`);
			} else {
				const data = {
					id: form.data.id,
					modelId,
					userId: form.data.userId,
					description: form.data.description
				};

				await upsertReview(data);

				redirect(303, `/plates/${modelId}`);
			}
		} else {
			redirect(302, `/login`);
		}
	},
	delete: async (event) => {
		if (event.locals.sessionUser !== null) {
			const modelId = parseInt(event.params.id);
			const userId = event.locals.sessionUser.id;

			const form = await superValidate(event.request, valibot(schema));

			if (!form.valid) {
				// Again, always return { form } and things will just work.
				return fail(400, { form });
			}

			if (form.data.userId !== userId && !event.locals.sessionUser.isAdmin) {
				// Again, always return { form } and things will just work.
				return message(form, 'Review does not belong to you', { status: 401 });
			}

			const reviewParams = {
				modelId,
				userId: form.data.userId
			};

			await deleteReview(reviewParams);
			redirect(303, `/plates/${modelId}`);
		} else {
			redirect(302, `/login`);
		}
	}
};
