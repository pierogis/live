import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../src/db/schema';

import { seedJurisdictions } from './jurisdictions';
import { seedUsers } from './users';
import { seedCategories } from './categories';

async function main() {
	const client = postgres(process.env.DATABASE_URL!!, { max: 1 });
	const db = drizzle(client);

	await db.insert(schema.jurisdictions).values(seedJurisdictions);
	await db.insert(schema.users).values(seedUsers);
	await db.insert(schema.categories).values(seedCategories);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
