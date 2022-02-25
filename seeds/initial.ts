import { Knex } from 'knex';

import { Jurisdiction, Scoresheet, Plate } from '../src/lib/models';

const jurisdictions: Jurisdiction[] = [
	{ abbreviation: 'oh', name: 'ohio' },
	{ abbreviation: 'ny', name: 'new york' },
	{ abbreviation: 'nv', name: 'nevada' },
	{ abbreviation: 'nh', name: 'new hampshire' },
	{ abbreviation: 'nm', name: 'new mexico' }
];

const scoresheet: Scoresheet = {
	overall: { description: 'asd', value: 4.5 },
	identifiability: { description: 'asd', value: 5 },
	colors: { description: 'asd', value: 4.5 },
	symbols: { description: 'asd', value: 5 },
	typeface: { description: 'asd', value: 4.5 },
	clarity: { description: 'asd', value: 5 }
};

const plates: Plate[] = [
	{
		id: 0,
		jurisdiction: 'oh',
		startYear: 2012,
		endYear: 2015,
		scoresheet: scoresheet
	},
	{
		id: 5,
		jurisdiction: 'oh',
		startYear: 2011,
		endYear: 2017,
		scoresheet: scoresheet
	},
	{
		id: 1,
		jurisdiction: 'ny',
		startYear: 2012,
		endYear: 2015,
		scoresheet: scoresheet
	},
	{
		id: 2,
		jurisdiction: 'nv',
		startYear: 2012,
		endYear: 2015,
		scoresheet: scoresheet
	},
	{
		id: 3,
		jurisdiction: 'nh',
		startYear: 2012,
		endYear: 2015,
		scoresheet: scoresheet
	},
	{
		id: 4,
		jurisdiction: 'nm',
		startYear: 2012,
		endYear: 2015,
		scoresheet: scoresheet
	}
];

export async function seed(knex: Knex): Promise<void> {
	await knex.withSchema('emporium').table('jurisdiction').del();
	await knex.withSchema('emporium').table('jurisdiction').insert(jurisdictions);

	await knex.withSchema('emporium').table('plate').del();
	await knex.withSchema('emporium').table('plate').insert(plates);
}
