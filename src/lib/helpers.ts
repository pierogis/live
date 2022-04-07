/** @type {import('@sveltejs/kit').Load} */
export async function protect(session, callback: () => Promise<any>) {
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
		return await callback();
	}
}
