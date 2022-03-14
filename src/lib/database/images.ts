import { db, platesSchema } from '.';
import type { Image } from './models';

export async function getImages(params: { id?: number; plateId?: number }): Promise<Image[]> {
	const images = await db.withSchema(platesSchema).table('images').select().where(params);

	return images;
}

export async function createImage(partial: Omit<Image, 'id'>): Promise<Image> {
	const images = await db
		.withSchema(platesSchema)
		.table('images')
		.insert({ plateId: partial.plateId, url: partial.url })
		.returning(['id', 'plateId', 'url']);

	return images[0];
}
