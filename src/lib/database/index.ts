import knex from 'knex';
import type { Knex } from 'knex';

import { variables } from '$lib/env';
import { dev } from '$app/env';

export const platesSchema = 'plates';

export let db: Knex;
export function setupDb() {
	db = knex({
		client: 'postgres',
		connection: {
			connectionString: variables.databaseUrl,
			ssl: dev ? false : { rejectUnauthorized: false }
		},
		searchPath: ['knex', 'public']
	});
}
