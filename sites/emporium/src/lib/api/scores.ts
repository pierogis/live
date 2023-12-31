import { writable, type Writable } from 'svelte/store';

import type { Category, Score } from '$db/schema';

async function handleChangeScore(
	fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>,
	score: Score
) {
	if (score.value < 0) {
		await fetch(`/api/plates/${score.modelId}/scores/${score.categoryId}`, {
			method: 'delete'
		});
	} else {
		const data = { value: score.value };
		await fetch(`/api/plates/${score.modelId}/scores/${score.categoryId}`, {
			method: 'put',
			body: JSON.stringify(data)
		});
	}
}

export function storeScores(
	scores: Score[],
	modelId: number,
	userId: number | undefined,
	categories: Category[],
	fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>
) {
	let userScores: {
		[categoryId: number]: Writable<Score>;
	} | null = null;
	if (userId) {
		userScores = categories.reduce<{
			[categoryId: number]: Writable<Score>;
		}>((previous, category) => {
			previous[category.id] = writable({
				modelId: modelId,
				userId: userId,
				categoryId: category.id,
				value: -1
			});
			return previous;
		}, {});
	}

	let editorialScores = categories.reduce<{
		[categoryId: number]: Writable<Score>;
	}>((previous, category) => {
		previous[category.id] = writable({
			modelId: modelId,
			userId: 1,
			categoryId: category.id,
			value: -1
		});
		return previous;
	}, {});
	const allScores = categories.reduce<{
		[categoryId: number]: Writable<Score>[];
	}>((previous, category) => {
		previous[category.id] = [];
		return previous;
	}, {});

	scores.forEach((score) => {
		const scoreStore = writable(score);

		if (userScores && score.userId == userId) {
			userScores[score.categoryId] = scoreStore;
		} else {
			allScores[score.categoryId].push(scoreStore);
		}

		if (score.userId == 1) {
			editorialScores[score.categoryId] = scoreStore;
		}
	});

	categories.forEach((category) => {
		if (userScores) {
			const scoreStore = userScores[category.id];
			allScores[category.id].push(scoreStore);
		}
	});

	if (userScores && userId == 1) {
		editorialScores = userScores;
	}

	if (userScores) {
		Object.values(userScores).forEach((scoreStore) => {
			let fired = false;
			let previousValue: number | null;
			scoreStore.subscribe(async (score) => {
				if (!fired) {
					fired = true;
				} else {
					if (score.value != previousValue) {
						await handleChangeScore(fetch, { ...score, userId: score.userId });
					}
				}
				previousValue = score.value;
			});
		});
	}

	return { userScores, editorialScores, allScores };
}
