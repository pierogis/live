// plates/[id=integer]/review/delete.ts

import { reviewIdInputName } from './_form';

/** @type {import('./plates/[id=integer]/review/delete').RequestHandler} */
export async function post({ locals, request, params }) {
	if (locals.user) {
		const formData: FormData = await request.formData();

		const plateId = parseInt(params.id);

		const reviewIdEntry = formData.get(reviewIdInputName);

		await fetch(`/api/plates/${plateId}/reviews/${reviewIdEntry.toString()}`, { method: 'delete' });

		return {
			status: 303,
			headers: {
				location: `/plates/${plateId}`
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
