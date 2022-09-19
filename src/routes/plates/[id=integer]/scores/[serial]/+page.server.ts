import { getUser } from '$lib/server/database/users';
import { getFullPlate } from '$lib/server/database/plates';
import { getCategories } from '$lib/server/database/categories';

import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params }) => {
	const user = await getUser({ serial: params.serial });

	const plate = await getFullPlate({ modelId: parseInt(params.id) });
	const categories = await getCategories({ wareName: 'plate' });

	return { user, plate, categories };
};
