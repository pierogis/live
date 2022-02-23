import { Pool } from 'pg';

export const pool = new Pool({
	host: 'localhost',
	user: 'kyle',
	database: 'plates',
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000
});
