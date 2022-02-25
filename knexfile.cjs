/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
	development: {
		client: 'postgresql',
		connection: process.env.DATABASE_URL || { database: 'plates' },
		migrations: {
			extension: 'cjs'
		}
	},

	production: {
		client: 'postgresql',
		connection: process.env.DATABASE_URL || { database: 'plates' },
		migrations: {
			extension: 'cjs'
		}
	}
};
