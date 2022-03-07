import { db, platesSchema } from './client';
import type { Jurisdiction } from './models';

export async function listJurisdictions(): Promise<Jurisdiction[]> {
	return await db.withSchema(platesSchema).table<Jurisdiction>('jurisdictions').select();
}
