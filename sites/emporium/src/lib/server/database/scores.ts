import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

import { type Score, scores, type NewScore } from '$db/schema';
import type { DrizzleClient } from '.';

export const getScores = async (
	db: DrizzleClient,
	params: Partial<Score>,
	take: number | undefined = undefined,
	skip = 0
) => {
	return await db.query.scores.findMany({
		where: (table, { and, eq }) =>
			and(
				params.modelId ? eq(table.modelId, params.modelId) : undefined,
				params.categoryId ? eq(table.categoryId, params.categoryId) : undefined,
				params.userId ? eq(table.userId, params.userId) : undefined,
				params.value ? eq(table.value, params.value) : undefined
			),
		limit: take,
		offset: skip
	});
};

export const upsertScore = async (db: DrizzleClient, params: NewScore) => {
	return (
		await db
			.insert(scores)
			.values(params)
			.onConflictDoUpdate({
				target: [scores.modelId, scores.categoryId, scores.userId],
				set: { value: params.value }
			})
			.returning()
	)[0];
};

export const deleteScore = async (
	db: DrizzleClient,
	params: Pick<Score, 'modelId' | 'userId' | 'categoryId'>
) => {
	return (
		await db
			.delete(scores)
			.where(
				and(
					eq(scores.modelId, params.modelId),
					eq(scores.userId, params.userId),
					eq(scores.categoryId, params.categoryId)
				)
			)
			.returning()
	)[0];
};
