import { db } from './client';

import type { Category, Score } from './review';
import type { Image } from './image';

export interface Plate {
	id: number;
	jurisdiction: string;
	startYear: number;
	endYear: number;
	scores: { [userId: string]: { [category in Category]: Score } };
	images: Image[];
}

export function create(request) {}

async function completePlate(partialPlate: Omit<Plate, 'scores' | 'images'>) {
	const scores = await db
		.withSchema('emporium')
		.table<Score>('scores')
		.select()
		.where({
			plateId: partialPlate.id
		})
		.groupBy('userId');

	// need to turn this grouping into an object

	const images = await db.withSchema('emporium').table<Image>('images').select().where({
		plateId: partialPlate.id
	});

	return { ...partialPlate, scores, images };
}

export async function listPlates(): Promise<Plate[]> {
	const partialPlates = await db
		.withSchema('emporium')
		.table<Omit<Plate, 'reviews' | 'images'>>('plates')
		.select();

	const plates = await Promise.all(partialPlates.map(completePlate));

	return plates;
}

export async function getPlates(
	params: { id?: number; jurisdiction?: string },
	count: number = null,
	skip = 0
): Promise<Plate[]> {
	const partialPlatesQuery = db
		.withSchema('emporium')
		.table<Omit<Plate, 'reviews' | 'images'>>('plates')
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
