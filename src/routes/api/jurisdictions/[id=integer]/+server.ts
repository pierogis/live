import { json } from '@sveltejs/kit';

import { getJurisidictionWithPlates } from '$lib/database/jurisdictions';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ params, setHeaders }) => {
	try {
		const jurisdiction = await getJurisidictionWithPlates({ id: parseInt(params.id) });

		setHeaders({
			'cache-control': 'no-cache'
		});

		return json(jurisdiction);
	} catch (err) {
		console.error(err);
		return new Response(undefined, { status: 500 });
	}
};
