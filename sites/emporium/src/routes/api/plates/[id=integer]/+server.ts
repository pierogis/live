import { error, json } from '@sveltejs/kit';

import type { Jurisdiction } from '$db/schema';

import { deletePlate, getFullPlate, helpUpdatePlate } from '$queries';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ locals, params, setHeaders }) => {
	const plate = await getFullPlate(locals.db, { modelId: parseInt(params.id) });

	if (plate) {
		setHeaders({
			'cache-control': 'no-cache, max-age=3600'
		});

		return json(plate);
	} else {
		error(404, `plate ${params.id} not found`);
	}
};

export const PUT: RequestHandler = async ({ locals, request, params }) => {
	if (locals.sessionUser?.isAdmin) {
		const {
			jurisdiction,
			startYear,
			endYear,
			imageUrls
		}: {
			jurisdiction: Pick<Jurisdiction, 'id'>;
			startYear?: number;
			endYear?: number;
			imageUrls: string[];
		} = await request.json();

		const modelId: number = parseInt(params.id);

		const plate = helpUpdatePlate(
			locals.db,
			modelId,
			jurisdiction.id,
			startYear,
			endYear,
			imageUrls
		);

		return json(plate);
	} else {
		error(403, 'not admin');
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (locals.sessionUser?.isAdmin) {
		const modelId = parseInt(params.id);
		const plate = await deletePlate(locals.db, modelId);

		return json(plate);
	} else {
		error(403, 'not admin');
	}
};
