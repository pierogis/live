import { error, json } from '@sveltejs/kit';

import type { Jurisdiction } from '$db/schema';

import { deletePlate, getFullPlate, helpUpdatePlate } from '$lib/server/database/plates';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async (event) => {
	const plate = await getFullPlate(event.locals.db, { modelId: parseInt(event.params.id) });

	if (plate) {
		event.setHeaders({
			'cache-control': 'no-cache, max-age=3600'
		});

		return json(plate);
	} else {
		error(404, `plate ${event.params.id} not found`);
	}
};

export const PUT: RequestHandler = async (event) => {
	if (event.locals.sessionUser?.isAdmin) {
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
		} = await event.request.json();

		const modelId: number = parseInt(event.params.id);

		const plate = helpUpdatePlate(
			event.locals.db,
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

export const DELETE: RequestHandler = async (event) => {
	if (event.locals.sessionUser?.isAdmin) {
		const modelId = parseInt(event.params.id);
		const plate = await deletePlate(event.locals.db, modelId);

		return json(plate);
	} else {
		error(403, 'not admin');
	}
};
