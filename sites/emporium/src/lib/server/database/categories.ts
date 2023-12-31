import type { Category } from '$db/schema';
import { db } from '.';

export const getCategories = async (
	params: Partial<Category>,
	take: number | undefined = undefined,
	skip = 0
) =>
	await db.query.categories.findMany({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.name ? eq(table.name, params.name) : undefined,
				params.symbol ? eq(table.symbol, params.symbol) : undefined,
				params.ware ? eq(table.ware, params.ware) : undefined
			),
		limit: take,
		offset: skip
	});
