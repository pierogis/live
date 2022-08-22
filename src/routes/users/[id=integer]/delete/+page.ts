import { error } from '@sveltejs/kit';
import { PUBLIC_API_BASE } from '$env/static/public';

import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent, fetch, params }) => {
	const response = await fetch(`${PUBLIC_API_BASE}/users/${params.id}`);
	const user = await response.json();

	if (!user.id) {
		throw error(404, "user doesn't exist");
	}

	const session = await parent();
	const isUser = session.user && session.user.id == user.id;
	const isAdmin = session.user && session.user.isAdmin;

	return { user, isUser, isAdmin };
};
