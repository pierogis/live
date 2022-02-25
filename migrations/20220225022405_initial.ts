import { Knex } from 'knex';

const schema = 'emporium';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createSchema(schema);
	await knex.schema.withSchema(schema).createTable('jurisdictions', function (table) {
		table.string('abbreviation', 2).primary();
		table.string('name').notNullable();
	});

	await knex.schema.withSchema(schema).createTable('plates', function (table) {
		table.increments();

		table.string('jurisdiction').notNullable();
		table
			.foreign('jurisdiction')
			.references('abbreviation')
			.inTable(schema + '.jurisdictions');

		table.string('startYear').notNullable();

		table.string('endYear').notNullable();
	});

	await knex.schema.withSchema(schema).createTable('scoresheets', function (table) {
		table.increments();

		table.integer('plateId').notNullable();
		table
			.foreign('plateId')
			.references('id')
			.inTable(schema + '.plates');

		table.integer('overall').checkBetween([0, 10]);
		table.integer('identifiability').checkBetween([0, 10]);
		table.integer('colors').checkBetween([0, 10]);
		table.integer('symbols').checkBetween([0, 10]);
		table.integer('typeface').checkBetween([0, 10]);
		table.integer('clarity').checkBetween([0, 10]);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.withSchema('emporium').dropTable('jurisdictions');
	await knex.schema.withSchema('emporium').dropTable('plates');
	await knex.schema.withSchema('emporium').dropTable('scoresheets');

	await knex.schema.dropSchema(schema);
}
