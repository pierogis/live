import { type Knex, knex } from 'knex';

import { variables } from '$lib/env';

export let db: Knex;
export function setupClient() {
	db = knex({
		client: 'pg',
		connection: variables.databaseUrl,
		searchPath: ['knex', 'public']
	});
}
