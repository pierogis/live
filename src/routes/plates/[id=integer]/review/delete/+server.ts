import { PUBLIC_API_BASE } from '$env/static/public';
import { redirect } from '@sveltejs/kit';

import { reviewIdInputName } from '../_form';

import type { RequestHandler } from './$types';
export const POST: RequestHandler = async ({ locals, request, params }) => {
	if (locals.user) {
		const formData: FormData = await request.formData();

		const modelId = parseInt(params.id);

		const reviewIdEntry = formData.get(reviewIdInputName);

		await fetch(`${PUBLIC_API_BASE}/plates/${modelId}/reviews/${reviewIdEntry.toString()}`, {
			method: 'delete'
		});

		throw redirect(303, `/plates/${modelId}`);
	} else {
		throw redirect(301, `/login`);
	}
};
