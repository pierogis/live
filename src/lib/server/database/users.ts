import { eq, and, ne } from 'drizzle-orm';

import { type User, users, type NewUser } from '$db/schema';

import { db } from '.';

export const getUsers = async (
	params: Partial<Omit<User, 'isAdmin'>>,
	take: number | undefined = undefined,
	skip = 0
) =>
	await db.query.users.findMany({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.email ? eq(table.email, params.email) : undefined,
				params.serial ? eq(table.serial, params.serial) : undefined
			),
		limit: take,
		offset: skip
	});

export const getSessionUser = async (params: Partial<Omit<User, 'isAdmin'>>) =>
	await db.query.users.findFirst({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.email ? eq(table.email, params.email) : undefined,
				params.serial ? eq(table.serial, params.serial) : undefined
			)
	});

export const getUserWithInteractions = async (params: Partial<Omit<User, 'isAdmin'>>) =>
	await db.query.users.findFirst({
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

export const createUser = async (partial: NewUser) =>
	(await db.insert(users).values(partial).returning())[0];

export const updateUserById = async (id: User['id'], data: Partial<Omit<User, 'isAdmin' | 'id'>>) =>
	(await db.update(users).set(data).where(eq(users.id, id)).returning())[0];

export const updateUserBySerial = async (
	serial: User['serial'],
	data: Partial<Omit<User, 'isAdmin' | 'id'>>
) => (await db.update(users).set(data).where(eq(users.serial, serial)).returning())[0];

export const deleteUser = async (id: number) =>
	(
		await db
			.delete(users)
			.where(and(eq(users.id, id), ne(users.isAdmin, true)))
			.returning()
	)[0];
