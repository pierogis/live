import { seedJurisdictions } from './jurisdictions.js';
import { seedUsers } from './users.js';
import { seedWares } from './wares.js';
import { seedCategories } from './categories.js';

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const pool = new pg.Pool({
	connectionString: 'postgres://postgres:postgres@localhost:5432/emporium'
});

export const db = drizzle(pool);

import { jurisdictions, users, wares, categories } from '../src/db/schema.js';

async function main() {
	await db.insert(jurisdictions).values(seedJurisdictions);
	await db.insert(users).values(seedUsers);
	await db.insert(wares).values(seedWares);
	await db.insert(categories).values(seedCategories);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
