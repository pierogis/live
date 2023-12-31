import * as dotenv from 'dotenv';

import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';

async function main() {
	try {
		dotenv.config();

		if (process.env.DATABASE_URL === undefined) {
			throw 'missing DATABASE_URL in .env';
		}

		const client = postgres(process.env.DATABASE_URL, { max: 1 });
		const db = drizzle(client);

		// this will automatically run needed migrations on the database
		await migrate(db, { migrationsFolder: './migrations' });
		process.exit(0);
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

main();
