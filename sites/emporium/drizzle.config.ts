import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './migrations',
	schema: './src/db/schema.ts',
	dialect: 'sqlite',
	dbCredentials: {
		url: 'file:.wrangler/state/v3/d1/miniflare-D1DatabaseObject/e7352547963de7050bd7d94658afc4fe78b61811b7815da12d90be8e863abf4d.sqlite'
	}
});
