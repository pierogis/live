// plates/[id=integer]/review/delete.ts

import { reviewIdInputName } from './_form';

import type { RequestHandler } from './__types/delete';
export const post: RequestHandler = async ({ locals, request, params }) => {
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
};
