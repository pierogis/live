// export class Jurisdiction {
// 	abbreviation: string;
// 	name: string;
// }

// export interface Plate {
// 	id: number;
// 	jurisdiction: string;
// 	startYear: number;
// 	endYear: number;
// }

// export const Category: {
// 	overall: 'overall';
// 	identifiability: 'identifiability';
// 	colors: 'colors';
// 	symbols: 'symbols';
// 	typeface: 'typeface';
// 	clarity: 'clarity';
// };

// export interface Score {
// 	plateId: number;
// 	userId: number;
// 	category: Category;
// 	value: number;
// 	explanation: string;
// }

import type { Category, Score } from '@prisma/client';

export type Review = {
	[category in Category]?: { value: number; explanation: string };
};

// export interface Image {
// 	id: number;
// 	plateId: number;
// 	url: string;
// }

// export interface User {
// 	id: number;
// 	email: string;
// 	serial: string;
// 	isAdmin: boolean;
// }

export type FullPlate = Plate & {
	jurisdiction?: Jurisdiction;
	scores?: Jurisdiction;
	images?: Jurisdiction;
};
