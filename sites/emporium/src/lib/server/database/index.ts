import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';

import * as schema from '$db/schema';

export function createD1Client(database: D1Database) {
	return drizzle(database, { schema });
}

export type DrizzleClient = ReturnType<typeof createD1Client>;
