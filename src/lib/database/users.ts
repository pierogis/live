import { db } from './client';
import type { User } from './models';

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
