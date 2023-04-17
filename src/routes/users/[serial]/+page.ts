export const load = async ({ parent, data, fetch }) => {
	const { user, categories } = data;

	const { sessionUser } = await parent();
	const isUser = sessionUser && sessionUser.id == user.id;
	const isAdmin = sessionUser && sessionUser.isAdmin;

	if (isUser) user.email = sessionUser.email;

	return { user, isUser, isAdmin, categories };
};
