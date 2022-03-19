import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// import { PrismaClient } from '@prisma/client';
import { jurisdictions } from './jurisdictions';
import { users } from './users';

const prisma = new PrismaClient();

async function main() {
	await prisma.jurisdiction.createMany({ data: jurisdictions });
	await prisma.user.createMany({ data: users });
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
