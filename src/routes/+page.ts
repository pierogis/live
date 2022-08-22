import { redirect } from '@sveltejs/kit';

import { browser } from '$app/env';
import { goto } from '$app/navigation';

export const load = async () => {
	const location = '/plates';

	// TODO: temporary workaround https://github.com/sveltejs/kit/issues/5952
	if (browser) return await goto(location);
	else throw redirect(301, location);
};
