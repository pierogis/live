/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
	development: {
		client: 'postgresql',
		connection: {
			connectionString: require('dotenv').config({ path: '.env' }).parsed.DATABASE_URL,
			ssl: { rejectUnauthorized: false }
		},
		migrations: {
			extension: 'cjs'
		}
	}
};
