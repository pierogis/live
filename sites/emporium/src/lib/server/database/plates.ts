import { eq, like, and, sql, notInArray, desc } from 'drizzle-orm';

import { type Plate, plates, type NewPlate, models, images, type Image } from '$db/schema';
import type { DrizzleClient } from '.';

export const getPlates = async (
	db: DrizzleClient,
	params: Partial<Plate>,
	take: number | undefined = undefined,
	skip = 0
) => {
	return await db.query.plates.findMany({
		where: (table, { and, eq }) =>
			and(
				params.modelId ? eq(table.modelId, params.modelId) : undefined,
				params.jurisdictionId ? eq(table.jurisdictionId, params.jurisdictionId) : undefined,
				params.endYear ? eq(table.endYear, params.endYear) : undefined,
				params.startYear ? like(table.startYear, sql`%${params.startYear}%`) : undefined
			),
		limit: take,
		offset: skip,
		orderBy: [desc(plates.modelId)]
	});
};

export const getFullPlate = async (db: DrizzleClient, params: Partial<Plate>) => {
	return await db.query.plates.findFirst({
		where: (table, { and, eq }) =>
			and(
				params.modelId ? eq(table.modelId, params.modelId) : undefined,
				params.jurisdictionId ? eq(table.jurisdictionId, params.jurisdictionId) : undefined,
				params.endYear ? eq(table.endYear, params.endYear) : undefined,
				params.startYear ? like(table.startYear, sql`%${params.startYear}%`) : undefined
			),
		with: {
			jurisdiction: true,
			model: {
				columns: {},
				with: {
					scores: true,
					reviews: {
						with: {
							user: true
						}
					},
					images: true
				}
			}
		}
	});
};

export const getFullPlates = async (
	db: DrizzleClient,
	params: Partial<Plate>,
	take: number | undefined = undefined,
	skip = 0
) => {
	return await db.query.plates.findMany({
		where: (table, { and, eq }) =>
			and(
				params.modelId ? eq(table.modelId, params.modelId) : undefined,
				params.jurisdictionId ? eq(table.jurisdictionId, params.jurisdictionId) : undefined,
				params.endYear ? eq(table.endYear, params.endYear) : undefined,
				params.startYear ? like(table.startYear, sql`%${params.startYear}%`) : undefined
			),
		with: {
			jurisdiction: true,
			model: {
				columns: {},
				with: {
					scores: true,
					reviews: {
						with: {
							user: true
						}
					},
					images: true
				}
			}
		},
		limit: take,
		offset: skip,
		orderBy: [desc(plates.modelId)]
	});
};

export const getPlatePerJurisdiction = async (
	db: DrizzleClient,
	take: number | undefined = undefined,
	skip = 0
) => {
	// one plate per jurisdiction
	const jurisdictionsWithOnePlate = await db.query.jurisdictions.findMany({
		columns: {},
		with: {
			plates: {
				with: {
					jurisdiction: true,
					model: {
						columns: {},
						with: {
							scores: true,
							reviews: {
								with: {
									user: true
								}
							},
							images: true
						}
					}
				},
				limit: 1
			}
		},
		limit: take,
		offset: skip,
		orderBy: (table, { asc }) => [asc(table.abbreviation)]
	});

	const fullPlates = jurisdictionsWithOnePlate.flatMap((j) => j.plates);

	return fullPlates;
};

export const updatePlate = async (
	db: DrizzleClient,
	modelId: Plate['modelId'],
	data: Omit<NewPlate, 'modelId'>
) => {
	return (
		await db
			.update(plates)
			.set({
				jurisdictionId: data.jurisdictionId,
				startYear: data.startYear,
				endYear: data.endYear
			})
			.where(eq(plates.modelId, modelId))
			.returning()
	)[0];
};

export const deletePlate = async (db: DrizzleClient, modelId: Plate['modelId']) => {
	return (await db.delete(models).where(eq(models.id, modelId)).returning())[0];
};

export const helpCreatePlate = async (
	db: DrizzleClient,
	jurisdictionId: Plate['jurisdictionId'],
	startYear: Plate['startYear'] | undefined,
	endYear: Plate['endYear'] | undefined,
	imageUrls: Image['url'][]
) => {
	return await db.transaction(async (tx) => {
		const model = (await tx.insert(models).values({ ware: 'plate' }).returning())[0];

		if (!model) {
			tx.rollback();
			return;
		}

		const plate = (
			await tx
				.insert(plates)
				.values({
					modelId: model.id,
					jurisdictionId: jurisdictionId,
					startYear: startYear,
					endYear: endYear
				})
				.returning()
		)[0];

		if (!plate) {
			tx.rollback();
			return;
		}

		if (imageUrls.length > 0) {
			await tx.insert(images).values(
				imageUrls.map((url) => ({
					modelId: model.id,
					url: url
				}))
			);
		}

		return plate;
	});
};

export const helpUpdatePlate = async (
	db: DrizzleClient,
	modelId: Plate['modelId'],
	jurisdictionId: Plate['jurisdictionId'],
	startYear: Plate['startYear'] | undefined,
	endYear: Plate['endYear'] | undefined,
	imageUrls: Image['url'][]
) => {
	return await db.transaction(async (tx) => {
		const plate = (
			await tx
				.update(plates)
				.set({
					jurisdictionId: jurisdictionId,
					startYear: startYear,
					endYear: endYear
				})
				.where(eq(plates.modelId, modelId))
				.returning()
		)[0];

		if (!plate) {
			tx.rollback();
			return;
		}

		// delete images that are not in the put array
		await tx
			.delete(images)
			.where(and(eq(images.modelId, modelId), notInArray(images.url, imageUrls)));

		// insert images that are not a duplicate modelId-url
		if (imageUrls.length > 0) {
			await tx
				.insert(images)
				.values(
					imageUrls.map((url) => ({
						modelId: modelId,
						url: url
					}))
				)
				.onConflictDoNothing({ target: images.url });
		}

		return plate;
	});
};
