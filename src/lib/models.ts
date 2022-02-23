export interface Plate {
	id: number;
	state: string;
	startYear: number;
	endYear: number;
	scores: Scores;
}

export interface Score {
	value: number;
	description: string;
}

export interface Scores {
	overall: Score;
	identifiability: Score;
	colors: Score;
	symbols: Score;
	typeface: Score;
	clarity: Score;
}
