import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

if (process.env.CLOUDFLARE_ACCOUNT_ID === undefined) {
	throw 'missing CLOUDFLARE_ACCOUNT_ID in .env';
}
if (process.env.CLOUDFLARE_DATABASE_ID === undefined) {
	throw 'missing CLOUDFLARE_DATABASE_ID in .env';
}
if (process.env.CLOUDFLARE_D1_TOKEN === undefined) {
	throw 'missing CLOUDFLARE_D1_TOKEN in .env';
}

export default defineConfig({
	out: './migrations',
	schema: './src/db/schema.ts',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
		databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
		token: process.env.CLOUDFLARE_D1_TOKEN!
	}
});
