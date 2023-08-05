export const load = async (event) => {
	return { sessionUser: event.locals.sessionUser };
};
