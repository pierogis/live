import { prisma } from '.';
import type { Jurisdiction } from '@prisma/client';
import type { FullPlate } from './models';

export async function listJurisdictions(): Promise<Jurisdiction[]> {
	const jurisdictions = await prisma.jurisdiction.findMany();
	return jurisdictions;
}

export async function getJurisdictions(
	params: Partial<Jurisdiction>,
	take: number = undefined,
	skip = 0
): Promise<Jurisdiction[]> {
	const jurisdictions = await prisma.jurisdiction.findMany({ where: params, take, skip });

	return jurisdictions;
}

export async function getJurisdiction(params: Partial<Jurisdiction>): Promise<Jurisdiction> {
	const jurisdiction = await prisma.jurisdiction.findFirst({ where: params });

	return jurisdiction;
}

export async function getJurisidictionWithPlates(
	params: Partial<Jurisdiction>
): Promise<Jurisdiction & { plates: FullPlate[] }> {
	const jurisdictions = await prisma.jurisdiction.findUnique({
		where: params,
		include: {
			plates: {
				include: {
					jurisdiction: true,
					images: true,
					scores: true,
					reviews: { include: { user: true } }
				}
			}
		}
	});

	return jurisdictions;
}
