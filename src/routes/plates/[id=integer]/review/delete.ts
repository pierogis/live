// plates/[id=integer]/review/delete.ts

import { reviewIdInputName } from './_form';

/** @type {import('./plates/[id=integer]/review/delete').RequestHandler} */
export async function post({ locals, request, params }) {
	if (locals.user) {
		const formData: FormData = await request.formData();

		const modelId = parseInt(params.id);

		const reviewIdEntry = formData.get(reviewIdInputName);

		await fetch(`/api/plates/${modelId}/reviews/${reviewIdEntry.toString()}`, { method: 'delete' });

		return {
			status: 303,
			headers: {
				location: `/plates/${modelId}`
			}
		};
	} else {
		return {
			status: 301,
			headers: {
				location: `/login`
			}
		};
	}
}
