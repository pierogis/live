export class Jurisdiction {
	abbreviation: string;
	name: string;
}

export interface Plate {
	id: number;
	jurisdiction: string;
	startYear: number;
	endYear: number;
}

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

export interface Image {
	id: number;
	plateId: number;
	url: string;
}

export interface User {
	id: number;
	email: string;
	name: string;
}
