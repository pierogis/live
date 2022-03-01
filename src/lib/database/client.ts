import { knex } from 'knex';

import { variables } from '$lib/env';

export const db = knex({
	client: 'pg',
	connection: variables.databaseUrl,
	searchPath: ['knex', 'public']
});
