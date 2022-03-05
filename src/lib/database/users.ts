import { v4 as uuidv4 } from 'uuid';

import { db } from './client';
import type { User } from './models';

let sessions: {
	[cookie: string]: User;
} = { '0': { id: 0, name: 'karl' } };

export function createSession(user: User): string {
	const uuid = uuidv4();
	sessions[uuid] = user;
	return uuid;
}

export async function getSessionUser(cookie: string): Promise<User> {
	const user = sessions[cookie];

	return user;
}

export async function getUsers(
	params: { id: number; name: string },
	count: number = null,
	skip = 0
): Promise<User[]> {
	const usersQuery = db
		.withSchema('emporium')
		.table<User>('users')
		.select()
		.where(params)
		.offset(skip);

	if (count != null) {
		usersQuery.limit(count);
	}

	return await usersQuery;
}

export async function getUser(
	params: { id: number; name: string },
	count: number = null,
	skip = 0
): Promise<User[]> {
	const usersQuery = db
		.withSchema('emporium')
		.table<User>('users')
		.select()
		.where(params)
		.offset(skip);

	if (count != null) {
		usersQuery.limit(count);
	}

	return await usersQuery;
}
