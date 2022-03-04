import { db } from './client';
import type { Jurisdiction } from './models';

export async function listJurisdictions(): Promise<Jurisdiction[]> {
	return await db.withSchema('emporium').table<Jurisdiction>('jurisdictions').select();
}
