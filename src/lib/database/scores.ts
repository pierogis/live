import { prisma } from '.';
import type { Score } from '@prisma/client';

export async function getScores(
	params: Partial<Omit<Score, 'explanation'>>,
	take: number = undefined,
	skip = 0
): Promise<Score[]> {
	const scores = await prisma.score.findMany({ where: params, take, skip });

	return scores;
}

export async function upsertScore(
	params: Partial<Score> & Pick<Score, 'plateId' | 'userId' | 'category'>
): Promise<Score> {
	const score = await prisma.score.upsert({
		where: {
			plateId_userId_category: {
				plateId: params.plateId,
				userId: params.userId,
				category: params.category
			}
		},
		update: { value: params.value },
		create: {
			plateId: params.plateId,
			userId: params.userId,
			category: params.category,
			value: params.value
		}
	});

	return score;
}

export async function deleteScore(
	params: Pick<Score, 'plateId' | 'userId' | 'category'>
): Promise<void> {
	await prisma.score.delete({
		where: {
			plateId_userId_category: {
				plateId: params.plateId,
				userId: params.userId,
				category: params.category
			}
		}
	});
}
