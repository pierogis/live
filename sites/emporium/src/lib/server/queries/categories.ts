import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type { Category, schema } from '$db';

export const getCategories = (
	db: PostgresJsDatabase<typeof schema>,
	params: Partial<Category>,
	take: number | undefined = undefined,
	skip = 0
) =>
	db.query.categories.findMany({
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
