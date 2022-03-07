import { db, platesSchema } from './client';
import type { Plate } from './models';

export async function listPlates(): Promise<Plate[]> {
	return await db.withSchema(platesSchema).table<Plate>('plates').select();
}

export async function getPlates(
	params: { id?: number; jurisdiction?: string },
	count: number = null,
	skip = 0
): Promise<Plate[]> {
	const platesQuery = db
		.withSchema(platesSchema)
		.table<Plate>('plates')
		.select()
		.where(params)
		.offset(skip);

	if (count != null) {
		platesQuery.limit(count);
	}

	return await platesQuery;
}

export async function getPlate(params: { id?: number; jurisdiction?: string }): Promise<Plate> {
	return (await getPlates(params, 1))[0];
}

export async function createPlate(plate: Omit<Plate, 'id'>): Promise<Plate> {
	const result = await db
		.withSchema(platesSchema)
		.table<Plate>('plates')
		.insert(plate)
		.returning(['id', 'jurisdiction', 'startYear', 'endYear']);
	return result[0];
}

export async function updatePlate(plate: Plate): Promise<Plate> {
	const { id, ...partial } = plate;
	const result = await db
		.withSchema(platesSchema)
		.table<Plate>('plates')
		.update(partial)
		.where({ id })
		.returning(['id', 'jurisdiction', 'startYear', 'endYear']);
	return { id, ...result[0] };
}

export async function deletePlate(id: number): Promise<void> {
	return await db.withSchema(platesSchema).table<Plate>('plates').where({ id }).del();
}
