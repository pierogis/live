import { getCategories } from '$queries';

export const load = async ({ locals }) => {
	const categories = await getCategories(locals.db, { ware: 'plate' });

	return {
		categories
	};
};
