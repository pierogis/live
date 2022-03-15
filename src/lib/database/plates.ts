import { prisma } from '.';
import type { Plate } from '@prisma/client';

export async function listPlates(): Promise<Plate[]> {
	const plates = await prisma.plate.findMany();
	return plates;
}

export async function getPlates(
	params: Partial<Plate>,
	take: number = undefined,
	skip = 0
): Promise<Plate[]> {
	const plates = await prisma.plate.findMany({ where: params, take, skip });

	return plates;
}

export async function getPlate(params: Partial<Plate>): Promise<Plate> {
	const plate = await prisma.plate.findFirst({ where: params });

	return plate;
}

export async function createPlate(partial: Omit<Plate, 'id'>): Promise<Plate> {
	const plate = await prisma.plate.create({ data: partial });

	return plate;
}

export async function updatePlate(plate: Partial<Plate> & Pick<Plate, 'id'>): Promise<Plate> {
	const { id, ...partial } = plate;
	return await prisma.plate.update({ where: { id }, data: partial });
}

export async function deletePlate(id: number): Promise<void> {
	await prisma.plate.delete({ where: { id } });
}
