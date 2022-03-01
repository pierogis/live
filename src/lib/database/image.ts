import { db } from './client';

export interface Image {
	id: number;
	plateId: number;
	url: string;
}

export async function getImages(params: { plateId?: number }): Promise<Image[]> {
	const images = await db.withSchema('emporium').table<Image>('images').select().where(params);

	return images;
}
