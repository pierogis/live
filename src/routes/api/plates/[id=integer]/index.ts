// api/plates/[id=integer]/index.ts

import type { Jurisdiction, Prisma } from '@prisma/client';
import { updatePlate, deletePlate, getFullPlate } from '$lib/database/plates';
import { deleteImages } from '$lib/database/images';

/** @type {import('./api/plates/[id=integer]/index').RequestHandler} */
export async function get({ params }: { params: { id: string } }) {
	try {
		const parsedParams = { ...params, id: parseInt(params.id) };
		const plate = await getFullPlate(parsedParams);

		if (plate) {
			return {
				status: 200,
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
}

/** @type {import('./api/plates/[id=integer]/index').RequestHandler} */
export async function put({ locals, request, params }) {
	try {
		if (locals.user?.isAdmin) {
			const json: {
				jurisdiction: Partial<Jurisdiction>;
				startYear?: number;
				endYear?: number;
				imageUrls: string[];
			} = await request.json();

			const plateId: number = parseInt(params.id);

			await deleteImages({ plateId });

			const data: Prisma.PlateUpdateInput = {
				jurisdiction: { connect: { ...json.jurisdiction } },
				startYear: json.startYear,
				endYear: json.endYear,
				images: {
					createMany: {
						data: json.imageUrls.map((imageUrl) => {
							return { url: imageUrl };
						})
					}
				}
			};

			const plate = await updatePlate(plateId, data);

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
}

/** @type {import('./api/plates/[id=integer]/index').RequestHandler} */
export async function del({ locals, params }) {
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
}
