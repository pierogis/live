import { eq, like, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { type Image, type NewImage, images, type schema } from '$db';

export const getImages = (
	db: PostgresJsDatabase<typeof schema>,
	params: Partial<Image>,
	take: number | undefined = undefined,
	skip = 0
) =>
	db.query.images.findMany({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.modelId ? eq(table.modelId, params.modelId) : undefined,
				params.url ? like(table.url, sql`%${params.url}%`) : undefined
			),
		limit: take,
		offset: skip
	});

export const createImage = async (db: PostgresJsDatabase<typeof schema>, data: NewImage) =>
	db.insert(images).values({
		modelId: data.modelId,
		url: data.url
	});

export const deleteImages = async (db: PostgresJsDatabase<typeof schema>, id: Image['id']) =>
	db.delete(images).where(eq(images.id, id));
