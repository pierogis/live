export interface Plate {
	id: number;
	jurisdiction: string;
	startYear: number;
	endYear: number;
	scoresheet: Scoresheet;
}

export interface Score {
	value: number;
	description: string;
}

export interface Scoresheet {
	overall: Score;
	identifiability: Score;
	colors: Score;
	symbols: Score;
	typeface: Score;
	clarity: Score;
}

export class Jurisdiction {
	abbreviation: string;
	name: string;
}
