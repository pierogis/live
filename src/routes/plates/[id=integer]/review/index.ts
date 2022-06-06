// plates/[id=integer]/review/index.ts

import { updateReview } from '$lib/database/reviews';
import { reviewDescriptionInputName, reviewIdInputName } from './_form';

import type { RequestHandler } from './__types';
export const post: RequestHandler = async ({ locals, request, params }) => {
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

		// redirect to the updated plate
		return {
			status: 303,
			headers: {
				location: `/plates/${modelId}`
			}
		};
	} else {
		return {
			status: 301,
			headers: {
				location: `/login`
			}
		};
	}
};
