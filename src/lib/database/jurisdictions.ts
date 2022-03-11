import { db, platesSchema } from '.';
import type { Jurisdiction } from './models';

export async function listJurisdictions(): Promise<Jurisdiction[]> {
	return await db.withSchema(platesSchema).table('jurisdictions').select();
}

export async function getJurisdictions(
	params: { abbreviation?: string },
	count: number = null,
	skip = 0
): Promise<Jurisdiction[]> {
	const jurisdictionsQuery = db
		.withSchema(platesSchema)
		.table('jurisdictions')
		.select()
		.where(params)
		.offset(skip);

	if (count != null) {
		jurisdictionsQuery.limit(count);
	}

	return await jurisdictionsQuery;
}

export async function getJurisdiction(params: { abbreviation?: string }): Promise<Jurisdiction> {
	return (await getJurisdictions(params, 1))[0];
}
