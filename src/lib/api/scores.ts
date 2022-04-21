import { goto, invalidate } from '$app/navigation';

export async function handleChangeScore(params: {
	value: number;
	categoryId: number;
	userId: number;
	modelId: number;
}) {
	const data = { value: params.value };
	if (!params.userId) {
		goto('/login');
	} else {
		await fetch(`/api/plates/${params.modelId}/scores/${params.categoryId}/${params.userId}`, {
			method: 'put',
			body: JSON.stringify(data)
		});
		invalidate(`/api/plates/${params.modelId}`);
	}
}

export async function handleClearScore(params: {
	categoryId: number;
	userId: number;
	modelId: number;
}) {
	if (!params.userId) {
		goto('/login');
	} else {
		await fetch(`/api/plates/${params.modelId}/scores/${params.categoryId}/${params.userId}`, {
			method: 'delete'
		});
		invalidate(`/api/plates/${params.modelId}`);
	}
}
