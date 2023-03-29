import { deleteReview, getReview, upsertReview } from '$lib/server/database/reviews';
import {
	reviewDescriptionInputName,
	reviewIdInputName,
	reviewUserIdInputName
} from '$lib/forms/review';

import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ parent, params }) => {
	const { plate, sessionUser } = await parent();

	const review = (await getReview({ modelId: parseInt(params.id), userId: sessionUser.id })) || {
		id: null,
		modelId: parseInt(params.id),
		userId: sessionUser.id,
		description: ''
	};

	return { review, plate };
};

export const actions: Actions = {
	update: async ({ locals, request, params }) => {
		if (locals.sessionUser) {
			const formData: FormData = await request.formData();

			const modelId = parseInt(params.id);
			const userId: number = locals.sessionUser.id;

			const reviewIdEntry = formData.get(reviewIdInputName);

			const descriptionEntry = formData.get(reviewDescriptionInputName);

			const description = descriptionEntry ? descriptionEntry.toString() : undefined;

			if (!description || (description == '' && reviewIdEntry)) {
				const reviewUserIdEntry = formData.get(reviewUserIdInputName);
				const reviewUserId = parseInt(reviewUserIdEntry.toString());

				await deleteReview({ modelId, userId: reviewUserId });

				throw redirect(303, `/plates/${modelId}`);
			} else {
				const reviewId = parseInt(reviewIdEntry.toString());

				const data = {
					id: reviewId,
					modelId,
					userId,
					description: description
				};

				await upsertReview(data);

				throw redirect(303, `/plates/${modelId}`);
			}
		} else {
			throw redirect(302, `/login`);
		}
	},
	delete: async ({ locals, request, params }) => {
		if (locals.sessionUser) {
			const formData: FormData = await request.formData();

			const modelId = parseInt(params.id);

			const reviewUserIdEntry = formData.get(reviewUserIdInputName);
			const reviewUserId = parseInt(reviewUserIdEntry.toString());

			const userId: number = locals.sessionUser.id;

			if (userId != reviewUserId && !locals.sessionUser.isAdmin) {
				return fail(401, { message: 'not user' });
			}

			const reviewParams = {
				modelId,
				userId: reviewUserId
			};

			await deleteReview(reviewParams);
			throw redirect(303, `/plates/${modelId}`);
		} else {
			throw redirect(302, `/login`);
		}
	}
};
