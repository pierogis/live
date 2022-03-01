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
