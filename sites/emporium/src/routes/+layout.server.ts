export const load = async (event) => {
	return {
		title: `karl's plate emporium`,
		sessionUser: event.locals.sessionUser
	};
};
