import { eq, and, ne } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

import { type User, users, type NewUser } from '$db/schema';
import type { DrizzleClient } from '.';

export const getUsers = async (
	db: DrizzleClient,
	params: Partial<Omit<User, 'isAdmin'>>,
	take: number | undefined = undefined,
	skip = 0
) => {
	return await db.query.users.findMany({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.email ? eq(table.email, params.email) : undefined,
				params.serial ? eq(table.serial, params.serial) : undefined
			),
		limit: take,
		offset: skip
	});
};

export const getUser = async (db: DrizzleClient, params: Partial<Omit<User, 'isAdmin'>>) => {
	return await db.query.users.findFirst({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.email ? eq(table.email, params.email) : undefined,
				params.serial ? eq(table.serial, params.serial) : undefined
			)
	});
};

export const getUserWithInteractions = async (
	db: DrizzleClient,
	params: Partial<Omit<User, 'isAdmin'>>
) => {
	return await db.query.users.findFirst({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.email ? eq(table.email, params.email) : undefined,
				params.serial ? eq(table.serial, params.serial) : undefined
			),
		with: {
			scores: true,
			reviews: {
				with: {
					model: {
						with: {
							scores: true,
							images: true
						}
					}
				}
			}
		}
	});
};

export const createUser = async (db: DrizzleClient, partial: NewUser) => {
	return (await db.insert(users).values(partial).returning())[0];
};

export const updateUserById = async (
	db: DrizzleClient,
	id: User['id'],
	data: Partial<Omit<User, 'isAdmin' | 'id'>>
) => {
	return (await db.update(users).set(data).where(eq(users.id, id)).returning())[0];
};

export const updateUserBySerial = async (
	db: DrizzleClient,
	serial: User['serial'],
	data: Partial<Omit<User, 'isAdmin' | 'id'>>
) => {
	return (await db.update(users).set(data).where(eq(users.serial, serial)).returning())[0];
};

export const deleteUser = async (db: DrizzleClient, id: number) => {
	return (
		await db
			.delete(users)
			.where(and(eq(users.id, id), ne(users.isAdmin, true)))
			.returning()
	)[0];
};
