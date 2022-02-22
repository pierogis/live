export interface Plate {
	id: number;
	state: string;
	startYear: number;
	endYear: number;
	scores: Scores;
}

export interface Scores {
	overall: number;
	identifiability: number;
}
