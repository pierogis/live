import { prisma } from '.';
import type { User } from '@prisma/client';

export async function getUsers(
	params: Partial<Omit<User, 'isAdmin'>>,
	take: number = undefined,
	skip = 0
): Promise<User[]> {
	const users = await prisma.user.findMany({ where: params, take, skip });

	return users;
}

export async function getUser(params: Partial<Omit<User, 'isAdmin'>>): Promise<User> {
	const user = await prisma.user.findFirst({ where: params });

	return user;
}

export async function createUser(partial: Omit<User, 'id' | 'isAdmin'>): Promise<User> {
	const user = await prisma.user.create({ data: partial });

	return user;
}

export async function updateUser(
	user: Partial<Omit<User, 'isAdmin'>> & Pick<User, 'id'>
): Promise<User> {
	const { id, ...data } = user;
	return await prisma.user.update({ where: { id }, data });
}

export async function deleteUser(id: number): Promise<void> {
	await prisma.user.delete({ where: { id } });
}
