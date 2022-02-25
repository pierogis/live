export interface Plate {
	id: number;
	jurisdiction: string;
	startYear: number;
	endYear: number;
	scoresheets: Scoresheet[];
	images: Image[];
}

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

export interface Image {
	id: number;
	plateId: number;
	url: string;
}

export class Jurisdiction {
	abbreviation: string;
	name: string;
}
