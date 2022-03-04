import { db } from './client';

export function create(request) {}

export async function listPlates(): Promise<Plate[]> {
	return await db.withSchema('emporium').table<Plate>('plates').select();
}

export async function getPlates(
	params: { id?: number; jurisdiction?: string },
	count: number = null,
	skip = 0
): Promise<Plate[]> {
	const platesQuery = db
		.withSchema('emporium')
		.table<Plate>('plates')
		.select()
		.where(params)
		.offset(skip);

	if (count != null) {
		platesQuery.limit(count);
	}

	return await platesQuery;
}
