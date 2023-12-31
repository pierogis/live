import { superValidate } from 'sveltekit-superforms/server';
import { schema } from '$lib/forms/review';

export const load = async ({ locals, parent }) => {
	const { plate } = await parent();

	const userReview = plate.model.reviews.find((r) => r.userId == locals.sessionUser?.id) || {
		id: undefined,
		modelId: plate.modelId,
		userId: locals.sessionUser?.id,
		description: ''
	};

	const reviewForm = await superValidate(userReview, schema);

	return {
		reviewForm,
		sessionUser: locals.sessionUser
	};
};
