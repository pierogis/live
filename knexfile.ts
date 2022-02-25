import type { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
	development: {
		client: 'pg',
		connection: process.env.DATABASE_URL || { database: 'plates' },
		migrations: {
			extension: 'ts'
		}
	}
};

module.exports = config;
