import pkg from '@prisma/client';
const { PrismaClient } = pkg;

import { jurisdictions } from './jurisdictions';
import { users } from './users';
import { wares } from './wares';
import { categories } from './categories';

const prisma = new PrismaClient();

async function main() {
	await prisma.jurisdiction.createMany({ data: jurisdictions });
	await prisma.user.createMany({ data: users });
	await prisma.ware.createMany({ data: wares });
	await prisma.category.createMany({ data: categories });
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
