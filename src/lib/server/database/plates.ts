import { prisma } from '.';
import type { Jurisdiction, Plate, Prisma } from '@prisma/client';
import type { FullPlate } from '$lib/models';
import { deleteImages } from './images';

export async function listPlates(): Promise<Plate[]> {
	const plates = await prisma.plate.findMany();
	return plates;
}

export async function getPlates(
	params: Partial<Plate>,
	take: number = undefined,
	skip = 0
): Promise<Plate[]> {
	const plates = await prisma.plate.findMany({
		where: params,
		take,
		skip,
		orderBy: [{ modelId: 'desc' }]
	});

	return plates;
}

export async function getPlatePerJurisdiction(
	take: number = undefined,
	skip = 0
): Promise<FullPlate[]> {
	// one plate per jurisdiction
	const plates = await prisma.plate.findMany({
		take,
		skip,
		distinct: ['jurisdictionId'],
		include: {
			jurisdiction: true,
			model: { include: { scores: true, images: true, reviews: { include: { user: true } } } }
		},
		orderBy: [{ jurisdiction: { abbreviation: 'asc' } }]
	});

	return plates;
}

export async function getFullPlates(take: number = undefined, skip = 0): Promise<FullPlate[]> {
	const plates = await prisma.plate.findMany({
		take,
		skip,
		include: {
			jurisdiction: true,
			model: { include: { scores: true, images: true, reviews: { include: { user: true } } } }
		},
		orderBy: [{ modelId: 'desc' }]
	});

	return plates;
}

export async function getFullPlate(params: Partial<Plate>): Promise<FullPlate> {
	const plate = await prisma.plate.findUnique({
		where: params,
		include: {
			jurisdiction: true,
			model: {
				include: {
					scores: true,
					images: true,
					reviews: { include: { user: true } }
				}
			}
		}
	});

	return plate;
}

export async function getPlate(params: Partial<Plate>): Promise<Plate> {
	const plate = await prisma.plate.findUnique({ where: params });

	return plate;
}

export async function createPlate(data: Prisma.PlateCreateInput): Promise<Plate> {
	const plate = await prisma.plate.create({ data });

	return plate;
}

export async function helpCreatePlate(
	jurisdiction: Partial<Jurisdiction>,
	startYear: number | undefined,
	endYear: number | undefined,
	imageUrls: string[]
) {
	const createInput: Prisma.PlateCreateInput = {
		jurisdiction: { connect: { ...jurisdiction } },
		startYear: startYear,
		endYear: endYear,
		model: {
			create: {
				ware: { connect: { name: 'plate' } },
				images: {
					createMany: {
						data: imageUrls.map((imageUrl) => {
							return { url: imageUrl };
						})
					}
				}
			}
		}
	};

	return await createPlate(createInput);
}

export async function updatePlate(modelId: number, data: Prisma.PlateUpdateInput) {
	return await prisma.plate.update({ where: { modelId }, data });
}
export async function helpUpdatePlate(
	modelId: number,
	jurisdiction: Partial<Jurisdiction>,
	startYear: number | undefined,
	endYear: number | undefined,
	imageUrls: string[]
) {
	await deleteImages({ modelId });

	const data: Prisma.PlateUpdateInput = {
		jurisdiction: { connect: { ...jurisdiction } },
		startYear: startYear,
		endYear: endYear,
		model: {
			update: {
				images: {
					createMany: {
						data: imageUrls.map((imageUrl) => {
							return { url: imageUrl };
						})
					}
				}
			}
		}
	};

	return await updatePlate(modelId, data);
}

export async function deletePlate(modelId: number): Promise<Plate> {
	return await prisma.plate.delete({ where: { modelId } });
}
