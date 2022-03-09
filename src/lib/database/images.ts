import { db, platesSchema } from './client';
import type { Image } from './models';

export async function getImages(params: { plateId?: number }): Promise<Image[]> {
	const images = await db.withSchema(platesSchema).table('images').select().where(params);

	return images;
}
