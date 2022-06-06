// api/plates/index.ts

import type { FullPlate } from '$lib/database/models';
import { getFullPlates, createPlate, getPlatePerJurisdiction } from '$lib/database/plates';
import type { Jurisdiction, Prisma } from '@prisma/client';

import type { RequestHandler } from './__types';
export const get: RequestHandler = async ({ url }) => {
	try {
		const distinct = url.searchParams.get('distinct');

		let plates: FullPlate[];

		if (distinct == 'jurisdictionId') {
			plates = await getPlatePerJurisdiction();
		} else {
			plates = await getFullPlates();
		}

		return {
			status: 200,
			headers: {
				'cache-control': 'no-store'
			},
			body: plates
		};
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
};

/** @type {import('./api/plates/index').RequestHandler} */
export async function post({ locals, request }) {
	try {
		if (locals.user?.isAdmin) {
			const json: {
				jurisdiction: Partial<Jurisdiction>;
				startYear?: number;
				endYear?: number;
				imageUrls: string[];
			} = await request.json();

			if (!json.jurisdiction) {
				return {
					status: 400,
					body: { error: `jurisdiction not provided` }
				};
			}

			const data: Prisma.PlateCreateInput = {
				jurisdiction: { connect: { ...json.jurisdiction } },
				startYear: json.startYear,
				endYear: json.endYear,
				model: {
					create: {
						ware: { connect: { name: 'plate' } },
						images: {
							createMany: {
								data: json.imageUrls.map((imageUrl) => {
									return { url: imageUrl };
								})
							}
						}
					}
				}
			};

			try {
				const plate = await createPlate(data);

				return {
					status: 200,
					body: plate
				};
			} catch (error) {
				if (error.code == 'P2002') {
					return {
						status: 400,
						body: { error: `one of image urls (${json.imageUrls}) already exists` }
					};
				}
			}
		} else {
			return {
				status: 403,
				body: { error: `not admin` }
			};
		}
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
}
