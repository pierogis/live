import type { PageLoad } from './$types';
export const load: PageLoad = async ({ parent, data }) => {
	const { user } = data;

	const { user: sessionUser } = await parent();
	const isUser = sessionUser && sessionUser.id == user.id;
	const isAdmin = sessionUser && sessionUser.isAdmin;

	return { user, isUser, isAdmin };
};
