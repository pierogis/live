import type { Category, Score, Plate, Review, User } from '@prisma/client';

export type FullPlate = Plate & {
	jurisdiction: Jurisdiction;
	scores: Score[];
	images: Image[];
	reviews: (Review & { user: User })[];
};
