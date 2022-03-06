/** @type {import('./index').RequestHandler} */
export async function get() {
	return {
		status: 301,
		headers: { location: '/plates' }
	};
}
