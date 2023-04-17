import type { User } from '@prisma/client';
import { error } from '@sveltejs/kit';

export async function protectAdmin<T>(sessionUser: SessionUser, callback?: () => Promise<T>) {
	if (!sessionUser) {
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
	sessionUser: SessionUser,
	user: User,
	callback?: () => Promise<T>
) {
	if (!sessionUser) {
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
	sessionUser: SessionUser,
	user: User,
	callback?: () => Promise<T>
) {
	if (!sessionUser) {
		throw error(401, 'not signed in');
	} else if (!sessionUser.isAdmin && sessionUser.id !== user.id) {
		throw error(403, 'not user');
	}
	if (callback) {
		return await callback();
	}
}
