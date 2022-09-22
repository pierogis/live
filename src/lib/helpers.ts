import { error } from '@sveltejs/kit';

export async function protect<T>(user: SessionUser, callback: () => Promise<T>) {
	if (!user) {
		throw error(401, 'not signed in');
	} else if (!user.isAdmin) {
		throw error(403, 'not admin');
	} else {
		return await callback();
	}
}
