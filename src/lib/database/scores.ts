import { db, platesSchema } from '.';

import type { Category, Score } from './models';

export async function getScores(
	params: { plateId?: number; userId?: string; category?: Category },
	count: number = null,
	skip = 0
): Promise<Score[]> {
	const scoresQuery = db
		.withSchema(platesSchema)
		.table('scores')
		.select()
		.where(params)
		.offset(skip);

	if (count != null) {
		scoresQuery.limit(count);
	}

	return await scoresQuery;
}
