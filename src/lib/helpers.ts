/** @type {import('@sveltejs/kit').Load} */
export function protect({ session, props }) {
	if (!session.user) {
		return {
			status: 401,
			error: 'not signed in'
		};
	} else if (!session.user.isAdmin) {
		return {
			status: 403,
			error: 'not admin'
		};
	} else {
		return {
			props
		};
	}
}
