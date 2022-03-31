import { deleteReview, upsertReview } from '$lib/database/reviews';
import type { Category } from '@prisma/client';
import { reviewDescriptionInputName } from './_form';

/** @type {import('./plates/[id]/reviews').RequestHandler} */
export async function put({ locals, request, params }) {
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

		console.log('karl');

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

/** @type {import('./plates/[id]/reviews/[category]').RequestHandler} */
export async function del({ locals, params }) {
	if (locals.user) {
		const plateId = parseInt(params.id);
		const userId: number = locals.user.id;
		const category: Category = params.category;

		const review = {
			plateId,
			userId,
			category
		};

		await deleteReview(review);

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
