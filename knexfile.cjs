/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
	development: {
		client: 'postgresql',
		connection: require('dotenv').config({ path: '.env' }).parsed.DATABASE_URL,
		migrations: {
			extension: 'cjs'
		}
	}
};
