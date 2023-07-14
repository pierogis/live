import { DATABASE_URL } from '$env/static/private';
import * as schema from '$db/schema';

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const migrationClient = postgres(DATABASE_URL, { max: 1 });
// migrate(drizzle(migrationClient), {});

const queryClient = postgres(DATABASE_URL);
export const db = drizzle(queryClient, { schema });
