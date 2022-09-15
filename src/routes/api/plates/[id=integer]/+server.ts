import { error, json } from '@sveltejs/kit';

import type { Jurisdiction, Prisma } from '@prisma/client';
import { updatePlate, deletePlate, getFullPlate } from '$lib/server/database/plates';
import { deleteImages } from '$lib/server/database/images';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const plate = await getFullPlate({ modelId: parseInt(params.id) });

	if (plate) {
		setHeaders({
			'cache-control': 'no-cache, max-age=3600'
		});

		return json(plate);
	} else {
		throw error(404, `plate ${params.id} not found`);
	}
};

export const PUT: RequestHandler = async ({ locals, request, params }) => {
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

		const modelId: number = parseInt(params.id);

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

		const plate = await updatePlate(modelId, data);

		if (plate) {
			return json(plate);
		}
	} else {
		throw error(403, 'not admin');
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (locals.user?.isAdmin) {
		const modelId = parseInt(params.id);
		const plate = await deletePlate(modelId);

		return json(plate);
	} else {
		throw error(403, 'not admin');
	}
};
