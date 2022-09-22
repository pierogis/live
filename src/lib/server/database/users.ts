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

export async function getUser(params: Partial<Omit<User, 'isAdmin'>>) {
	const user = await prisma.user.findUnique({
		where: params,
		include: {
			scores: true,
			reviews: {
				include: {
					model: {
						include: {
							scores: true,
							images: true
						}
					}
				}
			}
		}
	});

	return user;
}

export async function createUser(partial: Omit<User, 'id' | 'isAdmin'>) {
	const user = await prisma.user.create({ data: partial });

	return user;
}

export async function updateUserById(
	id: number,
	data: Partial<Omit<User, 'isAdmin' | 'id'>>
): Promise<User> {
	return await prisma.user.update({ where: { id }, data });
}

export async function updateUserBySerial(
	serial: string,
	data: Partial<Omit<User, 'isAdmin' | 'id'>>
): Promise<User> {
	return await prisma.user.update({ where: { serial }, data });
}

export async function deleteUser(id: number): Promise<User> {
	return await prisma.user.delete({ where: { id } });
}
