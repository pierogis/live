import { updateReview } from '$lib/server/database/reviews';
import { reviewDescriptionInputName, reviewIdInputName } from './_form';

import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
export const POST: RequestHandler = async ({ locals, request, params }) => {
	if (locals.user) {
		const formData: FormData = await request.formData();

		const modelId = parseInt(params.id);
		const userId: number = locals.user.id;

		const reviewIdEntry = formData.get(reviewIdInputName);
		const descriptionEntry = formData.get(reviewDescriptionInputName);

		const review = {
			id: parseInt(reviewIdEntry.toString()),
			modelId,
			userId,
			description: descriptionEntry ? descriptionEntry.toString() : undefined
		};

		await updateReview(review);

		throw redirect(303, `/plates/${modelId}`);
	} else {
		throw redirect(301, `/login`);
	}
};
