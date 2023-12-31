import type { User } from '$db/schema';
import { error } from '@sveltejs/kit';

export async function protectAdmin(sessionUser: App.SessionUser | null) {
	if (sessionUser === null) {
		error(401, 'not signed in');
	} else if (!sessionUser.isAdmin) {
		error(403, 'not admin');
	}
}

export async function protectUser(sessionUser: App.SessionUser | null, user: User) {
	if (sessionUser === null) {
		error(401, 'not signed in');
	} else if (sessionUser.id !== user.id) {
		error(403, 'not user');
	}
}

export async function protectUserOrAdmin(
	sessionUser: App.SessionUser | null,
	user: { id: number }
) {
	if (sessionUser === null) {
		error(401, 'not signed in');
	} else if (!sessionUser.isAdmin && sessionUser.id !== user.id) {
		error(403, 'not user');
	}
}
