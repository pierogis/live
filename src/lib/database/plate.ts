import { db } from './client';

import type { Scoresheet } from './scoresheet';
import type { Image } from './image';

export interface Plate {
	id: number;
	jurisdiction: string;
	startYear: number;
	endYear: number;
	scoresheets: Scoresheet[];
	images: Image[];
}

export function create(request) {}

async function completePlate(partialPlate: Omit<Plate, 'scoresheets' | 'images'>) {
	const scoresheets = await db
		.withSchema('emporium')
		.table<Scoresheet>('scoresheets')
		.select()
		.where({
			plateId: partialPlate.id
		});

	const images = await db.withSchema('emporium').table<Image>('images').select().where({
		plateId: partialPlate.id
	});

	return { ...partialPlate, scoresheets, images };
}

export async function listPlates(): Promise<Plate[]> {
	const partialPlates = await db
		.withSchema('emporium')
		.table<Omit<Plate, 'scoresheets' | 'images'>>('plates')
		.select();

	const plates: Plate[] = await Promise.all(partialPlates.map(completePlate));

	return plates;
}

export async function getPlates(
	params: { id?: number; jurisdiction?: string },
	count: number = null,
	skip: number = 0
): Promise<Plate[]> {
	const partialPlatesQuery = db
		.withSchema('emporium')
		.table<Omit<Plate, 'scoresheets' | 'images'>>('plates')
		.select()
		.where(params)
		.offset(skip);

	if (count != null) {
		partialPlatesQuery.limit(count);
	}

	const partialPlates = await partialPlatesQuery;

	const plates: Plate[] = await Promise.all(partialPlates.map(completePlate));

	return plates;
}
