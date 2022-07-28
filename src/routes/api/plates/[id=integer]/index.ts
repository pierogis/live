// api/plates/[id=integer]/index.ts

import type { Jurisdiction, Prisma } from '@prisma/client';
import { updatePlate, deletePlate, getFullPlate } from '$lib/database/plates';
import { deleteImages } from '$lib/database/images';

import type { RequestHandler } from './__types';
export const GET: RequestHandler = async ({ params }) => {
	try {
		const plate = await getFullPlate({ modelId: parseInt(params.id) });

		if (plate) {
			return {
				status: 200,
				headers: {
					'cache-control': 'no-cache, max-age=3600'
				},
				body: plate
			};
		} else {
			return {
				status: 404
			};
		}
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
};

export const PUT: RequestHandler = async ({ locals, request, params }) => {
	try {
		if (locals.user?.isAdmin) {
			const json: {
				jurisdiction: Partial<Jurisdiction>;
				startYear?: number;
				endYear?: number;
				imageUrls: string[];
			} = await request.json();

			const modelId: number = parseInt(params.id);

			await deleteImages({ modelId });

			const data: Prisma.PlateUpdateInput = {
				jurisdiction: { connect: { ...json.jurisdiction } },
				startYear: json.startYear,
				endYear: json.endYear,
				model: {
					update: {
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

			const plate = await updatePlate(modelId, data);

			if (plate) {
				return {
					status: 200,
					body: plate
				};
			} else {
				return {
					status: 400
				};
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
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	try {
		if (locals.user?.isAdmin) {
			await deletePlate(parseInt(params.id));

			return {
				status: 200
			};
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
};
