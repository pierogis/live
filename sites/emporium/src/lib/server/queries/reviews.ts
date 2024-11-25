import { eq, like, and, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { type Review, reviews, type NewReview, type schema } from '$db';

export const getReviews = (
	db: PostgresJsDatabase<typeof schema>,
	params: Partial<Review>,
	take: number | undefined = undefined,
	skip = 0
) =>
	db.query.reviews.findMany({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.modelId ? eq(table.modelId, params.modelId) : undefined,
				params.userId ? eq(table.userId, params.userId) : undefined,
				params.description ? like(table.description, sql`%${params.description}%`) : undefined
			),
		limit: take,
		offset: skip
	});

export const getReview = (db: PostgresJsDatabase<typeof schema>, params: Partial<Review>) =>
	db.query.reviews.findFirst({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.modelId ? eq(table.modelId, params.modelId) : undefined,
				params.userId ? eq(table.userId, params.userId) : undefined,
				params.description ? like(table.description, sql`%${params.description}%`) : undefined
			)
	});

export const upsertReview = (db: PostgresJsDatabase<typeof schema>, params: NewReview) =>
	db
		.insert(reviews)
		.values(params)
		.onConflictDoUpdate({
			target: reviews.id,
			set: { description: params.description }
		});

export const updateReview = (db: PostgresJsDatabase<typeof schema>, params: Review) =>
	db.update(reviews).set({ description: params.description }).where(eq(reviews.id, params.id));

export const deleteReview = (
	db: PostgresJsDatabase<typeof schema>,
	params: Pick<Review, 'modelId' | 'userId'>
) =>
	db
		.delete(reviews)
		.where(and(eq(reviews.modelId, params.modelId), eq(reviews.userId, params.userId)));
