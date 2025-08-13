import { eq, like, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

import * as schema from '$db/schema';
import { type Image, type NewImage, images } from '$db/schema';
import type { DrizzleClient } from '.';

export const getImages = async (
	db: DrizzleClient,
	params: Partial<Image>,
	take: number | undefined = undefined,
	skip = 0
) => {
	return await db.query.images.findMany({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.modelId ? eq(table.modelId, params.modelId) : undefined,
				params.url ? like(table.url, sql`%${params.url}%`) : undefined
			),
		limit: take,
		offset: skip
	});
};

export const createImage = async (db: DrizzleClient, data: NewImage) => {
	return (
		await db
			.insert(images)
			.values({
				modelId: data.modelId,
				url: data.url
			})
			.returning()
	)[0];
};

export const deleteImages = async (db: DrizzleClient, id: Image['id']) => {
	return (await db.delete(images).where(eq(images.id, id)).returning())[0];
};
