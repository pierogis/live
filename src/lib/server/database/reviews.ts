import { eq, like, and, sql } from 'drizzle-orm';

import { type Review, reviews, type NewReview } from '$db/schema';

import { db } from '.';

export const getReviews = async (params: Partial<Review>, take: number = undefined, skip = 0) =>
	await db.query.reviews.findMany({
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

export const getReview = async (params: Partial<Review>) =>
	await db.query.reviews.findFirst({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.modelId ? eq(table.modelId, params.modelId) : undefined,
				params.userId ? eq(table.userId, params.userId) : undefined,
				params.description ? like(table.description, sql`%${params.description}%`) : undefined
			)
	});

export const upsertReview = async (params: NewReview) =>
	(
		await db
			.insert(reviews)
			.values(params)
			.onConflictDoUpdate({
				target: reviews.id,
				set: { description: params.description }
			})
			.returning()
	)[0];

export const updateReview = async (params: Review) =>
	(
		await db
			.update(reviews)
			.set({ description: params.description })
			.where(eq(reviews.id, params.id))
			.returning()
	)[0];

export const deleteReview = async (params: Pick<Review, 'modelId' | 'userId'>) =>
	(
		await db
			.delete(reviews)
			.where(and(eq(reviews.modelId, params.modelId), eq(reviews.userId, params.userId)))
			.returning()
	)[0];
