import { db } from './client';

export enum Category {
	overall = 'overall',
	identifiability = 'identifiability',
	colors = 'colors',
	symbols = 'symbols',
	typeface = 'typeface',
	clarity = 'clarity'
}

export interface Score {
	plateId: number;
	userId: number;
	category: Category;
	value: number;
	description: string;
}

export type Review = {
	[category in Category]?: Score;
};

export async function getScores(
	params: { plateId?: number; userId?: string; category?: Category },
	count: number = null,
	skip = 0
): Promise<Score[]> {
	const scoresQuery = db
		.withSchema('emporium')
		.table<Score>('scores')
		.select()
		.where(params)
		.offset(skip);

	if (count != null) {
		scoresQuery.limit(count);
	}

	return await scoresQuery;
}
