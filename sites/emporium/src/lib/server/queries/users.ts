import { eq, and, ne } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { type User, users, type NewUser, type schema } from '$db';

export const getUsers = (
	db: PostgresJsDatabase<typeof schema>,
	params: Partial<Omit<User, 'isAdmin'>>,
	take: number | undefined = undefined,
	skip = 0
) =>
	db.query.users.findMany({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.email ? eq(table.email, params.email) : undefined,
				params.serial ? eq(table.serial, params.serial) : undefined
			),
		limit: take,
		offset: skip
	});

export const getUser = (
	db: PostgresJsDatabase<typeof schema>,
	params: Partial<Omit<User, 'isAdmin'>>
) =>
	db.query.users.findFirst({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.email ? eq(table.email, params.email) : undefined,
				params.serial ? eq(table.serial, params.serial) : undefined
			)
	});

export const getUserWithInteractions = (
	db: PostgresJsDatabase<typeof schema>,
	params: Partial<Omit<User, 'isAdmin'>>
) =>
	db.query.users.findFirst({
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

export const createUser = (db: PostgresJsDatabase<typeof schema>, partial: NewUser) =>
	db.insert(users).values(partial);

export const updateUserById = (
	db: PostgresJsDatabase<typeof schema>,
	id: User['id'],
	data: Partial<Omit<User, 'isAdmin' | 'id'>>
) => db.update(users).set(data).where(eq(users.id, id));

export const updateUserBySerial = (
	db: PostgresJsDatabase<typeof schema>,
	serial: User['serial'],
	data: Partial<Omit<User, 'isAdmin' | 'id'>>
) => db.update(users).set(data).where(eq(users.serial, serial));

export const deleteUser = (db: PostgresJsDatabase<typeof schema>, id: number) =>
	db.delete(users).where(and(eq(users.id, id), ne(users.isAdmin, true)));
