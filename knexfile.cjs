/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
	development: {
		client: 'pg',
		connection: {
			connectionString: require('dotenv').config({ path: '.env' }).parsed.DATABASE_URL,
			ssl: { rejectUnauthorized: false } // comment out this line if using local pg
		},
		migrations: {
			extension: 'cjs'
		}
	}
};
