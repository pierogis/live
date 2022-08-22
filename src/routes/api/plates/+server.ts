import { json } from '@sveltejs/kit';

import type { FullPlate } from '$lib/database/models';
import { getFullPlates, createPlate, getPlatePerJurisdiction } from '$lib/database/plates';
import type { Jurisdiction, Prisma } from '@prisma/client';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ url, setHeaders }) => {
	try {
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
	} catch (err) {
		console.error(err);
		return new Response(undefined, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	try {
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
				return json(
					{ error: `jurisdiction not provided` },
					{
						status: 400
					}
				);
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
			} catch (error) {
				if (error.code == 'P2002') {
					return json(
						{ error: `one of image urls (${imageUrls}) already exists` },
						{
							status: 400
						}
					);
				}
			}
		} else {
			return json(
				{ error: `not admin` },
				{
					status: 403
				}
			);
		}
	} catch (err) {
		console.error(err);
		return new Response(undefined, { status: 500 });
	}
};
