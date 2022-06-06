import { goto } from '$app/navigation';
import type { Category, Score } from '@prisma/client';
import { writable, type Writable } from 'svelte/store';

async function handleChangeScore(score: Score) {
	if (!score.userId) {
		goto(`/login?redirectUrl=/plates/${score.modelId}`);
	} else {
		if (score.value) {
			const data = { value: score.value };
			await fetch(`/api/plates/${score.modelId}/scores/${score.categoryId}`, {
				method: 'put',
				body: JSON.stringify(data)
			});
		} else {
			await fetch(`/api/plates/${score.modelId}/scores/${score.categoryId}`, {
				method: 'delete'
			});
		}
	}
}

export function storeScores(
	scores: Score[],
	modelId: number,
	userId: number,
	categories: Category[]
) {
	const userScoreStores = categories.reduce<{
		[categoryId: number]: Writable<Score>;
	}>((previous, category) => {
		previous[category.id] = writable({
			modelId: modelId,
			userId: userId,
			categoryId: category.id,
			value: null
		});
		return previous;
	}, {});

	let editorialScoreStores = categories.reduce<{
		[categoryId: number]: Writable<Score>;
	}>((previous, category) => {
		previous[category.id] = writable({
			modelId: modelId,
			userId: 1,
			categoryId: category.id,
			value: null
		});
		return previous;
	}, {});
	const allScoreStores = categories.reduce<{
		[categoryId: number]: Writable<Score>[];
	}>((previous, category) => {
		previous[category.id] = [];
		return previous;
	}, {});

	scores.forEach((score) => {
		const scoreStore = writable(score);

		if (score.userId == userId) {
			userScoreStores[score.categoryId] = scoreStore;
		}

		if (score.userId == 1) {
			editorialScoreStores[score.categoryId] = scoreStore;
		}

		allScoreStores[score.categoryId].push(scoreStore);
	});

	if (userId == 1) {
		editorialScoreStores = userScoreStores;
	}

	Object.entries(userScoreStores).forEach(([_categoryId, scoreStore]) => {
		let fired = false;
		let previousValue: number;
		scoreStore.subscribe(async (score) => {
			if (!fired) {
				fired = true;
			} else {
				if (score.value != previousValue) {
					await handleChangeScore(score);
				}
			}
			previousValue = score.value;
		});
	});

	return { userScoreStores, editorialScoreStores, allScoreStores };
}
