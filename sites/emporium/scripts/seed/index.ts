import * as dotenv from 'dotenv';

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import * as schema from '../../src/db/schema';

import { seedJurisdictions } from './jurisdictions';
import { seedUsers } from './users.js';
import { seedCategories } from './categories';

async function main() {
	try {
		dotenv.config();

		if (process.env.DATABASE_URL === undefined) {
			throw 'missing DATABASE_URL in .env';
		}

		const client = postgres(process.env.DATABASE_URL, { max: 1 });
		const db = drizzle(client);

		await db.insert(schema.jurisdictions).values(seedJurisdictions);
		await db.insert(schema.users).values(seedUsers);
		await db.insert(schema.categories).values(seedCategories);

		process.exit(0);
	} catch (e) {
		console.log(e);
		process.exit(1);
	}
}

main();
