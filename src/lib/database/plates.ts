import { prisma } from '.';
import type { Plate, Prisma } from '@prisma/client';
import type { FullPlate } from './models';

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
		orderBy: [{ id: 'desc' }]
	});

	return plates;
}

export async function getPlatePerJurisdiction(take: number = undefined, skip = 0) {
	// one plate per jurisdiction
	const plates = await prisma.plate.findMany({
		take,
		skip,
		distinct: ['jurisdictionId'],
		include: { jurisdiction: true, images: true },
		orderBy: [{ jurisdiction: { abbreviation: 'asc' } }]
	});

	return plates;
}

export async function getFullPlates(take: number = undefined, skip = 0) {
	const plates = await prisma.plate.findMany({
		take,
		skip,
		include: { jurisdiction: true, scores: true, images: true },
		orderBy: [{ id: 'desc' }]
	});

	return plates;
}

export async function getFullPlate(params: Partial<Plate>): Promise<FullPlate> {
	const plate = await prisma.plate.findUnique({
		where: params,
		include: {
			jurisdiction: true,
			scores: true,
			images: true,
			reviews: { include: { user: true } }
		}
	});

	return plate;
}

export async function getPlate(params: Partial<Plate>): Promise<Plate> {
	const plate = await prisma.plate.findUnique({ where: params });

	return plate;
}

export async function createPlate(partial: Prisma.PlateCreateInput): Promise<Plate> {
	const plate = await prisma.plate.create({ data: partial });

	return plate;
}

export async function updatePlate(id: number, partial: Prisma.PlateUpdateInput) {
	return await prisma.plate.update({ where: { id }, data: partial });
}

export async function deletePlate(id: number): Promise<void> {
	await prisma.plate.delete({ where: { id } });
}
