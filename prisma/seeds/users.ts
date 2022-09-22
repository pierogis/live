import type { User } from '@prisma/client';

export const users: Omit<User, 'id'>[] = [
	{ email: 'karl@pierogis.live', serial: 'KARL1', isAdmin: true }
];
