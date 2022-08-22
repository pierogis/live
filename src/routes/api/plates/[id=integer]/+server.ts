import { json } from '@sveltejs/kit';

import type { Jurisdiction, Prisma } from '@prisma/client';
import { updatePlate, deletePlate, getFullPlate } from '$lib/database/plates';
import { deleteImages } from '$lib/database/images';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ params, setHeaders }) => {
	try {
		const plate = await getFullPlate({ modelId: parseInt(params.id) });

		if (plate) {
			setHeaders({
				'cache-control': 'no-cache, max-age=3600'
			});

			return json(plate);
		} else {
			return new Response(undefined, { status: 404 });
		}
	} catch (err) {
		console.error(err);
		return new Response(undefined, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ locals, request, params }) => {
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
			} else {
				return new Response(undefined, { status: 400 });
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

export const DELETE: RequestHandler = async ({ locals, params }) => {
	try {
		if (locals.user?.isAdmin) {
			await deletePlate(parseInt(params.id));

			return new Response(undefined);
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
