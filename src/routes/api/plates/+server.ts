import { error, json } from '@sveltejs/kit';

import type { FullPlate } from '$lib/models';
import { getFullPlates, createPlate, getPlatePerJurisdiction } from '$lib/server/database/plates';
import type { Jurisdiction, Prisma } from '@prisma/client';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const distinct = url.searchParams.get('distinct');

	let plates: FullPlate[];

	if (distinct == 'jurisdictionId') {
		plates = await getPlatePerJurisdiction();
	} else {
		plates = await getFullPlates();
	}

	setHeaders({
		'cache-control': 'no-store'
	});

	return json(plates);
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (locals.user?.isAdmin) {
		const {
			jurisdiction,
			startYear,
			endYear,
			imageUrls
		}: {
			jurisdiction: Partial<Jurisdiction>;
			startYear?: number;
			endYear?: number;
			imageUrls: string[];
		} = await request.json();

		if (!jurisdiction) {
			throw error(400, 'jurisdiction not provided');
		}

		const data: Prisma.PlateCreateInput = {
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

		try {
			const plate = await createPlate(data);

			return json(plate);
		} catch (err) {
			if (err.code == 'P2002') {
				throw error(400, `one of image urls (${imageUrls}) already exists`);
			} else throw err;
		}
	} else {
		throw error(403, 'not admin');
	}
};
