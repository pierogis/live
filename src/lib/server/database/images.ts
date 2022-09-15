import { prisma } from '.';
import type { Image } from '@prisma/client';

export async function getImages(
	params: Partial<Omit<Image, 'url'>>,
	take: number = undefined,
	skip = 0
): Promise<Image[]> {
	const images = await prisma.image.findMany({ where: params, take, skip });

	return images;
}

export async function createImage(data: Omit<Image, 'id'>): Promise<Image> {
	const image = await prisma.image.create({ data });

	return image;
}

export async function deleteImages(params: Partial<Image>) {
	return await prisma.image.deleteMany({ where: params });
}
