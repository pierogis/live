import { db } from '$lib/database';

export async function seedStateTable() {
	await db
		.insertInto(db.state)
		.values([
			{
				abbreviation: 'oh',
				name: 'ohio'
			},
			{
				abbreviation: 'nv',
				name: 'nevada'
			}
		])
		.returning('abbreviation');
}
