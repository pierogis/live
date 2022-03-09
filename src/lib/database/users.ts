import { db, platesSchema } from './client';
import type { User } from './models';

export async function getUsers(
	params: { id?: number; serial?: string; email?: string },
	count: number = null,
	skip = 0
): Promise<User[]> {
	const usersQuery = db.withSchema(platesSchema).table('users').select().where(params).offset(skip);

	if (count != null) {
		usersQuery.limit(count);
	}

	return await usersQuery;
}

export async function getUser(params: {
	id?: number;
	serial?: string;
	email?: string;
}): Promise<User> {
	return (await getUsers(params, 1))[0];
}

export async function createUser(user: Omit<User, 'id' | 'isAdmin'>): Promise<User> {
	user.serial = user.serial.toUpperCase();
	const result = await db
		.withSchema(platesSchema)
		.table('users')
		.insert(user)
		.returning(['id', 'email', 'serial', 'isAdmin']);
	return result[0];
}

export async function updateUser(user: Partial<User> & Pick<User, 'id'>): Promise<User> {
	const { id, ...partial } = user;
	const result = await db
		.withSchema(platesSchema)
		.table('users')
		.update(partial)
		.where({ id })
		.returning(['id', 'serial', 'email', 'isAdmin']);
	return { id, ...result[0] };
}

export async function deleteUser(id: number): Promise<void> {
	return await db.withSchema(platesSchema).table('users').where({ id }).del();
}
