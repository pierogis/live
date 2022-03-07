/** @type {import('./account').RequestHandler} */
export async function get(event) {
	let redirect = '/login';
	if (event.locals.userId) {
		redirect = `/users/${event.locals.userId}`;
	}
	return {
		status: 302,
		headers: { location: redirect }
	};
}
