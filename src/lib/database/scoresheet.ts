export interface Score {
	value: number;
	description: string;
}

export interface Scoresheet {
	id: number;
	plateId: number;
	overall: Score;
	identifiability: Score;
	colors: Score;
	symbols: Score;
	typeface: Score;
	clarity: Score;
}
