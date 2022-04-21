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

export async function insertReview(
	params: Partial<Review> & Pick<Review, 'modelId' | 'userId'>
): Promise<Review> {
	const review = await prisma.review.upsert({
		where: {
			Review_userId_modelId_unique: {
				modelId: params.modelId,
				userId: params.userId
			}
		},
		update: { description: params.description },
		create: {
			modelId: params.modelId,
			userId: params.userId,
			description: params.description
		}
	});

	return review;
}

export async function updateReview(params: Review): Promise<Review> {
	const review = await prisma.review.update({
		where: {
			id: params.id
		},
		data: { description: params.description }
	});

	return review;
}

export async function deleteReview(params: Pick<Review, 'modelId' | 'userId'>): Promise<void> {
	await prisma.review.delete({
		where: {
			Review_userId_modelId_unique: {
				modelId: params.modelId,
				userId: params.userId
			}
		}
	});
}
