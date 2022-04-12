// plates/[id=integer]/review.ts

import { upsertReview } from '$lib/database/reviews';
import { reviewDescriptionInputName } from './_form';

/** @type {import('./plates/[id=integer]/review').RequestHandler} */
export async function post({ locals, request, params }) {
	if (locals.user) {
		const formData: FormData = await request.formData();

		const plateId = parseInt(params.id);
		const userId: number = locals.user.id;

		const descriptionEntry = formData.get(reviewDescriptionInputName);

		const review = {
			plateId,
			userId,
			description: descriptionEntry ? descriptionEntry.toString() : undefined
		};

		await upsertReview(review);

		// redirect to the updated plate
		return {
			status: 303,
			headers: {
				location: `/plates/${plateId}`
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
}
