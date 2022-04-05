import { prisma } from '.';
import type { Review } from '@prisma/client';

export async function getReviews(
	params: Partial<Omit<Review, 'explanation'>>,
	take: number = undefined,
	skip = 0
): Promise<Review[]> {
	const reviews = await prisma.review.findMany({ where: params, take, skip });

	return reviews;
}

export async function upsertReview(
	params: Partial<Review> & Pick<Review, 'plateId' | 'userId'>
): Promise<Review> {
	const review = await prisma.review.upsert({
		where: {
			plateId_userId: {
				plateId: params.plateId,
				userId: params.userId
			}
		},
		update: { description: params.description },
		create: {
			plateId: params.plateId,
			userId: params.userId,
			description: params.description
		}
	});

	return review;
}

export async function deleteReview(params: Pick<Review, 'plateId' | 'userId'>): Promise<void> {
	await prisma.review.delete({
		where: {
			plateId_userId: {
				plateId: params.plateId,
				userId: params.userId
			}
		}
	});
}
