import type { Category, Score, Plate, Review } from '@prisma/client';

// export type Review = {
// 	[category in Category]?: { value: number; explanation: string };
// };

export type FullPlate = Plate & {
	jurisdiction: Jurisdiction;
	scores: Score[];
	images: Image[];
	reviews: Review[];
};
