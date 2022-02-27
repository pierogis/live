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
	username: string;
	category: Category;
	value: number;
	description: string;
}
