import type { Score, Plate, Review, User, Jurisdiction, Image } from '@prisma/client';

export type FullPlate = Plate & {
	jurisdiction: Jurisdiction;
	model: {
		scores: Score[];
		images: Image[];
		reviews: (Review & { user: User })[];
	};
};
