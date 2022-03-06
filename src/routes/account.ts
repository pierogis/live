/** @type {import('./account').RequestHandler} */
export async function get(event) {
	let redirect = '/login';
	if (event.locals.user) {
		redirect = `/users/${event.locals.user.id}`;
	}
	return {
		status: 302,
		headers: { location: redirect }
	};
}
