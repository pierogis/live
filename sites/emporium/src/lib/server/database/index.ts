import { drizzle as drizzleLibSql } from 'drizzle-orm/libsql';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { createClient } from '@libsql/client';
import * as schema from '$db/schema';

export function createLibSqlClient(url: string) {
	const client = createClient({ url });
	return drizzleLibSql(client, { schema });
}

export function createD1Client(database: D1Database) {
	return drizzleD1(database, { schema });
}

export type DrizzleClient =
	| ReturnType<typeof createLibSqlClient>
	| ReturnType<typeof createD1Client>;
