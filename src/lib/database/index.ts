import knex from 'knex';
import type { Knex } from 'knex';

import { variables } from '$lib/env';

export const platesSchema = 'plates';

export let db: Knex;
export function setupDb() {
	db = knex({
		client: 'pg',
		connection: variables.databaseUrl,
		searchPath: ['knex', 'public']
	});
}
