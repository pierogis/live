import { error, json } from '@sveltejs/kit';

import type { Image, FullPlate, Plate } from '$db/schema';
import {
	getFullPlates,
	helpCreatePlate,
	getPlatePerJurisdiction
} from '$lib/server/database/plates';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async (event) => {
	const distinct = event.url.searchParams.get('distinct');

	let plates: FullPlate[];

	if (distinct == 'jurisdictionId') {
		plates = await getPlatePerJurisdiction(event.locals.db);
	} else {
		plates = await getFullPlates(event.locals.db, {});
	}

	event.setHeaders({
		'cache-control': 'no-store'
	});

	return json(plates);
};

export const POST: RequestHandler = async (event) => {
	if (event.locals.sessionUser?.isAdmin) {
		const {
			jurisdictionId,
			startYear,
			endYear,
			imageUrls
		}: {
			jurisdictionId: Plate['jurisdictionId'];
			startYear?: Plate['startYear'];
			endYear?: Plate['endYear'];
			imageUrls: Image['url'][];
		} = await event.request.json();

		if (!jurisdictionId) {
			error(400, 'jurisdiction not provided');
		}

		try {
			const plate = await helpCreatePlate(
				event.locals.db,
				jurisdictionId,
				startYear,
				endYear,
				imageUrls
			);

			return json(plate);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			if (err.code == 'P2002') {
				error(400, `one of image urls (${imageUrls}) already exists`);
			} else throw err;
		}
	} else {
		error(403, 'not admin');
	}
};
