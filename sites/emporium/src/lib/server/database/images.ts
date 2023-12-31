import { eq, like, sql } from 'drizzle-orm';

import { type Image, type NewImage, images } from '$db/schema';

import { db } from '.';

export const getImages = async (
	params: Partial<Image>,
	take: number | undefined = undefined,
	skip = 0
) =>
	await db.query.images.findMany({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.modelId ? eq(table.modelId, params.modelId) : undefined,
				params.url ? like(table.url, sql`%${params.url}%`) : undefined
			),
		limit: take,
		offset: skip
	});

export const createImage = async (data: NewImage) =>
	(
		await db
			.insert(images)
			.values({
				modelId: data.modelId,
				url: data.url
			})
			.returning()
	)[0];

export const deleteImages = async (id: Image['id']) =>
	(await db.delete(images).where(eq(images.id, id)).returning())[0];
