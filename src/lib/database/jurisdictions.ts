import { prisma } from '.';
import type { Jurisdiction } from '@prisma/client';

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
