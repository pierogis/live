import { knex } from 'knex';

import { variables } from '$lib/env';

console.log(variables.databaseUrl);

export const db = knex({
	client: 'pg',
	connection: variables.databaseUrl,
	searchPath: ['knex', 'public']
});
