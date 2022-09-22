import { prisma } from '.';
import type { Score } from '@prisma/client';

export async function getScores(
	params: Partial<Score>,
	take: number = undefined,
	skip = 0
): Promise<Score[]> {
	const scores = await prisma.score.findMany({ where: params, take, skip });

	return scores;
}

export async function upsertScore(
	params: Partial<Score> & Pick<Score, 'modelId' | 'userId' | 'categoryId'>
): Promise<Score> {
	const score = await prisma.score.upsert({
		where: {
			modelId_userId_categoryId: {
				modelId: params.modelId,
				userId: params.userId,
				categoryId: params.categoryId
			}
		},
		update: { value: params.value },
		create: {
			modelId: params.modelId,
			userId: params.userId,
			categoryId: params.categoryId,
			value: params.value
		}
	});

	return score;
}

export async function deleteScore(
	params: Pick<Score, 'modelId' | 'userId' | 'categoryId'>
): Promise<Score> {
	return await prisma.score.delete({
		where: {
			modelId_userId_categoryId: {
				modelId: params.modelId,
				userId: params.userId,
				categoryId: params.categoryId
			}
		}
	});
}
