import { eq, and } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { type Score, scores, type NewScore, type schema } from '$db';

export const getScores = (
	db: PostgresJsDatabase<typeof schema>,
	params: Partial<Score>,
	take: number | undefined = undefined,
	skip = 0
) =>
	db.query.scores.findMany({
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

export const upsertScore = (db: PostgresJsDatabase<typeof schema>, params: NewScore) =>
	db
		.insert(scores)
		.values(params)
		.onConflictDoUpdate({
			target: [scores.modelId, scores.categoryId, scores.userId],
			set: { value: params.value }
		});

export const deleteScore = (
	db: PostgresJsDatabase<typeof schema>,
	params: Pick<Score, 'modelId' | 'userId' | 'categoryId'>
) =>
	db
		.delete(scores)
		.where(
			and(
				eq(scores.modelId, params.modelId),
				eq(scores.userId, params.userId),
				eq(scores.categoryId, params.categoryId)
			)
		);
