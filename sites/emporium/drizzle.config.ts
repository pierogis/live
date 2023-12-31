import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

if (process.env.DATABASE_URL === undefined) {
	throw 'missing DATABASE_URL in .env';
}

export default {
	out: './migrations',
	schema: './src/db/schema.ts',
	driver: 'pg',
	dbCredentials: {
		connectionString: process.env.DATABASE_URL
	}
} satisfies Config;
