import knex from 'knex';
import type { Knex } from 'knex';

import { variables } from '$lib/env';

export const platesSchema = 'plates';

export let db: Knex;
export function setupDb() {
	db = knex({
		client: 'pg',
		connection: {
			connectionString: variables.databaseUrl,
			ssl: { rejectUnauthorized: false }
		},
		searchPath: ['knex', 'public']
	});
}
