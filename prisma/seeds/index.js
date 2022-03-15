const { PrismaClient } = require('@prisma/client');
const { jurisdictions } = require('./jurisdictions');

const prisma = new PrismaClient();

async function main() {
	await prisma.jurisdiction.createMany({ data: jurisdictions });
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
