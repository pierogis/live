// api/jurisdictions/[id=integer].ts

import { getJurisidictionWithPlates } from '$lib/database/jurisdictions';

import type { RequestHandler } from './__types/[id=integer]';
export const GET: RequestHandler = async ({ params }) => {
	try {
		const jurisdiction = await getJurisidictionWithPlates({ id: parseInt(params.id) });

		return {
			status: 200,
			headers: {
				'cache-control': 'no-cache'
			},
			body: jurisdiction
		};
	} catch (err) {
		console.error(err);
		return {
			status: 500
		};
	}
};
