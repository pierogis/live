import { superValidate } from 'sveltekit-superforms/server';
import { schema } from '$lib/forms/review';

export const load = async ({ parent }) => {
	const { plate, sessionUser } = await parent();

	const userReview = plate.model.reviews.find((r) => r.userId == sessionUser?.id) || {
		id: null,
		modelId: plate.modelId,
		userId: sessionUser?.id,
		description: ''
	};

	const reviewForm = await superValidate(userReview, schema);

	return {
		reviewForm
	};
};
