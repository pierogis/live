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
