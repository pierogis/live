import type { Category, Prisma } from '@prisma/client';
import { prisma } from '.';

export async function getCategories(params: Prisma.CategoryWhereInput): Promise<Category[]> {
	return await prisma.category.findMany({ where: params });
}
