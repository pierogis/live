import { db } from './client';
import type { User } from './models';

export async function updateUser(user: User): Promise<User> {
	const { id, ...partial } = user;
	const result = await db
		.withSchema('emporium')
		.table<User>('users')
		.update(partial)
		.where({ id })
		.returning(['id', 'jurisdiction', 'startYear', 'endYear']);
	return { id, ...result[0] };
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
	user.name = user.name.toLowerCase();
	const result = await db
		.withSchema('emporium')
		.table<User>('users')
		.insert(user)
		.returning(['id', 'email', 'name']);
	return result[0];
}

export async function getUsers(
	params: { id?: number; name?: string; email?: string },
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

export async function getUser(params: {
	id?: number;
	name?: string;
	email?: string;
}): Promise<User> {
	return await getUsers(params, 1)[0];
}
