import type { User } from '$db/schema';
import { error } from '@sveltejs/kit';

export async function protectAdmin<T>(
	sessionUser: SessionUser | null,
	callback?: () => Promise<T>
) {
	if (sessionUser === null) {
		throw error(401, 'not signed in');
	} else if (!sessionUser.isAdmin) {
		throw error(403, 'not admin');
	} else {
		if (callback) {
			return await callback();
		}
	}
}

export async function protectUser<T>(
	sessionUser: SessionUser | null,
	user: User,
	callback?: () => Promise<T>
) {
	if (sessionUser === null) {
		throw error(401, 'not signed in');
	} else if (sessionUser.id !== user.id) {
		throw error(403, 'not user');
	} else {
		if (callback) {
			return await callback();
		}
	}
}

export async function protectUserOrAdmin<T>(
	sessionUser: SessionUser | null,
	user: User,
	callback?: () => Promise<T>
) {
	if (sessionUser === null) {
		throw error(401, 'not signed in');
	} else if (!sessionUser.isAdmin && sessionUser.id !== user.id) {
		throw error(403, 'not user');
	}
	if (callback) {
		return await callback();
	}
}
